#!/usr/bin/env python3
"""profiles.py — build a rarity-weighted trope profile for every work.

Each work is a sparse TF-IDF vector over the trope vocabulary: present tropes
weighted by inverse document frequency (rare, distinctive tropes count a lot;
ubiquitous ones like "Chekhov's Gun" count for almost nothing). Recommendation
then = cosine between these sparse vectors, which is just the sum of shared
tropes' squared-IDF, length-normalized.

We use the trope *sets* directly (NOT the embedding vectors): e5-small maps all
trope phrases into a tight cone, so averaged embedding centroids are nearly
collinear and can't discriminate. Set-overlap weighted by rarity does.

Inputs  (artifacts/):
    works.json          { id: {title, namespace, slug, tropes:[...]} }

Outputs (artifacts/):
    work_profiles.npz   scipy CSR matrix (n_works x n_tropes), L2-normalized rows
    work_index.json     [ {id, title, namespace, slug, n_tropes} ... ] row order
    trope_idf.json      { trope name : idf weight }   (also used at query time)

Usage (from backend/):
    python -m salmon.profiles
"""
from __future__ import annotations

import json
import os
import time

import numpy as np
from scipy import sparse

from . import common as C

WORK_PROFILES_PATH = os.path.join(C.ARTIFACT_DIR, "work_profiles.npz")
WORK_INDEX_PATH = os.path.join(C.ARTIFACT_DIR, "work_index.json")
TROPE_IDF_PATH = os.path.join(C.ARTIFACT_DIR, "trope_idf.json")


def main() -> None:
    t0 = time.time()

    with open(C.WORKS_PATH, encoding="utf-8") as f:
        works = json.load(f)

    # 1) Vocabulary = every trope that any work uses; document frequency -> IDF.
    df: dict[str, int] = {}
    for rec in works.values():
        for t in set(rec["tropes"]):
            df[t] = df.get(t, 0) + 1

    vocab = sorted(df)                       # stable trope ordering
    col_of = {t: j for j, t in enumerate(vocab)}
    n_works = len(works)
    # smoothed idf, floored at 0 so a trope in *every* work contributes nothing
    idf = np.array([max(np.log((n_works + 1) / (df[t] + 1)), 0.0) for t in vocab],
                   dtype=np.float32)

    # 2) Build the sparse work x trope TF-IDF matrix (binary tf x idf).
    index = []
    rows, cols, vals = [], [], []
    r = 0
    for wid, rec in works.items():
        js = {col_of[t] for t in rec["tropes"] if t in col_of}
        if not js:
            continue
        for j in js:
            rows.append(r)
            cols.append(j)
            vals.append(idf[j])
        index.append({
            "id": wid,
            "title": rec["title"],
            "namespace": rec["namespace"],
            "slug": rec["slug"],
            "n_tropes": len(rec["tropes"]),
        })
        r += 1

    M = sparse.csr_matrix((vals, (rows, cols)),
                          shape=(r, len(vocab)), dtype=np.float32)
    # L2-normalize rows so cosine = dot product and long trope lists aren't favored
    norms = np.sqrt(M.multiply(M).sum(axis=1)).A1
    norms[norms == 0] = 1.0
    M = sparse.diags(1.0 / norms) @ M
    M = M.tocsr()

    sparse.save_npz(WORK_PROFILES_PATH, M)
    with open(WORK_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
    with open(TROPE_IDF_PATH, "w", encoding="utf-8") as f:
        json.dump({t: float(idf[j]) for t, j in col_of.items()}, f, ensure_ascii=False)

    dt = time.time() - t0
    print(f"[profile] done in {dt:.1f}s")
    print(f"  matrix : {M.shape} ({M.nnz:,} nonzeros) -> {WORK_PROFILES_PATH}")
    print(f"  index  : {len(index):,} works -> {WORK_INDEX_PATH}")
    print(f"  vocab  : {len(vocab):,} tropes -> {TROPE_IDF_PATH}")


if __name__ == "__main__":
    main()
