"""Shared helpers for salmon: on-disk paths and TVTropes page parsing.

Deliberately small and dependency-light so the data builders and the engine can
share parsing rules and paths without dragging in heavy imports.
"""
from __future__ import annotations

import json
import os
import re

# ---------------------------------------------------------------------------
# Paths — resolved relative to this package so the project is portable.
#   backend/salmon/common.py  ->  backend/data/artifacts
# Override either via env var for a different layout / raw-dump location.
# ---------------------------------------------------------------------------
_PKG_DIR = os.path.dirname(os.path.abspath(__file__))          # backend/salmon
_BACKEND_DIR = os.path.dirname(_PKG_DIR)                        # backend

# Raw TVTropes JSONL dump (only needed to (re)build artifacts, not at serve time)
DATA_DIR = os.environ.get("SALMON_DATA_DIR", os.path.join(_BACKEND_DIR, "data", "raw"))
# Built artifacts the engine loads at runtime
ARTIFACT_DIR = os.environ.get(
    "SALMON_ARTIFACT_DIR", os.path.join(_BACKEND_DIR, "data", "artifacts"))

# Parse outputs
WORKS_PATH = os.path.join(ARTIFACT_DIR, "works.json")        # work title -> [trope names]
TROPES_PATH = os.path.join(ARTIFACT_DIR, "tropes.json")      # trope name -> short definition

# Embed outputs
VECTORS_PATH = os.path.join(ARTIFACT_DIR, "trope_vectors.npy")   # (N, D) float32
VOCAB_PATH = os.path.join(ARTIFACT_DIR, "trope_index.json")      # ordered list of trope names

# The embedding model (multilingual e5 small). Kept here so all scripts agree.
MODEL_NAME = "intfloat/multilingual-e5-small"

# ---------------------------------------------------------------------------
# Namespace filter — edit WORK_NAMESPACES to widen/narrow the corpus.
# These are the TVTropes namespaces that contain real *work* pages carrying a
# top-level trope list (verified by trope-bullet density on a sample). Metadata
# namespaces (Laconic, YMMV, Recap, Characters, Funny, WMG, Trivia, Quotes...)
# are deliberately excluded: they're pages *about* works, not works.
# To restrict to anime only again, set this to {"Anime"}.
# ---------------------------------------------------------------------------
WORK_NAMESPACES = {
    "Anime", "Manga", "Film", "Series", "WesternAnimation", "VideoGame",
    "Literature", "ComicBook", "Webcomic", "WebAnimation", "VisualNovel",
    "TabletopGame", "Music", "Fanfic", "WebVideo", "Wrestling",
}
TROPE_NAMESPACE = "Main"        # trope definition pages


def namespace_of(url: str) -> str:
    """Return the wiki namespace (first path segment after pmwiki.php/)."""
    tail = url.split("pmwiki.php/", 1)[-1]
    return tail.split("/", 1)[0]


def page_slug(url: str) -> str:
    """Return the page slug (last path segment)."""
    return url.rstrip("/").rsplit("/", 1)[-1]


def is_work_page(url: str) -> bool:
    return namespace_of(url) in WORK_NAMESPACES


def is_trope_page(url: str) -> bool:
    return namespace_of(url) == TROPE_NAMESPACE


# ---------------------------------------------------------------------------
# Text parsing
# ---------------------------------------------------------------------------
# Top-level trope bullet on a work page looks like:  "- Trope Name: description"
# Nested examples are indented or are continuation lines, so we anchor on the
# line start. Trope names are 2..60 chars and contain no ": " themselves.
_TROPE_BULLET = re.compile(r"^- ([^:\n]{2,60}?): \S")

# Lines that are bullets but NOT tropes (meta sections that use the same syntax).
_NON_TROPE_PREFIXES = (
    "http", "www.", "see ", "compare", "contrast",
)


def title_line(text: str) -> str:
    """First line of a page's text, with the ' - TV Tropes' suffix stripped."""
    first = text.split("\n", 1)[0]
    return re.sub(r"\s*-\s*TV Tropes\s*$", "", first).strip()


def extract_trope_names(text: str) -> list[str]:
    """Extract top-level trope names from a work page body.

    Returns names in page order, de-duplicated (first occurrence wins).
    """
    seen: dict[str, None] = {}
    for line in text.split("\n"):
        m = _TROPE_BULLET.match(line)
        if not m:
            continue
        name = m.group(1).strip()
        low = name.lower()
        if any(low.startswith(p) for p in _NON_TROPE_PREFIXES):
            continue
        seen.setdefault(name, None)
    return list(seen)


def extract_definition(text: str, max_len: int = 400) -> str:
    """First substantive prose paragraph of a trope page = its short definition.

    Skips the title line, pull-quotes ('*...*' / lines starting with the em dash
    attribution), and very short fragments.
    """
    lines = [ln.strip() for ln in text.split("\n")]
    for ln in lines[1:]:
        if not ln or len(ln) < 40:
            continue
        if ln.startswith("*") or ln.startswith("—") or ln.startswith("- "):
            continue
        return ln[:max_len].strip()
    return ""


def normalize_name(name: str) -> str:
    """Loose key for matching a work's trope bullet to a canonical trope name."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def iter_jsonl(path: str):
    """Stream a JSONL file line by line (never loads the whole file)."""
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def chunk_files() -> list[str]:
    """All chunk_*.jsonl files in the data dir, sorted."""
    names = os.listdir(DATA_DIR) if os.path.isdir(DATA_DIR) else []
    files = sorted(
        os.path.join(DATA_DIR, f)
        for f in names
        if f.startswith("chunk_") and f.endswith(".jsonl")
    )
    if not files:
        raise SystemExit(
            f"No chunk_*.jsonl files in {DATA_DIR}. "
            "Run `make fetch` first, or point SALMON_DATA_DIR at the raw dump."
        )
    return files
