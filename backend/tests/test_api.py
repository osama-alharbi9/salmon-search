"""The HTTP surface: search with no keys, then accounts and saved data on SQLite."""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.auth import resolve_session_secret
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def signed_in(client):
    r = client.post("/api/auth/signup",
                    json={"email": f"{uuid.uuid4().hex}@example.com", "password": "correct-horse"})
    assert r.status_code == 200
    return client


def test_health(client):
    assert client.get("/api/health").json()["ok"] is True


def test_config_reports_optional_features(client, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    body = client.get("/api/config").json()
    assert body["vibe"] is False
    assert isinstance(body["google"], bool)
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    assert client.get("/api/config").json()["vibe"] is True


def test_search_needs_no_keys_and_no_login(client, fake_model):
    r = client.post("/api/vds_search", json={"items": ["found family", "the caper"]})
    assert r.status_code == 200
    assert r.json()["results"][0]["id"] == "Series/NineTenths"


def test_work_by_id(client):
    body = client.post("/api/work_by_id", json={"id": "Film/HarborLights"}).json()
    assert body["found"] is True
    assert "The Caper" in body["tropes"]
    assert body["intro"].startswith("Dock workers")
    assert body["url"].endswith("/Film/HarborLights")
    assert client.post("/api/work_by_id", json={"id": "Film/Nope"}).json() == {"found": False}


def test_vibe_without_a_key_explains_itself(client, monkeypatch):
    from app import llm
    monkeypatch.setattr(llm, "_client", None)
    body = client.post("/api/vibe", json={"vibe": "cozy heist"}).json()
    assert body["phrases"] == []
    assert "ANTHROPIC_API_KEY" in body["error"]


def test_signup_login_logout(client):
    creds = {"email": f"{uuid.uuid4().hex}@example.com", "password": "correct-horse"}
    assert client.post("/api/auth/signup", json=creds).status_code == 200
    assert client.get("/api/auth/me").json()["user"]["email"] == creds["email"]
    assert "hashed_password" not in client.get("/api/auth/me").json()["user"]

    client.post("/api/auth/logout")
    client.cookies.clear()
    assert client.get("/api/auth/me").json()["user"] is None

    bad = client.post("/api/auth/login", json={**creds, "password": "wrong-password"})
    assert bad.status_code == 401
    assert client.post("/api/auth/login", json=creds).status_code == 200


def test_short_password_rejected(client):
    r = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "short"})
    assert r.status_code == 400


def test_saved_routes_require_login(client):
    assert client.get("/api/saved_searches").status_code == 401
    assert client.get("/api/saved_works").status_code == 401
    assert client.get("/api/history").status_code == 401


def test_saved_search_round_trip(signed_in):
    saved = signed_in.post("/api/saved_searches",
                           json={"name": "heists", "items": ["the caper", "movies only"]}).json()
    assert saved["items"] == ["the caper", "movies only"]
    assert signed_in.get("/api/saved_searches").json()["saved"][0]["name"] == "heists"
    signed_in.patch(f"/api/saved_searches/{saved['id']}", json={"name": "capers"})
    assert signed_in.get("/api/saved_searches").json()["saved"][0]["name"] == "capers"
    signed_in.delete(f"/api/saved_searches/{saved['id']}")
    assert signed_in.get("/api/saved_searches").json()["saved"] == []


def test_saved_work_is_idempotent(signed_in):
    body = {"work_id": "Film/HarborLights", "title": "Harbor Lights (Film)", "namespace": "Film"}
    first = signed_in.post("/api/saved_works", json=body).json()
    assert signed_in.post("/api/saved_works", json=body).json()["id"] == first["id"]
    assert len(signed_in.get("/api/saved_works").json()["saved"]) == 1
    signed_in.delete("/api/saved_works/Film/HarborLights")
    assert signed_in.get("/api/saved_works").json()["saved"] == []


def test_history_records_and_clears(signed_in):
    assert signed_in.post("/api/history", json={"items": []}).json()["recorded"] is False
    assert signed_in.post("/api/history", json={"items": ["the caper"]}).json()["recorded"] is True
    assert signed_in.get("/api/history").json()["history"][0]["items"] == ["the caper"]
    signed_in.delete("/api/history")
    assert signed_in.get("/api/history").json()["history"] == []


def test_session_secret_has_no_hardcoded_fallback():
    assert resolve_session_secret("configured", secure=True) == "configured"
    a, b = resolve_session_secret("", secure=False), resolve_session_secret("", secure=False)
    assert a != b and len(a) > 32
    with pytest.raises(RuntimeError):
        resolve_session_secret("", secure=True)
