#!/usr/bin/env python3
"""fetch.py — download the raw TVTropes dump from Hugging Face.

The dump is about 6 GB of JSONL (chunk_*.jsonl, one {"url", "text"} page per line).
The revision is pinned so a rebuild sees the same pages. Interrupted downloads
resume when you run this again.

Usage (from backend/):
    python -m salmon.fetch
"""
from __future__ import annotations

import os
import shutil

from . import common as C

REPO_ID = "RyokoExtra/TvTroper-Cleaned"
REVISION = "bb6fc6aacf1e4e9aa6e7ddddaecf4b8a7b12f5d1"
NEEDED_GB = 7


def main() -> None:
    # The files land in DATA_DIR. Without this, Xet also keeps its own chunk cache
    # of up to 10 GB, which doubles the disk needed.
    os.environ.setdefault("HF_XET_CHUNK_CACHE_SIZE_BYTES", "0")
    from huggingface_hub import snapshot_download

    os.makedirs(C.DATA_DIR, exist_ok=True)
    free_gb = shutil.disk_usage(C.DATA_DIR).free / 1e9
    if free_gb < NEEDED_GB:
        print(f"[fetch] warning: {free_gb:.1f} GB free, the dump needs about {NEEDED_GB} GB.",
              flush=True)

    print(f"[fetch] {REPO_ID}@{REVISION[:8]} -> {C.DATA_DIR}", flush=True)
    snapshot_download(
        repo_id=REPO_ID,
        repo_type="dataset",
        revision=REVISION,
        allow_patterns=["chunk_*.jsonl"],
        local_dir=C.DATA_DIR,
    )
    print(f"[fetch] done: {len(C.chunk_files())} chunk files", flush=True)


if __name__ == "__main__":
    main()
