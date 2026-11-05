#!/usr/bin/env python3
"""embed.py — embed the TROPE VOCABULARY (not the works).

Loads tropes.json, embeds each trope (name + short definition) with
intfloat/multilingual-e5-small via sentence-transformers on the best available
device (MPS, CUDA or CPU), and saves:

  trope_vectors.npy : float32 array (N, D), L2-normalized
  trope_index.json  : ordered list of N trope names (row i <-> trope_index[i])

e5 models expect a "passage: " / "query: " prefix. We embed the vocabulary as
passages here; the query side embeds the user's words as queries.

Usage (from backend/):
    python -m salmon.embed
"""
from __future__ import annotations

import json
import time

import numpy as np

from . import common as C


def pick_device() -> str:
    import torch
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def main() -> None:
    from sentence_transformers import SentenceTransformer

    with open(C.TROPES_PATH, "r", encoding="utf-8") as f:
        tropes: dict[str, str] = json.load(f)

    names = list(tropes)
    # e5 wants "passage: <text>". Pair the name with its definition for a
    # richer embedding; fall back to just the name when there's no definition.
    passages = [
        f"passage: {name}. {tropes[name]}".strip()
        for name in names
    ]

    device = pick_device()
    print(f"[embed] {len(names):,} tropes on device={device} "
          f"model={C.MODEL_NAME}", flush=True)

    model = SentenceTransformer(C.MODEL_NAME, device=device)

    t0 = time.time()
    vecs = model.encode(
        passages,
        batch_size=256,
        convert_to_numpy=True,
        normalize_embeddings=True,   # so dot product == cosine similarity
        show_progress_bar=True,
    ).astype(np.float32)
    dt = time.time() - t0

    np.save(C.VECTORS_PATH, vecs)
    with open(C.VOCAB_PATH, "w", encoding="utf-8") as f:
        json.dump(names, f, ensure_ascii=False)

    print(f"\n[embed] done in {dt:.1f}s")
    print(f"  vectors: {vecs.shape} {vecs.dtype} -> {C.VECTORS_PATH}")
    print(f"  index  : {len(names):,} names        -> {C.VOCAB_PATH}")


if __name__ == "__main__":
    main()
