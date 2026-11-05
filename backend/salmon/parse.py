#!/usr/bin/env python3
"""parse.py — walk the TVTropes JSONL dump and build two structures:

  works.json   : { "Namespace/Slug" : {title, namespace, slug, tropes:[...]} }
  tropes.json  : { trope name : short definition }        (Main/ namespace)

Works span every namespace in common.WORK_NAMESPACES (anime, manga, film,
series, video games, ...). The dict is keyed by "Namespace/Slug" rather than by
bare title, because titles collide across media (e.g. Film/Aladdin vs
WesternAnimation/Aladdin) and a bare-title key would silently overwrite.

Streams every chunk line-by-line (stdlib json only — never loads a file into
RAM). To narrow/widen the corpus, edit WORK_NAMESPACES in common.py.

Usage (from backend/):
    python -m salmon.parse
"""
from __future__ import annotations

import json
import os
import time
from collections import Counter

from . import common as C


def main() -> None:
    os.makedirs(C.ARTIFACT_DIR, exist_ok=True)

    works: dict[str, dict] = {}        # "Namespace/Slug" -> work record
    tropes: dict[str, str] = {}        # trope display name -> definition

    n_pages = n_work = n_trope = 0
    per_ns: Counter = Counter()
    t0 = time.time()

    for path in C.chunk_files():
        print(f"[parse] scanning {os.path.basename(path)} ...", flush=True)
        for rec in C.iter_jsonl(path):
            url = rec.get("url", "")
            text = rec.get("text", "")
            if not url or not text:
                continue
            n_pages += 1

            if C.is_work_page(url):
                ns = C.namespace_of(url)
                slug = C.page_slug(url)
                title = C.title_line(text)
                names = C.extract_trope_names(text)
                # Require a handful of tropes so stub/404 pages don't pollute
                # the recommendation pool with near-empty centroids.
                if title and len(names) >= 3:
                    key = f"{ns}/{slug}"
                    works[key] = {
                        "title": title,
                        "namespace": ns,
                        "slug": slug,
                        "tropes": names,
                    }
                    n_work += 1
                    per_ns[ns] += 1

            elif C.is_trope_page(url):
                title = C.title_line(text)
                definition = C.extract_definition(text)
                if title:
                    # Some trope pages share a display title via redirects; keep
                    # the first (canonical) definition we see.
                    tropes.setdefault(title, definition)
                    n_trope += 1

            if n_pages % 100000 == 0:
                print(f"  ...{n_pages:,} pages "
                      f"({n_work} works, {n_trope} tropes)", flush=True)

    with open(C.WORKS_PATH, "w", encoding="utf-8") as f:
        json.dump(works, f, ensure_ascii=False, indent=0)
    with open(C.TROPES_PATH, "w", encoding="utf-8") as f:
        json.dump(tropes, f, ensure_ascii=False, indent=0)

    dt = time.time() - t0
    print(f"\n[parse] done in {dt:.1f}s")
    print(f"  works  : {len(works):,}  -> {C.WORKS_PATH}")
    print(f"  tropes : {len(tropes):,}  -> {C.TROPES_PATH}")
    print("  works per namespace:")
    for ns, n in per_ns.most_common():
        print(f"      {n:7,d}  {ns}")


if __name__ == "__main__":
    main()
