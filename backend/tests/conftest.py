"""Build a tiny dataset before anything imports the engine.

The fixture pages in tests/fixtures/raw are invented, so no TVTropes content ships
with the repo. The real parse/profiles/enrich builders run on them. Embeddings are
faked with one orthogonal vector per trope, so the tests need no model and no network.
"""
from __future__ import annotations

import json
import os
import tempfile

import numpy as np
import pytest

_HERE = os.path.dirname(os.path.abspath(__file__))
_TMP = tempfile.mkdtemp(prefix="salmon-tests-")

# Must be set before salmon.common or app.* are imported.
os.environ["SALMON_DATA_DIR"] = os.path.join(_HERE, "fixtures", "raw")
os.environ["SALMON_ARTIFACT_DIR"] = _TMP
os.environ["DATABASE_URL"] = f"sqlite:///{os.path.join(_TMP, 'test.db')}"
os.environ["SALMON_SESSION_SECRET"] = "test-only-secret"
os.environ["SALMON_SECURE_COOKIES"] = ""
os.environ["SALMON_SKIP_WARMUP"] = "1"
os.environ["ANTHROPIC_API_KEY"] = ""

from salmon import common as C
from salmon import enrich, parse, profiles


def _fake_embeddings() -> list[str]:
    """Row-aligned vocabulary plus an identity matrix of vectors."""
    with open(C.TROPES_PATH, encoding="utf-8") as f:
        vocab = list(json.load(f))
    np.save(C.VECTORS_PATH, np.eye(len(vocab), dtype=np.float32))
    with open(C.VOCAB_PATH, "w", encoding="utf-8") as f:
        json.dump(vocab, f)
    return vocab


parse.main()
profiles.main()
enrich.main()
VOCAB = _fake_embeddings()


class FakeModel:
    """Stands in for e5: a query naming a trope maps exactly onto that trope's vector."""

    def encode(self, texts, **_):
        out = np.zeros((len(texts), len(VOCAB)), dtype=np.float32)
        norm = {C.normalize_name(t): i for i, t in enumerate(VOCAB)}
        for row, text in enumerate(texts):
            i = norm.get(C.normalize_name(text.removeprefix("query: ")))
            if i is not None:
                out[row, i] = 1.0
        return out


@pytest.fixture
def fake_model(monkeypatch):
    from app import vds
    monkeypatch.setattr(vds, "_MODEL", FakeModel())
