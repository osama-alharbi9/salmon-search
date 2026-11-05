#!/usr/bin/env python3
"""recommend.py — "if you liked X, try these" across all media.

You type a work title (anime, manga, film, series, game, ...). salmon finds the
matching work, then returns the top-N works whose trope profile is most similar.

Similarity = cosine between rarity-weighted (TF-IDF) trope vectors, i.e. works
that share *distinctive* tropes rank highest while ubiquitous tropes (Chekhov's
Gun, Deadpan Snarker, ...) barely count. Cross-media by design: an anime can
recommend a film, a game can recommend a series.

Usage (from backend/):
    python -m salmon.recommend "cowboy bebop"
    python -m salmon.recommend "death note" -n 20
    python -m salmon.recommend "neon genesis" --ns Anime,Manga   # restrict result media
"""
from __future__ import annotations

import argparse
import difflib
import json
import re
import sys

import numpy as np
from scipy import sparse

from . import common as C
from .profiles import WORK_PROFILES_PATH, WORK_INDEX_PATH


def load_artifacts():
    M = sparse.load_npz(WORK_PROFILES_PATH)                  # (W, V) L2-normalized
    index = json.load(open(WORK_INDEX_PATH, encoding="utf-8"))
    with open(C.WORKS_PATH, encoding="utf-8") as f:
        works = json.load(f)
    return M, index, works


def find_work(query: str, index: list[dict]) -> list[int]:
    """Return candidate row indices for a typed title, best first.

    Matching ladder: exact (normalized) title, then 'query is a prefix/contained
    in the title', then fuzzy. Within each tier we sort by trope count desc, so a
    famous work (hundreds of tropes) beats a same-titled stub or live-action
    remake page with only a handful — the #1 cause of bad recommendations is
    silently resolving to the wrong page.
    """
    q = C.normalize_name(query)

    def richest(i: int) -> int:                    # most tropes first
        return -index[i]["n_tropes"]

    # A title often appears as a bare stub AND as "Title (Manga)"/"Title (2003)".
    # We treat the parenthetical qualifier as optional: any page whose title
    # equals the query, OR equals the query plus a trailing "(...)" qualifier,
    # is an exact candidate. Among those we pick the richest page — the famous
    # work has hundreds of tropes; the live-action-remake stub has a few.
    def base(title: str) -> str:
        return C.normalize_name(re.sub(r"\s*\([^)]*\)\s*$", "", title))

    exact = [i for i, w in enumerate(index)
             if C.normalize_name(w["title"]) == q or base(w["title"]) == q]
    if exact:
        return sorted(exact, key=richest)

    # query contained in title (e.g. "fullmetal alchemist" -> "Fullmetal Alchemist (2003)")
    contained = [i for i, w in enumerate(index)
                 if q and q in C.normalize_name(w["title"])]
    if contained:
        return sorted(contained, key=richest)

    # title contained in query (rarer; e.g. extra words typed)
    rev = [i for i, w in enumerate(index)
           if q and C.normalize_name(w["title"]) in q
           and len(C.normalize_name(w["title"])) >= 4]
    if rev:
        return sorted(rev, key=richest)

    # fuzzy fallback
    titles = [w["title"] for w in index]
    close = difflib.get_close_matches(query, titles, n=12, cutoff=0.7)
    nameset = set(close)
    out = [i for i, w in enumerate(index) if w["title"] in nameset]
    return sorted(out, key=richest)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("title", nargs="+", help="work title to find similar works for")
    ap.add_argument("-n", type=int, default=10, help="how many results (default 10)")
    ap.add_argument("--ns", default="", help="comma-separated namespaces to restrict results")
    ap.add_argument("--min-tropes", type=int, default=15,
                    help="ignore result works with fewer than this many tropes "
                         "(filters thin stubs that score high on a lucky overlap)")
    args = ap.parse_args()

    query = " ".join(args.title)
    restrict = {s.strip() for s in args.ns.split(",") if s.strip()}

    M, index, works = load_artifacts()

    cands = find_work(query, index)
    if not cands:
        print(f"no work found matching '{query}'.")
        sys.exit(1)

    src = cands[0]
    src_w = index[src]
    if C.normalize_name(src_w["title"]) != C.normalize_name(query) and len(cands) > 1:
        print("did you mean (using the first):")
        for i in cands[:6]:
            print(f"   - {index[i]['title']}  [{index[i]['namespace']}]")
        print()

    print(f"source: {src_w['title']}  [{src_w['namespace']}]  "
          f"({src_w['n_tropes']} tropes)")

    # Cosine of the source profile against all works (rows are L2-normalized).
    sims = (M @ M[src].T).toarray().ravel()                 # (W,)
    order = np.argsort(-sims)

    src_tropes = set(works[src_w["id"]]["tropes"])
    src_norm_title = C.normalize_name(src_w["title"])

    print(f"\n{'='*64}")
    print(f"top {args.n} works most like {src_w['title']}")
    print(f"{'='*64}\n")

    shown = 0
    seen_titles: set[str] = set()
    for i in order:
        if i == src:
            continue
        w = index[i]
        if restrict and w["namespace"] not in restrict:
            continue
        if w["n_tropes"] < args.min_tropes:
            continue
        nt = C.normalize_name(w["title"])
        # collapse the same work appearing in multiple media / duplicate pages
        if nt == src_norm_title or nt in seen_titles:
            continue
        if sims[i] <= 0:
            break
        seen_titles.add(nt)

        their = set(works[w["id"]]["tropes"])
        shared = sorted(src_tropes & their)
        shared_show = shared[:6]

        print(f"{w['title']}  [{w['namespace']}]   sim {sims[i]:.3f}   "
              f"{len(shared)} shared tropes")
        if shared_show:
            print(f"     shared: {', '.join(shared_show)}"
                  + (" ..." if len(shared) > len(shared_show) else ""))
        print()

        shown += 1
        if shown >= args.n:
            break


if __name__ == "__main__":
    main()
