#!/usr/bin/env python3
"""engine.py — salmon's recommendation core, as importable functions.

The API (app/) calls into here, so there is one implementation of "find a work",
"recommend similar works" and "rank by trope coverage". Artifacts are loaded once
at import time.
"""
from __future__ import annotations

import difflib
import json
import os
import re

import numpy as np
from scipy import sparse

from . import common as C
from .profiles import WORK_PROFILES_PATH, WORK_INDEX_PATH

# --- load artifacts once -----------------------------------------------------
if not os.path.exists(WORK_PROFILES_PATH):
    raise SystemExit(
        f"Built data not found in {C.ARTIFACT_DIR}. "
        "Run `make data` (full dataset) or `make sample-data` (small demo set)."
    )
_M = sparse.load_npz(WORK_PROFILES_PATH)                 # (W, V) L2-normalized
_INDEX = json.load(open(WORK_INDEX_PATH, encoding="utf-8"))
with open(C.WORKS_PATH, encoding="utf-8") as _f:
    _WORKS = json.load(_f)
_META_PATH = os.path.join(C.ARTIFACT_DIR, "work_meta.json")
try:
    with open(_META_PATH, encoding="utf-8") as _f:
        _META = json.load(_f)            # {"Namespace/Slug": {url, intro}}
except FileNotFoundError:
    _META = {}

# --- precomputed normalized-trope caches (built once, reused per request) -----
# The coverage/AND searches match on normalized trope names. Re-normalizing every
# trope of every work on each request is millions of regex calls (~8s on a small
# CPU, which tripped Railway's request timeout -> 502). Do it ONCE at import:
#   _NORM_TO_CANON : normalized name -> a canonical spelling of that trope
#   _WORK_NORMS    : work id -> frozenset of its tropes' normalized names
_NORM_TO_CANON: dict[str, str] = {}
_WORK_NORMS: dict[str, frozenset] = {}
for _wid, _rec in _WORKS.items():
    _norms = set()
    for _t in _rec["tropes"]:
        _nt = C.normalize_name(_t)
        _norms.add(_nt)
        _NORM_TO_CANON.setdefault(_nt, _t)
    _WORK_NORMS[_wid] = frozenset(_norms)


def _base(title: str) -> str:
    """Normalized title with any trailing '(qualifier)' stripped."""
    return C.normalize_name(re.sub(r"\s*\([^)]*\)\s*$", "", title))


def find_work(query: str) -> list[int]:
    """Candidate row indices for a typed title, best first.

    Exact (treating a trailing '(...)' qualifier as optional) → query contained
    in title → title contained in query → fuzzy. Within each tier, richest page
    (most tropes) first, so the famous work beats a same-named stub.
    """
    q = C.normalize_name(query)

    def richest(i: int) -> int:
        return -_INDEX[i]["n_tropes"]

    exact = [i for i, w in enumerate(_INDEX)
             if C.normalize_name(w["title"]) == q or _base(w["title"]) == q]
    if exact:
        return sorted(exact, key=richest)

    contained = [i for i, w in enumerate(_INDEX)
                 if q and q in C.normalize_name(w["title"])]
    if contained:
        return sorted(contained, key=richest)

    rev = [i for i, w in enumerate(_INDEX)
           if q and C.normalize_name(w["title"]) in q
           and len(C.normalize_name(w["title"])) >= 4]
    if rev:
        return sorted(rev, key=richest)

    titles = [w["title"] for w in _INDEX]
    close = set(difflib.get_close_matches(query, titles, n=12, cutoff=0.7))
    return sorted([i for i, w in enumerate(_INDEX) if w["title"] in close],
                  key=richest)


def search_titles(query: str, limit: int = 8) -> list[dict]:
    """Lightweight title search — what works match this name? (for disambiguation)"""
    rows = find_work(query)[:limit]
    return [{"title": _INDEX[i]["title"], "namespace": _INDEX[i]["namespace"],
             "n_tropes": _INDEX[i]["n_tropes"]} for i in rows]


def work_tropes(namespace: str, title: str) -> dict:
    """Full trope list for a specific work (by namespace + title).

    Resolves the same way the recommender does, then returns every trope so the
    UI can show a work's detail panel. Prefers an exact namespace+title match.
    """
    cands = find_work(title)
    if not cands:
        return {"found": False}
    # prefer the candidate in the requested namespace, else richest
    pick = next((i for i in cands if _INDEX[i]["namespace"] == namespace), cands[0])
    w = _INDEX[pick]
    meta = _META.get(w["id"], {})
    return {
        "found": True,
        "id": w["id"],
        "title": w["title"],
        "namespace": w["namespace"],
        "n_tropes": w["n_tropes"],
        "tropes": _WORKS[w["id"]]["tropes"],
        "intro": meta.get("intro", ""),
        "url": meta.get("url", ""),
    }


def work_by_id(work_id: str) -> dict:
    """Same as work_tropes but keyed by the exact 'Namespace/Slug' id (for the
    work-detail page, where we already know the canonical id)."""
    if work_id not in _WORKS:
        return {"found": False}
    rec = _WORKS[work_id]
    meta = _META.get(work_id, {})
    return {
        "found": True,
        "id": work_id,
        "title": rec["title"],
        "namespace": rec["namespace"],
        "n_tropes": len(rec["tropes"]),
        "tropes": rec["tropes"],
        "intro": meta.get("intro", ""),
        "url": meta.get("url", ""),
    }


def works_by_tropes(tropes: list[str], n: int = 25,
                    namespaces: list[str] | None = None) -> dict:
    """Works that contain ALL of the given trope names (AND logic).

    Matching is on normalized trope names, so case/punctuation differences are
    tolerated. Results are ranked by total trope count (richer pages first) so
    well-documented works lead. Returns the canonical spelling of each query
    trope it could resolve, plus any it couldn't.
    """
    restrict = set(namespaces or [])
    # normalized -> canonical map is precomputed at import (_NORM_TO_CANON)
    norm_to_canon = _NORM_TO_CANON

    wanted, unknown = [], []
    for t in tropes:
        nt = C.normalize_name(t)
        if nt in norm_to_canon:
            wanted.append((nt, norm_to_canon[nt]))
        else:
            unknown.append(t)
    if not wanted:
        return {"found": False, "resolved": [], "unknown": unknown, "results": []}

    want_norm = {nt for nt, _ in wanted}
    hits = []
    for wid, rec in _WORKS.items():
        if restrict and rec["namespace"] not in restrict:
            continue
        owned = _WORK_NORMS[wid]                      # precomputed at import
        if want_norm <= owned:                       # work has ALL wanted tropes
            hits.append((rec["n_tropes"] if "n_tropes" in rec else len(rec["tropes"]),
                         rec))
    hits.sort(key=lambda h: -h[0])
    results, seen = [], set()
    for _, r in hits:
        key = C.normalize_name(r["title"])
        if key in seen:
            continue
        seen.add(key)
        results.append({"id": f'{r["namespace"]}/{r["slug"]}', "title": r["title"],
                        "namespace": r["namespace"], "n_tropes": len(r["tropes"])})
        if len(results) >= n:
            break
    return {
        "found": True,
        "resolved": [canon for _, canon in wanted],
        "unknown": unknown,
        "total": len(hits),
        "results": results,
    }


def works_by_coverage(tropes: list[str], n: int = 25,
                      namespaces: list[str] | None = None,
                      exclude_ids: set[str] | None = None) -> dict:
    """Works ranked by how many of the given tropes they cover (partial allowed).

    Unlike works_by_tropes (strict AND), this surfaces near-misses: a work that
    has 2 of 3 wanted tropes still appears, just below the full matches. Ranking
    is by match count first, then richer pages. Matching is on normalized names,
    so this does NOT touch the cosine/TF-IDF scoring math, it only counts overlap
    over the existing trope data.

    Returns, per result, which wanted tropes it `matched` and which it's `missing`.
    """
    restrict = set(namespaces or [])
    norm_to_canon = _NORM_TO_CANON                       # precomputed at import

    wanted, unknown = [], []
    for t in tropes:
        nt = C.normalize_name(t)
        if nt in norm_to_canon and not any(nt == w for w, _ in wanted):
            wanted.append((nt, norm_to_canon[nt]))
        elif nt not in norm_to_canon:
            unknown.append(t)
    if not wanted:
        return {"found": False, "resolved": [], "unknown": unknown,
                "total": 0, "results": []}

    exclude = exclude_ids or set()
    # One work can have several pages with the same title (redirects, media
    # variants), so dropping a source work means dropping its title, not just its id.
    exclude_titles = {_WORKS[w]["title"] for w in exclude if w in _WORKS}
    want = [(nt, canon) for nt, canon in wanted]
    hits = []
    for wid, rec in _WORKS.items():
        if wid in exclude or rec["title"] in exclude_titles:   # drop source works
            continue
        if restrict and rec["namespace"] not in restrict:
            continue
        owned = _WORK_NORMS[wid]                          # precomputed at import
        matched = [canon for nt, canon in want if nt in owned]
        if not matched:                                  # cover at least one
            continue
        n_tr = rec["n_tropes"] if "n_tropes" in rec else len(rec["tropes"])
        hits.append((len(matched), n_tr, rec, matched))

    # most wanted-tropes covered first, then richer pages
    hits.sort(key=lambda h: (-h[0], -h[1]))
    want_canon = [canon for _, canon in want]
    results, seen = [], set()
    for n_match, _, r, matched in hits:
        key = C.normalize_name(r["title"])
        if key in seen:
            continue
        seen.add(key)
        results.append({
            "id": f'{r["namespace"]}/{r["slug"]}',
            "title": r["title"],
            "namespace": r["namespace"],
            "n_tropes": len(r["tropes"]),
            "matched_count": n_match,
            "wanted_count": len(want_canon),
            "matched_tropes": matched,
            "missing_tropes": [c for c in want_canon if c not in matched],
        })
        if len(results) >= n:
            break
    return {
        "found": True,
        "resolved": want_canon,
        "unknown": unknown,
        "total": len(hits),
        "results": results,
    }


def recommend(title: str, n: int = 10, namespaces: list[str] | None = None,
              min_tropes: int = 15) -> dict:
    """Recommend works most similar to `title`.

    Returns {found: bool, source?: {...}, results?: [...], message?: str}.
    Similarity = cosine of rarity-weighted (TF-IDF) trope vectors.
    """
    restrict = set(namespaces or [])
    cands = find_work(title)
    if not cands:
        return {"found": False,
                "message": f"No work found matching '{title}'. It may not be "
                           "in this TVTropes dump, or only as a metadata page."}

    src = cands[0]
    src_w = _INDEX[src]
    src_tropes = set(_WORKS[src_w["id"]]["tropes"])
    src_norm = C.normalize_name(src_w["title"])

    sims = (_M @ _M[src].T).toarray().ravel()
    order = np.argsort(-sims)

    results = []
    seen: set[str] = set()
    for i in order:
        if i == src:
            continue
        w = _INDEX[i]
        if restrict and w["namespace"] not in restrict:
            continue
        if w["n_tropes"] < min_tropes:
            continue
        nt = C.normalize_name(w["title"])
        if nt == src_norm or nt in seen:
            continue
        if sims[i] <= 0:
            break
        seen.add(nt)
        shared = sorted(src_tropes & set(_WORKS[w["id"]]["tropes"]))
        results.append({
            "id": w["id"],
            "title": w["title"],
            "namespace": w["namespace"],
            "similarity": round(float(sims[i]), 4),
            "shared_count": len(shared),
            "shared_tropes": shared[:12],
        })
        if len(results) >= n:
            break

    return {
        "found": True,
        "source": {
            "title": src_w["title"],
            "namespace": src_w["namespace"],
            "n_tropes": src_w["n_tropes"],
        },
        "results": results,
    }
