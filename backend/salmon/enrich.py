#!/usr/bin/env python3
"""enrich.py — add a prose intro + source URL for every work.

parse.py keeps only trope lists. The work-detail page also wants the opening
prose of the TVTropes article (the closest thing to a description in this dump)
and the source URL. Scanning the 5GB dump per click is far too slow (~5s), so we
precompute one artifact in a single streaming pass.

Output (artifacts/):
    work_meta.json  { "Namespace/Slug": {url, intro} }

Usage (from backend/):
    python -m salmon.enrich
"""
from __future__ import annotations

import json
import os
import time

from . import common as C

WORK_META_PATH = os.path.join(C.ARTIFACT_DIR, "work_meta.json")


def extract_intro(text: str, max_chars: int = 600) -> str:
    """Opening prose of an article: paragraphs before the trope list, minus
    the title line, pull-quotes, and attribution lines."""
    out, total = [], 0
    for ln in text.split("\n")[1:]:        # skip title line
        s = ln.strip()
        if s.startswith("- "):             # trope list begins
            break
        if not s or s.startswith("*") or s.startswith("—"):
            continue
        out.append(s)
        total += len(s)
        if total > max_chars:
            break
    return " ".join(out)[:max_chars].strip()


def main() -> None:
    with open(C.WORKS_PATH, encoding="utf-8") as f:
        works = json.load(f)
    wanted = set(works)                    # "Namespace/Slug" keys we need meta for

    meta: dict[str, dict] = {}
    n_pages = 0
    t0 = time.time()
    for path in C.chunk_files():
        for rec in C.iter_jsonl(path):
            url = rec.get("url", "")
            if not url or not C.is_work_page(url):
                continue
            key = f"{C.namespace_of(url)}/{C.page_slug(url)}"
            if key not in wanted or key in meta:
                continue
            meta[key] = {"url": url, "intro": extract_intro(rec.get("text", ""))}
            n_pages += 1
        print(f"  ...{os.path.basename(path)} done ({len(meta)}/{len(wanted)})",
              flush=True)

    with open(WORK_META_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False)

    dt = time.time() - t0
    print(f"[enrich] done in {dt:.1f}s — {len(meta):,} works -> {WORK_META_PATH}")
    missing = len(wanted) - len(meta)
    if missing:
        print(f"  ({missing} works had no locatable raw page — page shows tropes only)")


if __name__ == "__main__":
    main()
