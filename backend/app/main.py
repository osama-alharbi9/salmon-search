"""main.py — salmon FastAPI backend.

A pure JSON API over the salmon recommendation engine plus the Claude tool-loop.
The Next.js frontend calls these endpoints; this server renders no HTML.

Run (dev):
    cd backend
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# load ANTHROPIC_API_KEY from backend/.env before the client is constructed
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

from starlette.middleware.sessions import SessionMiddleware  # noqa: E402

from salmon import engine          # noqa: E402  (after dotenv)
from app import llm                # noqa: E402
from app import vds                # noqa: E402
from app import auth               # noqa: E402
from app import saved              # noqa: E402
from app.db import init_db         # noqa: E402

app = FastAPI(title="salmon API", version="1.0")

# Create tables if they don't exist. Do NOT let a transient DB hiccup crash the
# whole process at import (that would kill the container with no useful log and
# take search, which needs no DB, down with it). Log and continue; the auth/saved
# routes will surface a clear error if the DB is truly unreachable.
import sys as _sys
try:
    init_db()
    print("[startup] init_db ok", flush=True)
except Exception as _e:                       # noqa: BLE001
    print(f"[startup] init_db FAILED (auth/saved routes will 500 until DB is up): {_e}",
          file=_sys.stderr, flush=True)

# Warm the e5 embedding model ONCE at startup. The model is a module global in
# vds.py, but if it loads lazily on the first /api/vds_search request, that
# request pays the ~12s model-load and the SentenceTransformer graph warm-up,
# which blows past Railway's request timeout -> 502 -> frontend "Failed to
# fetch". Loading + a dummy encode here makes the model resident and the graph
# compiled before any traffic, so every real search is fast (~tens of ms).
if os.environ.get("SALMON_SKIP_WARMUP", "").lower() not in ("1", "true", "yes"):
    try:
        import time as _time
        _t0 = _time.time()
        vds._ensure_artifacts()
        vds._ensure_model()
        vds.resolve_phrases(["warmup"])       # compile the encode graph once
        print(f"[startup] e5 model warmed in {_time.time() - _t0:.1f}s", flush=True)
    except Exception as _e:                   # noqa: BLE001
        print(f"[startup] e5 warmup FAILED (first search will be slow): {_e}",
              file=_sys.stderr, flush=True)

# allow the Next.js dev server (and configurable origins) to call us. Cookies
# require allow_credentials + explicit origins (a "*" origin forbids credentials).
_origins = os.environ.get("SALMON_CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Authlib stores the OAuth state/nonce in this signed session during the redirect.
app.add_middleware(SessionMiddleware, secret_key=auth.SESSION_SECRET,
                   same_site=auth.COOKIE_SAMESITE, https_only=auth.SECURE_COOKIES)

app.include_router(auth.router)
app.include_router(saved.router)
app.include_router(saved.works_router)
app.include_router(saved.history_router)


# ---- request models ---------------------------------------------------------
class Turn(BaseModel):
    role: str
    content: str


class AskBody(BaseModel):
    q: str
    history: list[Turn] = []


class WorkBody(BaseModel):
    namespace: str = ""
    title: str = ""


class WorkIdBody(BaseModel):
    id: str = ""


class TropesBody(BaseModel):
    tropes: list[str] = []
    namespaces: list[str] | None = None


class VibeBody(BaseModel):
    vibe: str = ""


class ResolveBody(BaseModel):
    phrases: list[str] = []


class VdsSearchBody(BaseModel):
    items: list[str] = []


# ---- routes -----------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"ok": True, "model": llm.MODEL}


@app.get("/api/config")
def config():
    """Optional features this server has set up, so the UI can hide the ones that
    would fail: Google sign-in needs OAuth credentials, the vibe field needs an
    Anthropic key. Trope search needs neither."""
    return {"google": auth.google_enabled(),
            "vibe": bool(os.environ.get("ANTHROPIC_API_KEY"))}


@app.post("/api/ask")
def ask(body: AskBody):
    text = body.q.strip()
    if not text:
        return {"answer": "Type something.", "source": None, "results": []}
    history = [{"role": t.role, "content": t.content} for t in body.history[-20:]
               if t.role in ("user", "assistant") and t.content]
    try:
        out = llm.chat(history, text)
    except Exception as e:                       # surface auth/engine errors
        msg = ("Server is missing a valid ANTHROPIC_API_KEY."
               if "authentication" in str(e).lower() else f"Error: {e}")
        return {"answer": msg, "source": None, "results": []}
    return {"answer": out["text"], "source": out["source"], "results": out["results"]}


@app.post("/api/work")
def work(body: WorkBody):
    return engine.work_tropes(body.namespace, body.title)


@app.post("/api/work_by_id")
def work_by_id(body: WorkIdBody):
    return engine.work_by_id(body.id)


@app.post("/api/by_tropes")
def by_tropes(body: TropesBody):
    tropes = [t.strip() for t in body.tropes if t and t.strip()]
    if not tropes:
        return {"found": False, "results": [], "resolved": [], "unknown": []}
    return engine.works_by_tropes(tropes, namespaces=body.namespaces)


# ---- VDS (Vibe, Don't Search) ------------------------------------------------
@app.post("/api/vibe")
def vibe(body: VibeBody):
    """vibe text -> loose trope-like phrases (Claude, no canonical names)."""
    try:
        phrases = vds.vibe_to_phrases(body.vibe)
    except Exception as e:
        return {"phrases": [], "error": f"Could not read the vibe: {e}"}
    return {"phrases": phrases}


@app.post("/api/resolve")
def resolve(body: ResolveBody):
    """loose phrases -> real canonical tropes (engine's embedding resolution)."""
    return vds.resolve_phrases(body.phrases)


@app.post("/api/vds_search")
def vds_search(body: VdsSearchBody):
    """The single VDS search: classify chips (trope vs title), expand titles to
    their tropes, then coverage-rank works. Everything runs on trope coverage."""
    return vds.vds_search(body.items)
