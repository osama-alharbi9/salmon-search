import json

from salmon import common as C


def _works():
    with open(C.WORKS_PATH, encoding="utf-8") as f:
        return json.load(f)


def test_url_helpers():
    url = "https://tvtropes.org/pmwiki/pmwiki.php/Film/HarborLights"
    assert C.namespace_of(url) == "Film"
    assert C.page_slug(url) == "HarborLights"
    assert C.is_work_page(url)
    assert not C.is_trope_page(url)
    assert C.is_trope_page("https://tvtropes.org/pmwiki/pmwiki.php/Main/FoundFamily")
    assert not C.is_work_page("https://tvtropes.org/pmwiki/pmwiki.php/YMMV/HarborLights")


def test_title_line_strips_site_suffix():
    assert C.title_line("Harbor Lights (Film) - TV Tropes\n\nBody") == "Harbor Lights (Film)"


def test_extract_trope_names_keeps_order_and_drops_non_tropes():
    text = "\n".join([
        "Title - TV Tropes",
        "- Found Family: example",
        "- The Caper: example",
        "- Found Family: repeated",
        "    - Nested Example: indented, not top level",
        "- See also: not a trope",
        "- http://example.com: not a trope",
        "No bullet: not a trope",
    ])
    assert C.extract_trope_names(text) == ["Found Family", "The Caper"]


def test_extract_definition_skips_quotes_and_short_lines():
    text = "\n".join([
        "Found Family - TV Tropes",
        "*A pull quote that should be skipped entirely, however long it is.*",
        "Too short.",
        "Characters with no blood ties become a household over the story.",
    ])
    assert C.extract_definition(text).startswith("Characters with no blood ties")


def test_normalize_name_ignores_case_and_punctuation():
    assert C.normalize_name("Chekhov's Gun") == C.normalize_name("CHEKHOVS GUN")


def test_parse_keeps_real_works_only():
    works = _works()
    assert "Film/HarborLights" in works
    assert works["Film/HarborLights"]["title"] == "Harbor Lights (Film)"
    assert "Film/StubPage" not in works      # fewer than 3 tropes
    assert "YMMV/HarborLights" not in works  # metadata namespace


def test_parse_keeps_same_title_in_two_media_apart():
    works = _works()
    assert works["Film/EchoHarbor"]["title"] == works["Literature/EchoHarbor"]["title"]


def test_parse_collects_trope_definitions():
    with open(C.TROPES_PATH, encoding="utf-8") as f:
        tropes = json.load(f)
    assert tropes["The Caper"].startswith("A small crew plans")
