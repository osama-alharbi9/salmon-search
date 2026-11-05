"""The input layer: filters, title detection, phrase resolution, full search."""
import anthropic
import httpx2
import pytest

from app import llm, vds


@pytest.mark.parametrize("text,include,exclude", [
    ("movies only", ["Film"], []),
    ("shows and movies only", ["Film", "Series"], []),
    ("no visual novels", [], ["VisualNovel"]),
    ("just anime", ["Anime"], []),
])
def test_medium_filter_clauses(text, include, exclude):
    medium, rest = vds.parse_medium_filter(["The Caper", text])
    assert sorted(medium["include"]) == sorted(include)
    assert medium["exclude"] == exclude
    assert rest == ["The Caper"]


def test_trope_containing_a_medium_word_is_not_a_filter():
    medium, rest = vds.parse_medium_filter(["Show Within a Show"])
    assert medium == {"include": [], "exclude": []}
    assert rest == ["Show Within a Show"]


def test_exclude_filter_becomes_an_allowlist():
    allow = vds._medium_to_namespaces({"include": [], "exclude": ["Fanfic"]})
    assert "Fanfic" not in allow and "Film" in allow
    assert vds._medium_to_namespaces({"include": [], "exclude": []}) is None


def test_title_detection():
    assert vds._looks_like_title("like Harbor Lights") == "Film/HarborLights"
    assert vds._looks_like_title("works like Clockwork City") == "Series/ClockworkCity"
    assert vds._looks_like_title("clockwork city") == "Series/ClockworkCity"
    assert vds._looks_like_title("caper") is None            # single word stays a trope
    assert vds._looks_like_title("some unknown thing") is None


@pytest.mark.parametrize("raw,expected", [
    ('["a b", "c d"]', ["a b", "c d"]),
    ('```json\n["a b"]\n```', ["a b"]),
    ('{"phrases": ["a b"]}', ["a b"]),
    ('Here you go: ["a b"] enjoy', ["a b"]),
    ('["a b", "A B"]', ["a b"]),
    ("not json", []),
    ("", []),
])
def test_parse_phrases_tolerates_model_output(raw, expected):
    assert vds._parse_phrases(raw) == expected


def test_resolve_phrases_splits_known_and_unknown(fake_model):
    out = vds.resolve_phrases(["the caper", "nothing like any trope"])
    assert [r["trope"] for r in out["resolved"]] == ["The Caper"]
    assert out["unknown"] == ["nothing like any trope"]


def test_search_with_tropes_and_a_filter(fake_model):
    out = vds.vds_search(["found family", "the caper", "movies only"])
    assert out["medium"]["include"] == ["Film"]
    assert {r["namespace"] for r in out["results"]} == {"Film"}
    assert out["results"][0]["id"] == "Film/HarborLights"


def test_search_expands_a_title_and_drops_the_source(fake_model):
    out = vds.vds_search(["like Harbor Lights"])
    assert out["titles"][0]["id"] == "Film/HarborLights"
    ids = [r["id"] for r in out["results"]]
    assert "Film/HarborLights" not in ids
    assert ids[0] == "Series/NineTenths"


def test_search_with_nothing_resolved(fake_model):
    out = vds.vds_search(["nothing like any trope"])
    assert out["found"] is False
    assert out["unknown"] == ["nothing like any trope"]


# --- Claude calls, through the real SDK with the network faked ---------------
def _claude(monkeypatch, content, stop_reason="end_turn"):
    def reply(request):
        return httpx2.Response(200, json={
            "id": "msg_test", "type": "message", "role": "assistant",
            "model": "test-model", "content": content, "stop_reason": stop_reason,
            "stop_sequence": None, "usage": {"input_tokens": 1, "output_tokens": 1},
        })
    client = anthropic.Anthropic(api_key="test",
                                 http_client=httpx2.Client(transport=httpx2.MockTransport(reply)))
    monkeypatch.setattr(llm, "_client", client)


def test_vibe_to_phrases_reads_the_model_reply(monkeypatch):
    _claude(monkeypatch, [{"type": "text", "text": '["crew like family", "one last job"]'}])
    assert vds.vibe_to_phrases("cozy heist") == ["crew like family", "one last job"]


def test_chat_returns_model_text(monkeypatch):
    _claude(monkeypatch, [{"type": "text", "text": "name a work and i will look."}])
    out = llm.chat([], "hello")
    assert out == {"text": "name a work and i will look.", "source": None, "results": []}


def test_missing_key_is_a_clear_error(monkeypatch):
    monkeypatch.setattr(llm, "_client", None)
    with pytest.raises(RuntimeError, match="ANTHROPIC_API_KEY"):
        llm.client()
