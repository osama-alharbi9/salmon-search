"""vds.py — "Vibe, Don't Search": the search input layer.

Two stages feed the search engine. Neither stage ranks results or names a final
trope from a model's memory:

  1. vibe -> phrases   Claude turns a free-text vibe into a JSON array of LOOSE
                       trope-like phrases. It is told not to emit canonical trope
                       names; it only paraphrases the vibe into searchable fragments.

  2. phrases -> tropes The engine's e5 embedding resolution (the same routine the
                       CLI uses) maps each loose phrase onto a REAL trope that exists
                       in the vocabulary. The engine is the source of truth.

The resolved tropes are then ranked by engine.works_by_coverage.
"""
from __future__ import annotations

import json
import os
import re

import numpy as np

from salmon import common as C
from salmon import search as S

# ── vibe -> phrases (Claude) ─────────────────────────────────────────────────
# The model proposes loose phrases ONLY. It must not invent canonical trope names
# (it would hallucinate tropes absent from our index); the engine resolves later.
# We use Claude (the same Anthropic client + key the chat router uses) so this
# works identically in local dev and in production. No local model dependency.
VIBE_MODEL = os.environ.get("SALMON_VDS_MODEL", "claude-haiku-4-5")  # cheap, fast

_VIBE_PROMPT = """You translate a viewer's vibe into short trope-like search phrases.

Rules:
- Output ONLY a JSON array of strings, like ["phrase one", "phrase two"].
- No prose, no markdown, no object, no keys, just the array.
- Each string is a short loose phrase describing a story element, 2 to 5 words.
- Do NOT output official TVTropes names. Use plain descriptive language.
- 4 to 8 phrases. No duplicates.

Vibe: {vibe}

JSON array:"""


def vibe_to_phrases(vibe: str) -> list[str]:
    """Ask Claude for loose trope-like phrases. Returns [] on empty input.

    Reuses the Anthropic client from app.llm (same ANTHROPIC_API_KEY). Raises on
    an API/auth error so the route can surface a clear message.
    """
    vibe = (vibe or "").strip()
    if not vibe:
        return []
    from app import llm
    resp = llm.client().messages.create(
        model=VIBE_MODEL,
        max_tokens=300,
        messages=[{"role": "user", "content": _VIBE_PROMPT.format(vibe=vibe)}],
    )
    text = "".join(b.text for b in resp.content if b.type == "text")
    return _parse_phrases(text)


def _loads_loose(raw: str):
    """json.loads, but tolerant of code fences and surrounding prose.

    Tries the whole string first, then the first [...] array, then the first
    {...} object it can find. Returns None if nothing parses.
    """
    raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    for open_c, close_c in (("[", "]"), ("{", "}")):
        i, j = raw.find(open_c), raw.rfind(close_c)
        if 0 <= i < j:
            try:
                return json.loads(raw[i:j + 1])
            except json.JSONDecodeError:
                continue
    return None


def _parse_phrases(raw: str) -> list[str]:
    """Pull a list of short string phrases out of the model's JSON response.

    Tolerates the two shapes models tend to emit:
    a bare array, or an object wrapping one array value.
    """
    raw = (raw or "").strip()
    if not raw:
        return []
    data = _loads_loose(raw)
    if isinstance(data, dict):
        # an object slipped through: prefer a list-valued field, else its keys
        # ({"phrases":[...]} / {"tropes":[...]} / {"phrase one":"#1", ...}).
        data = next((v for v in data.values() if isinstance(v, list)),
                    list(data.keys()))
    if not isinstance(data, list):
        return []
    out, seen = [], set()
    for item in data:
        s = item.strip() if isinstance(item, str) else ""
        if s and s.lower() not in seen and len(s) <= 60:
            seen.add(s.lower())
            out.append(s)
    return out[:8]


# ── embedding resolution (phrase -> real trope) ──────────────────────────────
# Load the vocabulary + vectors once; the e5 model loads lazily on first resolve.
_VECS: np.ndarray | None = None
_VOCAB: list[str] | None = None
_FREQ: dict[str, int] | None = None
_MODEL = None


def _ensure_artifacts() -> None:
    """Load the trope vectors + vocab, and build the trope-frequency table.

    The 101MB works.json is already parsed and held in memory by salmon.engine
    (engine._WORKS), so we reuse it rather than re-reading the file. We only load
    the trope vectors and vocab here, which the engine does not keep.
    """
    global _VECS, _VOCAB, _FREQ
    if _VECS is not None:
        return
    import json
    from collections import Counter
    from salmon import engine

    _VECS = np.load(C.VECTORS_PATH)
    with open(C.VOCAB_PATH, encoding="utf-8") as f:
        _VOCAB = json.load(f)
    freq: Counter = Counter()
    for rec in engine._WORKS.values():
        freq.update(rec["tropes"])
    _FREQ = dict(freq)


def _ensure_model():
    global _MODEL
    if _MODEL is None:
        from sentence_transformers import SentenceTransformer
        import torch
        device = ("mps" if torch.backends.mps.is_available()
                  else "cuda" if torch.cuda.is_available() else "cpu")
        _MODEL = SentenceTransformer(C.MODEL_NAME, device=device)
    return _MODEL


def resolve_phrases(phrases: list[str]) -> dict:
    """Resolve each loose phrase to a real canonical trope via embeddings.

    Returns {"resolved": [{phrase, trope, sim, count}], "unknown": [...]}.
    'unknown' holds phrases whose best match is too weak to trust as a trope.
    """
    phrases = [p.strip() for p in (phrases or []) if p and p.strip()]
    if not phrases:
        return {"resolved": [], "unknown": []}
    _ensure_artifacts()
    model = _ensure_model()
    qvecs = model.encode(
        [f"query: {p}" for p in phrases],
        convert_to_numpy=True, normalize_embeddings=True,
    ).astype(np.float32)

    resolved, unknown = [], []
    for phrase, qv in zip(phrases, qvecs):
        name, _row, sim, _alts = S.resolve(qv, _VECS, _VOCAB, _FREQ)
        # A very weak best match means the phrase didn't land on a real trope.
        if sim < 0.80:
            unknown.append(phrase)
            continue
        resolved.append({
            "phrase": phrase,
            "trope": name,
            "sim": round(float(sim), 3),
            "count": int(_FREQ.get(name, 0)),
        })
    return {"resolved": resolved, "unknown": unknown}


# ── VDS search: classify inputs (title vs trope), expand, coverage-rank ───────
# Title detection has two paths:
#   1. Explicit "like Firefly" / "works like Firefly" prefix -> always a title.
#   2. Bare text that EXACTLY matches a known work title (e.g. "the office") ->
#      a title too. The guard: if the same text is ALSO a real trope name
#      ("heist" -> the trope, not the film), the trope wins, so we never re-break
#      single ambiguous words. The "like" prefix overrides that guard (it is an
#      explicit "I mean the work" signal).
_LIKE_RE = re.compile(r"^\s*(?:works?\s+)?like\s+(.+)$", re.IGNORECASE)


def _match_work_id(query: str) -> str | None:
    """Return a known work id whose title matches `query` exactly, else None."""
    from salmon import engine
    q = query.strip()
    if not q:
        return None
    norm = C.normalize_name(q)
    for i in engine.find_work(q):
        w = engine._INDEX[i]
        if C.normalize_name(w["title"]) == norm or engine._base(w["title"]) == norm:
            return w["id"]
    return None


def _is_title_shaped(text: str) -> bool:
    """True if bare text is shaped like a work title, not a single trope word.

    A bare single word ("heist", "firefly") is too ambiguous (it is usually a
    trope or resolves to one), so we never auto-treat it as a title. Multi-word
    text, or anything starting with "the ", reads as a title and is allowed to
    match a work. The "like X" prefix bypasses this entirely.
    """
    t = text.strip()
    return t.lower().startswith("the ") or len(t.split()) >= 2


def _looks_like_title(text: str) -> str | None:
    """Return a known work id if `text` names a work, else None.

    "like <Title>" / "works like <Title>" always resolves to the work. A bare
    title ("the office", "attack on titan") also resolves IF it is title-shaped
    AND exactly matches a work, so single ambiguous words ("heist") stay tropes.
    """
    m = _LIKE_RE.match(text)
    if m:                                   # explicit signal: the work wins
        return _match_work_id(m.group(1))
    # bare text: a title only if it is title-shaped AND matches a real work
    if not _is_title_shaped(text):
        return None
    return _match_work_id(text)


# A work can list hundreds of tropes; dumping all of them as chips is unusable
# and washes out the search. Expand a title to its most DISTINCTIVE tropes only.
# "Distinctive" must also be SHARED: the very rarest strings on a page are parse
# noise (episode titles, one-off section headers) that no other work has, so we
# keep only tropes used by enough works to carry signal, then take the rarest of
# those (rare = specific, but still cross-work matchable).
_TITLE_EXPAND_CAP = 12
_EXPAND_MIN_FREQ = 8        # appears in >= this many works (drops parse junk)
_EXPAND_MAX_FREQ = 3000     # not so generic it matches everything


def _distinctive_tropes(tropes: list[str]) -> list[str]:
    """The most distinctive yet still-shared tropes of a work, capped."""
    _ensure_artifacts()
    band = [t for t in tropes
            if _EXPAND_MIN_FREQ <= _FREQ.get(t, 0) <= _EXPAND_MAX_FREQ]
    # rarest within the band first (most specific), then cap
    band.sort(key=lambda t: _FREQ.get(t, 0))
    if band:
        return band[:_TITLE_EXPAND_CAP]
    # fallback: nothing in band (sparse page), take whatever is most common
    return sorted(tropes, key=lambda t: -_FREQ.get(t, 0))[:_TITLE_EXPAND_CAP]


# ── natural-language medium filters ──────────────────────────────────────────
# Phrases like "movies only" or "no visual novels" are FILTERS, not tropes. Map
# spoken media words to corpus namespaces. Each medium has its aliases; order is
# longest-first at match time so "western animation" beats "animation".
_MEDIUM_ALIASES: dict[str, list[str]] = {
    "Film": ["films", "film", "movies", "movie", "cinema"],
    "Series": ["tv shows", "tv show", "tv series", "television", "series",
               "shows", "show", "tv"],
    "Anime": ["anime"],
    "Manga": ["manga"],
    "Literature": ["literature", "books", "book", "novels", "novel"],
    "VideoGame": ["video games", "video game", "videogames", "videogame",
                  "games", "game"],
    "WesternAnimation": ["western animation", "cartoons", "cartoon"],
    "VisualNovel": ["visual novels", "visual novel", "vns", "vn"],
    "ComicBook": ["comic books", "comic book", "comics", "comic"],
    "Webcomic": ["webcomics", "webcomic"],
    "TabletopGame": ["tabletop games", "tabletop game", "tabletop"],
    "Fanfic": ["fanfics", "fanfic", "fan fiction", "fanfiction"],
    "Music": ["music"],
    "Wrestling": ["wrestling"],
    "WebVideo": ["web video", "web videos"],
    "WebAnimation": ["web animation"],
}
# (alias, namespace) pairs, longest alias first so multi-word wins.
_ALIAS_PAIRS = sorted(
    ((a, ns) for ns, al in _MEDIUM_ALIASES.items() for a in al),
    key=lambda p: -len(p[0]),
)
# An input is a filter clause only if it carries one of these filter words, so a
# real trope that happens to contain a medium word ("Show Within a Show") is safe.
_FILTER_RE = re.compile(
    r"\b(only|exclude|excluding|no|not|without|just)\b", re.IGNORECASE)
_EXCLUDE_RE = re.compile(
    r"\b(no|not|without|exclude|excluding)\b", re.IGNORECASE)


def parse_medium_filter(items: list[str]) -> tuple[dict, list[str]]:
    """Pull medium-filter clauses out of the inputs.

    Returns ({"include": [...namespaces], "exclude": [...]}, remaining_items).
    A clause counts as a filter only if it contains a filter word (only / no /
    exclude / just / without). Within a clause every medium alias mentioned is
    collected; a leading negation makes them exclusions. Filter clauses are
    removed from the item list so they never become trope chips.
    """
    include: list[str] = []
    exclude: list[str] = []
    remaining: list[str] = []
    for raw in items:
        if not _FILTER_RE.search(raw):
            remaining.append(raw)
            continue
        low = raw.lower()
        found: list[str] = []
        scratch = low
        for alias, ns in _ALIAS_PAIRS:
            if re.search(r"\b" + re.escape(alias) + r"\b", scratch):
                if ns not in found:
                    found.append(ns)
                scratch = re.sub(r"\b" + re.escape(alias) + r"\b", " ", scratch)
        if not found:                      # filter word but no known medium -> keep
            remaining.append(raw)
            continue
        if _EXCLUDE_RE.search(low):
            exclude.extend(found)
        else:
            include.extend(found)
    return ({"include": list(dict.fromkeys(include)),
             "exclude": list(dict.fromkeys(exclude))}, remaining)


def classify_and_expand(items: list[str]) -> dict:
    """Turn a mixed list of chips (tropes and/or titles) into a flat trope set.

    Each item is checked against the work index first. If it is a known title,
    its tropes are pulled in (so "like Firefly" becomes Firefly's tropes). If it
    is not a title, it is resolved as a trope phrase via embeddings. Returns the
    expanded real tropes plus a record of how each input was classified, so the
    UI can show the resulting chips and which title(s) were expanded.
    """
    from salmon import engine
    items = [s.strip() for s in (items or []) if s and s.strip()]
    titles: list[dict] = []
    phrase_inputs: list[str] = []
    tropes: list[str] = []          # real tropes, de-duped by normalized name
    seen_norm: set[str] = set()

    def add_trope(canon: str) -> None:
        nt = C.normalize_name(canon)
        if nt and nt not in seen_norm:
            seen_norm.add(nt)
            tropes.append(canon)

    # 1) split inputs into known-titles (expand to their tropes) and trope phrases
    for it in items:
        wid = _looks_like_title(it)
        if wid:
            rec = engine._WORKS.get(wid, {})
            pulled = _distinctive_tropes(rec.get("tropes", []))
            titles.append({"input": it, "id": wid,
                           "title": rec.get("title", it), "n_pulled": len(pulled)})
            for t in pulled:
                add_trope(t)
        else:
            phrase_inputs.append(it)

    # 2) resolve the non-title inputs to real tropes (engine is source of truth)
    unknown: list[str] = []
    if phrase_inputs:
        r = resolve_phrases(phrase_inputs)
        for item in r["resolved"]:
            add_trope(item["trope"])
        unknown = r["unknown"]

    return {"tropes": tropes, "titles": titles, "unknown": unknown}


def vds_search(items: list[str], n: int = 25) -> dict:
    """Full VDS search: pull medium filters, classify chips, expand titles, rank.

    The single search path. Tropes drive coverage ranking; a medium filter only
    constrains which namespaces may appear. Filter clauses are removed from the
    items before classification so they never become trope chips.
    """
    from salmon import engine

    # 1) natural-language medium filter, stripped from the trope inputs
    medium, items = parse_medium_filter(items or [])

    # 2) tropes + titles -> coverage
    exp = classify_and_expand(items)
    base = {"medium": medium, "titles": exp["titles"], "unknown": exp["unknown"]}
    if not exp["tropes"]:
        return {**base, "found": False, "tropes": [], "total": 0, "results": []}

    # 3) turn the medium filter into a namespace allowlist for the engine
    allow = _medium_to_namespaces(medium)
    exclude = {t["id"] for t in exp["titles"]}        # drop source works from results
    out = engine.works_by_coverage(exp["tropes"], n=n,
                                   namespaces=allow, exclude_ids=exclude)
    out["titles"] = exp["titles"]
    out["medium"] = medium
    out["unknown"] = list(dict.fromkeys(exp["unknown"] + out.get("unknown", [])))
    out["tropes"] = exp["tropes"]
    return out


def _medium_to_namespaces(medium: dict) -> list[str] | None:
    """Resolve include/exclude medium filters to a concrete namespace allowlist.

    include wins as an allowlist; exclude removes from the full set of corpus
    namespaces. Returns None when no filter is active (no restriction).
    """
    inc, exc = medium.get("include", []), medium.get("exclude", [])
    if inc:
        allow = [ns for ns in inc if ns not in exc]
        return allow or None
    if exc:
        return [ns for ns in sorted(C.WORK_NAMESPACES) if ns not in exc]
    return None
