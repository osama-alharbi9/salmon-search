import json

import numpy as np
from scipy import sparse

from salmon.profiles import TROPE_IDF_PATH, WORK_INDEX_PATH, WORK_PROFILES_PATH


def _idf():
    with open(TROPE_IDF_PATH, encoding="utf-8") as f:
        return json.load(f)


def test_rare_tropes_weigh_more_than_common_ones():
    idf = _idf()
    assert idf["Clock Tower Finale"] > idf["Found Family"]


def test_trope_in_every_work_weighs_nothing():
    assert _idf()["Chekhov's Gun"] == 0


def test_profile_rows_are_unit_length():
    M = sparse.load_npz(WORK_PROFILES_PATH)
    norms = np.sqrt(M.multiply(M).sum(axis=1)).A1
    assert np.allclose(norms, 1.0)


def test_index_is_row_aligned_with_the_matrix():
    M = sparse.load_npz(WORK_PROFILES_PATH)
    with open(WORK_INDEX_PATH, encoding="utf-8") as f:
        assert len(json.load(f)) == M.shape[0]
