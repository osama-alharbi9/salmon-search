"""tmdb.py — posters from The Movie Database (TMDB) for films, TV and animation.

Only works TMDB can know are looked up: Film as movies, Series as TV, and
Anime, WesternAnimation and WebAnimation as both. The title is searched
without a trailing note such as "(US)", and only an exact title match counts.
A year in that note or at the end of the id ("Cinderella1950") must match
too. For the animation namespaces, matches TMDB tags as animation win. Among
what is left, the one with the most votes wins. No match means no poster,
which is better than a wrong one.

Answers, misses included, are cached in a small SQLite file, so a work costs
at most one TMDB call per cache period. Network errors are not cached.

Needs TMDB_API_KEY (a v3 key). Without it every lookup returns nothing.
"""
from __future__ import annotations

import json
import os
import re
import sqlite3
import threading
import time
import unicodedata
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

API = "https://api.themoviedb.org/3"
IMG = "https://image.tmdb.org/t/p"
HIT_DAYS = 30
MISS_DAYS = 7

# TVTropes namespace -> TMDB search kinds, in the order to try
KINDS: dict[str, tuple[str, ...]] = {
    "Film": ("movie",),
    "Series": ("tv",),
    "Anime": ("tv", "movie"),
    "WesternAnimation": ("tv", "movie"),
    "WebAnimation": ("tv", "movie"),
}

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_lock = threading.Lock()
_db: sqlite3.Connection | None = None
_db_path: str | None = None


def enabled() -> bool:
    return bool(os.environ.get("TMDB_API_KEY"))


def _cache() -> sqlite3.Connection:
    global _db, _db_path
    path = os.environ.get("SALMON_TMDB_CACHE") or os.path.join(_BACKEND_DIR, "data", "tmdb_cache.sqlite")
    if _db is None or path != _db_path:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        _db = sqlite3.connect(path, check_same_thread=False)
        _db.execute("CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, data TEXT, at REAL NOT NULL)")
        _db.commit()
        _db_path = path
    return _db


def _norm(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = s.lower().replace("&", "and")
    return re.sub(r"[^a-z0-9]+", "", s)


ANIMATED = {"Anime", "WesternAnimation", "WebAnimation"}
TMDB_ANIMATION = 16  # TMDB genre id


def search_title(title: str) -> str:
    """The title to search for: without a trailing parenthetical like "(US)" or "(2004)"."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", title).strip() or title


def year_hint(work_id: str, title: str) -> str | None:
    """A release year the work's title note or id ends with, if any."""
    m = re.search(r"\((?:[^)]*\D)?((?:18|19|20)\d\d)\)\s*$", title)
    if m:
        return m.group(1)
    m = re.search(r"((?:18|19|20)\d\d)$", work_id)
    # "Film/BladeRunner2049" is the title itself, not a release year
    if m and not re.search(m.group(1) + r"\W*$", title):
        return m.group(1)
    return None


def _get(path: str, **params: str) -> dict:
    q = urllib.parse.urlencode({**params, "api_key": os.environ["TMDB_API_KEY"]})
    req = urllib.request.Request(f"{API}{path}?{q}", headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=6) as r:
        return json.load(r)


def _date(r: dict) -> str:
    return r.get("release_date") or r.get("first_air_date") or ""


def _pick(results: list[tuple[str, dict]], title: str, year: str | None, animated: bool) -> tuple[str, dict] | None:
    """The best (kind, result): exact title, matching year, animated first, most votes."""
    want = _norm(title)
    pool = [
        (kind, r) for kind, r in results
        if r.get("poster_path")
        and want in {_norm(r.get(k) or "") for k in ("title", "name", "original_title", "original_name")}
    ]
    if year:
        pool = [(k, r) for k, r in pool if _date(r)[:4] == year]
    if animated and any(TMDB_ANIMATION in (r.get("genre_ids") or []) for _, r in pool):
        pool = [(k, r) for k, r in pool if TMDB_ANIMATION in (r.get("genre_ids") or [])]
    return max(pool, key=lambda kr: kr[1].get("vote_count") or 0) if pool else None


def _lookup(work_id: str, title: str, namespace: str) -> dict | None:
    """One work's TMDB match, or None. Raises on network or API errors."""
    if re.search(r"\([^)]*franchise[^)]*\)\s*$", title, re.I):
        return None  # a franchise page is many works, so no single poster fits
    query = search_title(title)
    found = [
        (kind, r)
        for kind in KINDS.get(namespace, ())
        for r in _get(f"/search/{kind}", query=query, include_adult="false").get("results", [])
    ]
    best = _pick(found, query, year_hint(work_id, title), namespace in ANIMATED)
    if not best:
        return None
    kind, hit = best
    return {
        "poster": f"{IMG}/w342{hit['poster_path']}",
        "poster_small": f"{IMG}/w154{hit['poster_path']}",
        "backdrop": f"{IMG}/w1280{hit['backdrop_path']}" if hit.get("backdrop_path") else None,
        "year": _date(hit)[:4] or None,
        "tmdb_url": f"https://www.themoviedb.org/{kind}/{hit['id']}",
    }


def media(works: list[tuple[str, str, str]]) -> dict[str, dict | None]:
    """TMDB art for (id, title, namespace) triples, keyed by id. None means no match."""
    out: dict[str, dict | None] = {}
    wanted = [w for w in works if w[2] in KINDS]
    for w in works:
        if w[2] not in KINDS:
            out[w[0]] = None
    if not wanted:
        return out

    now = time.time()
    db = _cache()
    ids = [w[0] for w in wanted]
    with _lock:
        rows = db.execute(
            f"SELECT id, data, at FROM media WHERE id IN ({','.join('?' * len(ids))})", ids
        ).fetchall()
    todo = []
    cached = {r[0]: r for r in rows}
    for w in wanted:
        row = cached.get(w[0])
        if row:
            data = json.loads(row[1]) if row[1] else None
            ttl = (HIT_DAYS if data else MISS_DAYS) * 86400
            if now - row[2] < ttl:
                out[w[0]] = data
                continue
        todo.append(w)

    if todo and enabled():
        def run(w: tuple[str, str, str]):
            try:
                return w[0], _lookup(w[0], w[1], w[2]), True
            except Exception:  # noqa: BLE001  network or API error: answer nothing, cache nothing
                return w[0], None, False

        with ThreadPoolExecutor(max_workers=8) as ex:
            found = list(ex.map(run, todo))
        with _lock:
            db.executemany(
                "INSERT OR REPLACE INTO media (id, data, at) VALUES (?, ?, ?)",
                [(i, json.dumps(d) if d else None, now) for i, d, ok in found if ok],
            )
            db.commit()
        for i, d, _ok in found:
            out[i] = d
    for w in todo:
        out.setdefault(w[0], None)
    return out
