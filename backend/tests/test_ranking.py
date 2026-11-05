"""Coverage scoring and similarity ranking on the fixture dataset."""
import numpy as np

from salmon import engine, search

WANTED = ["Found Family", "The Caper", "Morally Grey Mentor"]


def _ids(out):
    return [r["id"] for r in out["results"]]


def test_full_matches_rank_above_partial_matches():
    results = engine.works_by_coverage(WANTED)["results"]
    counts = [r["matched_count"] for r in results]
    assert counts == sorted(counts, reverse=True)
    assert counts[:3] == [3, 3, 2]


def test_ties_go_to_the_richer_page():
    assert _ids(engine.works_by_coverage(WANTED))[:2] == ["Series/NineTenths", "Film/HarborLights"]


def test_coverage_reports_matched_and_missing():
    row = next(r for r in engine.works_by_coverage(WANTED)["results"]
               if r["id"] == "Anime/VelvetSyndicate")
    assert row["matched_tropes"] == ["The Caper", "Morally Grey Mentor"]
    assert row["missing_tropes"] == ["Found Family"]
    assert row["wanted_count"] == 3


def test_works_covering_nothing_are_dropped():
    assert "Series/ClockworkCity" not in _ids(engine.works_by_coverage(WANTED))


def test_same_title_across_media_appears_once():
    titles = [r["title"] for r in engine.works_by_coverage(WANTED)["results"]]
    assert titles.count("Echo Harbor") == 1


def test_coverage_matching_ignores_case_and_punctuation():
    out = engine.works_by_coverage(["found family", "CHEKHOVS GUN"])
    assert out["resolved"] == ["Found Family", "Chekhov's Gun"]
    assert out["unknown"] == []


def test_unknown_tropes_are_reported_not_matched():
    out = engine.works_by_coverage(["The Caper", "Not A Real Trope"])
    assert out["unknown"] == ["Not A Real Trope"]
    assert out["results"][0]["wanted_count"] == 1
    assert engine.works_by_coverage(["Not A Real Trope"])["found"] is False


def test_coverage_namespace_filter_and_exclusions():
    only_film = engine.works_by_coverage(WANTED, namespaces=["Film"])
    assert {r["namespace"] for r in only_film["results"]} == {"Film"}
    without = engine.works_by_coverage(WANTED, exclude_ids={"Series/NineTenths"})
    assert "Series/NineTenths" not in _ids(without)


def test_excluding_a_work_drops_every_page_with_its_title():
    out = engine.works_by_coverage(["Found Family"], exclude_ids={"Film/EchoHarbor"})
    assert "Echo Harbor" not in [r["title"] for r in out["results"]]


def test_strict_search_requires_every_trope():
    out = engine.works_by_tropes(WANTED)
    assert set(_ids(out)) == {"Series/NineTenths", "Film/HarborLights"}


def test_find_work_treats_qualifier_as_optional():
    best = engine._INDEX[engine.find_work("harbor lights")[0]]
    assert best["id"] == "Film/HarborLights"


def test_find_work_prefers_the_richest_page():
    best = engine._INDEX[engine.find_work("echo harbor")[0]]
    assert best["id"] == "Literature/EchoHarbor"


def test_recommend_ranks_by_shared_rare_tropes():
    out = engine.recommend("Harbor Lights", n=5, min_tropes=0)
    assert out["source"]["title"] == "Harbor Lights (Film)"
    sims = [r["similarity"] for r in out["results"]]
    assert sims == sorted(sims, reverse=True)
    assert out["results"][0]["shared_count"] >= 2
    assert "Film/HarborLights" not in _ids(out)


def test_recommend_ignores_works_sharing_only_a_universal_trope():
    # Clockwork City shares only Chekhov's Gun, which is in every work (IDF 0).
    assert "Series/ClockworkCity" not in _ids(engine.recommend("Harbor Lights", n=10, min_tropes=0))


def test_recommend_min_tropes_filters_thin_pages():
    assert engine.recommend("Harbor Lights", n=5, min_tropes=100)["results"] == []


def test_recommend_unknown_title():
    assert engine.recommend("zzzz no such work zzzz")["found"] is False


# --- the CLI's scorer, which also counts semantic near-matches ----------------
def _toy_vectors():
    """Three tropes: a and a2 are nearly the same, b is unrelated."""
    vocab = ["Trope A", "Trope A2", "Trope B"]
    close = np.array([0.98, np.sqrt(1 - 0.98 ** 2), 0.0], dtype=np.float32)
    vecs = np.stack([[1.0, 0.0, 0.0], close, [0.0, 0.0, 1.0]]).astype(np.float32)
    return vocab, vecs, {n: i for i, n in enumerate(vocab)}


def test_score_counts_exact_full_and_near_half():
    vocab, vecs, rows = _toy_vectors()
    works = {
        "x": {"title": "Exact", "tropes": ["Trope A", "Trope B"]},
        "n": {"title": "Near", "tropes": ["Trope A2", "Trope B"]},
        "p": {"title": "Partial", "tropes": ["Trope B"]},
    }
    targets = ["Trope A", "Trope B"]
    out = search.score_works(targets, vecs[[0, 2]], vecs, works, rows)
    assert [r["title"] for r in out] == ["Exact", "Near", "Partial"]
    assert [r["score"] for r in out] == [2.0, 1.5, 1.0]
    assert out[1]["status"] == ["near", "matched"]
    assert out[2]["status"] == ["missing", "matched"]


def test_score_keeps_one_row_per_title():
    vocab, vecs, rows = _toy_vectors()
    works = {
        "film": {"title": "Same Name", "tropes": ["Trope A"]},
        "book": {"title": "Same Name", "tropes": ["Trope A", "Trope B"]},
    }
    out = search.score_works(["Trope A", "Trope B"], vecs[[0, 2]], vecs, works, rows)
    assert len(out) == 1
    assert out[0]["coverage"] == 2


def test_score_drops_works_covering_nothing():
    vocab, vecs, rows = _toy_vectors()
    works = {"z": {"title": "Unrelated", "tropes": ["Trope B"]}}
    assert search.score_works(["Trope A"], vecs[[0]], vecs, works, rows) == []


def test_resolve_prefers_a_used_trope_on_a_near_tie():
    vocab, vecs, _ = _toy_vectors()
    name, *_ = search.resolve(vecs[1], vecs, vocab, {"Trope A": 50}, k=2)
    assert name == "Trope A"


def test_trope_frequency_counts_works():
    works = {"x": {"tropes": ["a", "b"]}, "y": {"tropes": ["a"]}}
    assert search.trope_frequency(works) == {"a": 2, "b": 1}
