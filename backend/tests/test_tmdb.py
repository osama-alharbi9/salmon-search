"""TMDB poster lookup, offline: the TMDB search call is replaced with canned answers."""
import pytest

from app import tmdb


def _movie(id_, title, votes, poster="/p.jpg", date="2014-11-05", genres=()):
    return {"id": id_, "title": title, "original_title": title, "vote_count": votes,
            "poster_path": poster, "backdrop_path": "/b.jpg", "release_date": date, "genre_ids": list(genres)}


@pytest.fixture
def fake_tmdb(monkeypatch, tmp_path):
    monkeypatch.setenv("TMDB_API_KEY", "test-key")
    monkeypatch.setenv("SALMON_TMDB_CACHE", str(tmp_path / "tmdb.sqlite"))
    calls = []
    answers = {
        ("movie", "Interstellar"): [_movie(2, "Inside Interstellar", 900), _movie(1, "Interstellar", 30000)],
        ("tv", "The Office"): [
            {"id": 7, "name": "The Office", "original_name": "The Office", "vote_count": 800,
             "poster_path": "/uk.jpg", "first_air_date": "2001-07-09"},
            {"id": 8, "name": "The Office", "original_name": "The Office", "vote_count": 4000,
             "poster_path": "/us.jpg", "first_air_date": "2005-03-24"},
        ],
        ("movie", "Abduction"): [_movie(3, "Abduction Of Eden", 10)],
        ("movie", "Cinderella"): [
            _movie(10, "Cinderella", 7573, date="2015-03-06"),
            _movie(11, "Cinderella", 7361, date="1950-02-22", genres=(16,)),
        ],
        ("tv", "Cinderella"): [
            {"id": 12, "name": "Cinderella", "original_name": "Cinderella", "vote_count": 3,
             "poster_path": "/tv.jpg", "first_air_date": "2011-01-01", "genre_ids": []},
        ],
    }

    def fake_get(path, **params):
        kind = path.rsplit("/", 1)[1]
        calls.append((kind, params["query"]))
        return {"results": answers.get((kind, params["query"]), [])}

    monkeypatch.setattr(tmdb, "_get", fake_get)
    return calls


def test_exact_title_with_most_votes_wins(fake_tmdb):
    out = tmdb.media([("Film/Interstellar", "Interstellar", "Film")])
    m = out["Film/Interstellar"]
    assert m["tmdb_url"] == "https://www.themoviedb.org/movie/1"
    assert m["poster"].endswith("/w342/p.jpg")
    assert m["year"] == "2014"


def test_trailing_note_is_dropped_and_votes_break_ties(fake_tmdb):
    out = tmdb.media([("Series/TheOfficeUS", "The Office (US)", "Series")])
    assert out["Series/TheOfficeUS"]["tmdb_url"] == "https://www.themoviedb.org/tv/8"


def test_animation_prefers_animated_matches_across_tv_and_film(fake_tmdb):
    out = tmdb.media([("WesternAnimation/Cinderella", "Cinderella", "WesternAnimation")])
    assert out["WesternAnimation/Cinderella"]["tmdb_url"] == "https://www.themoviedb.org/movie/11"


def test_a_year_in_the_id_or_title_must_match(fake_tmdb):
    out = tmdb.media([
        ("Film/Cinderella2015", "Cinderella", "Film"),
        ("Film/CinderellaX", "Cinderella (2015)", "Film"),
        ("Film/Cinderella1977", "Cinderella", "Film"),
    ])
    assert out["Film/Cinderella2015"]["year"] == "2015"
    assert out["Film/CinderellaX"]["year"] == "2015"
    assert out["Film/Cinderella1977"] is None


def test_year_hint():
    assert tmdb.year_hint("WesternAnimation/Cinderella1950", "Cinderella") == "1950"
    assert tmdb.year_hint("Film/ReadyOrNot2019", "Ready or Not (2019)") == "2019"
    assert tmdb.year_hint("Film/X", "Girlfriends (Film 2000)") == "2000"
    assert tmdb.year_hint("Film/Interstellar", "Interstellar") is None
    assert tmdb.year_hint("Film/BladeRunner2049", "Blade Runner 2049") is None


def test_no_exact_match_means_no_poster(fake_tmdb):
    assert tmdb.media([("Film/Abduction", "Abduction", "Film")]) == {"Film/Abduction": None}


def test_franchise_pages_get_no_poster(fake_tmdb):
    assert tmdb.media([("Film/Interstellar", "Interstellar (Franchise)", "Film")]) == {"Film/Interstellar": None}
    assert fake_tmdb == []


def test_media_types_tmdb_does_not_cover_are_skipped(fake_tmdb):
    out = tmdb.media([("VideoGame/Portal", "Portal", "VideoGame")])
    assert out == {"VideoGame/Portal": None}
    assert fake_tmdb == []


def test_answers_and_misses_are_cached(fake_tmdb):
    works = [("Film/Interstellar", "Interstellar", "Film"), ("Film/Abduction", "Abduction", "Film")]
    first = tmdb.media(works)
    n = len(fake_tmdb)
    assert tmdb.media(works) == first
    assert len(fake_tmdb) == n


def test_network_errors_are_not_cached(fake_tmdb, monkeypatch):
    def boom(path, **params):
        raise OSError("offline")

    monkeypatch.setattr(tmdb, "_get", boom)
    assert tmdb.media([("Film/Interstellar", "Interstellar", "Film")]) == {"Film/Interstellar": None}
    monkeypatch.setattr(tmdb, "_get", lambda path, **p: {"results": [_movie(1, "Interstellar", 5)]})
    assert tmdb.media([("Film/Interstellar", "Interstellar", "Film")])["Film/Interstellar"] is not None


def test_without_a_key_nothing_is_looked_up(fake_tmdb, monkeypatch):
    monkeypatch.delenv("TMDB_API_KEY")
    assert tmdb.media([("Film/Interstellar", "Interstellar", "Film")]) == {"Film/Interstellar": None}
    assert fake_tmdb == []
