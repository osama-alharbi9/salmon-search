#!/usr/bin/env python3
"""search.py — the salmon CLI.

You type tropes separated by '+'. Each phrase is embedded and resolved to the
nearest REAL trope(s) in the vocabulary (the user's words won't match canonical
trope names, so we do it semantically). Every work is then scored by how much
of the resolved trope set its trope list covers. Full matches rank first.

    python -m salmon.search "found family + heist + morally grey mentor"

Per-trope status for each result:
    matched      the work has that exact resolved trope
    near-match ≈ the work has a trope that's semantically close (>= NEAR_THRESH)
    missing      the work has nothing close
"""
from __future__ import annotations

import json
import math
import sys
from collections import Counter

import numpy as np

from . import common as C

# How close a resolved trope's vector must be to one of a work's tropes to count
# as a "near-match" (cosine). Tuned by feel; raise to be stricter.
NEAR_THRESH = 0.86
# Score weights for coverage.
W_MATCH = 1.0
W_NEAR = 0.5
TOP_RESULTS = 15


def load_artifacts():
    vecs = np.load(C.VECTORS_PATH)                      # (N, D) normalized
    with open(C.VOCAB_PATH, encoding="utf-8") as f:
        vocab = json.load(f)                            # list[str], row-aligned
    with open(C.WORKS_PATH, encoding="utf-8") as f:
        works = json.load(f)                            # id -> {title, tropes, ...}
    name_to_row = {n: i for i, n in enumerate(vocab)}
    return vecs, vocab, works, name_to_row


def trope_frequency(works: dict[str, dict]) -> Counter:
    """How many works list each trope."""
    freq: Counter = Counter()
    for rec in works.values():
        freq.update(rec["tropes"])
    return freq


def embed_queries(phrases: list[str]) -> np.ndarray:
    """Embed user phrases as e5 'query:' passages, L2-normalized."""
    from sentence_transformers import SentenceTransformer
    import torch

    device = ("mps" if torch.backends.mps.is_available()
              else "cuda" if torch.cuda.is_available() else "cpu")
    model = SentenceTransformer(C.MODEL_NAME, device=device)
    q = model.encode(
        [f"query: {p}" for p in phrases],
        convert_to_numpy=True,
        normalize_embeddings=True,
    ).astype(np.float32)
    return q


# Among the top-k nearest tropes, any whose similarity is within this margin of
# the raw top-1 is a "contender" worth considering over the literal nearest
# neighbour (which is sometimes a niche variant no work lists).
RESOLVE_TOL = 0.04
# How much a trope's popularity nudges resolution. Score = sim + POP_WEIGHT *
# log10(1 + work_count). Small, so a clearly-closer trope still wins, but a
# near-tie that many works actually use is preferred over a niche one.
POP_WEIGHT = 0.010


def resolve(phrase_vec: np.ndarray, vecs: np.ndarray, vocab: list[str],
            freq: dict[str, int], k: int = 15):
    """Resolve one query vector to a canonical trope.

    Returns (name, row, sim, alternates). Among the top-k contenders (within
    RESOLVE_TOL of the nearest neighbour) we maximise a blend of cosine
    similarity and log-popularity, so resolution favours precise tropes that
    works actually use without letting a generic common trope hijack a much
    closer match.
    """
    sims = vecs @ phrase_vec                       # cosine, both normalized
    top = np.argsort(-sims)[:k]
    best_sim = float(sims[int(top[0])])

    contenders = [int(r) for r in top
                  if best_sim - float(sims[int(r)]) <= RESOLVE_TOL]

    def blended(r: int) -> float:
        count = freq.get(vocab[r], 0)
        # A trope no work lists can never produce coverage: heavily penalise so
        # it only wins when nothing in the contender band is used at all.
        if count == 0:
            return float(sims[r]) - 1.0
        pop = math.log10(1 + count)
        return float(sims[r]) + POP_WEIGHT * pop

    chosen = max(contenders, key=blended)
    alternates = [(vocab[int(r)], float(sims[int(r)])) for r in top[:5]]
    return vocab[chosen], chosen, float(sims[chosen]), alternates


def score_works(target_names: list[str], target_vecs: np.ndarray, vecs: np.ndarray,
                works: dict[str, dict], name_to_row: dict[str, int]) -> list[dict]:
    """Score every work by coverage of the resolved trope set, best first.

    An exact trope counts W_MATCH, a semantically close one W_NEAR. Works that
    cover nothing are dropped. Ranking: most covered, then score, then exact
    matches, then shorter title for stability.
    """
    results = []
    for rec in works.values():
        names = rec["tropes"]
        # Vectors for this work's tropes that exist in the vocab.
        rows = [name_to_row[n] for n in names if n in name_to_row]
        owned = set(names)

        if rows:
            # sims[t, k] = similarity of resolved trope t to work trope k
            best_per_target = (target_vecs @ vecs[rows].T).max(axis=1)
        else:
            best_per_target = np.zeros(len(target_names))

        status = []        # per resolved trope: 'matched' / 'near' / 'missing'
        n_match = n_near = 0
        for ti, name in enumerate(target_names):
            if name in owned:
                status.append("matched")
                n_match += 1
            elif best_per_target[ti] >= NEAR_THRESH:
                status.append("near")
                n_near += 1
            else:
                status.append("missing")

        if n_match == 0 and n_near == 0:
            continue       # skip works that cover none of the set

        results.append({
            "title": rec["title"],
            "coverage": n_match + n_near,
            "n_match": n_match,
            "score": W_MATCH * n_match + W_NEAR * n_near,
            "status": status,
        })

    results.sort(key=lambda r: (r["coverage"], r["score"], r["n_match"], -len(r["title"])),
                 reverse=True)
    # The same title can have a page per medium: keep its best-ranked one.
    seen: set[str] = set()
    unique = []
    for r in results:
        key = C.normalize_name(r["title"])
        if key not in seen:
            seen.add(key)
            unique.append(r)
    return unique


def main() -> None:
    if len(sys.argv) < 2:
        print('usage: python -m salmon.search "trope a + trope b + trope c"')
        sys.exit(1)

    raw = " ".join(sys.argv[1:])
    phrases = [p.strip() for p in raw.split("+") if p.strip()]
    if not phrases:
        print("no tropes typed.")
        sys.exit(1)

    vecs, vocab, works, name_to_row = load_artifacts()

    # How many works use each trope name: biases phrase resolution toward tropes
    # that can actually produce coverage.
    freq = trope_frequency(works)

    # 1) Resolve each typed phrase to its nearest canonical trope.
    qvecs = embed_queries(phrases)
    resolved = []   # list of (typed, canonical_name, row, sim)
    print("\nresolved tropes:")
    for phrase, qv in zip(phrases, qvecs):
        name, row, sim, alts = resolve(qv, vecs, vocab, freq)
        resolved.append((phrase, name, row, sim))
        print(f"  '{phrase}'  ->  {name}  "
              f"(sim {sim:.2f}, in {freq.get(name, 0)} works)")
        others = [a for a, _ in alts if a != name][:2]
        if others:
            print(f"       alt: {', '.join(others)}")

    target_names = [name for _, name, _, _ in resolved]
    target_vecs = vecs[np.array([r for _, _, r, _ in resolved])]

    # 2) Score and rank every work by coverage of the resolved trope set.
    results = score_works(target_names, target_vecs, vecs, works, name_to_row)

    # 3) Print.
    print(f"\n{'='*60}\ntop {min(TOP_RESULTS, len(results))} of "
          f"{len(results)} matching works\n{'='*60}")
    for r in results[:TOP_RESULTS]:
        print(f"\n{r['title']}   [{r['coverage']}/{len(target_names)}]  score {r['score']:.1f}")
        for name, st in zip(target_names, r["status"]):
            mark = {"matched": "  matched   ",
                    "near":    "  near (≈)  ",
                    "missing": "  missing   "}[st]
            print(f"   {mark} {name}")

    if not results:
        print("\nno work covered any of those tropes.")


if __name__ == "__main__":
    main()
