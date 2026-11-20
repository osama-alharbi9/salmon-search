"""auth.py — email/password + Google sign-in for salmon.

Sessions are a signed token in an httpOnly cookie (not JS-readable, so a stolen
XSS payload cannot read it). The token is signed with SALMON_SESSION_SECRET via
itsdangerous and carries only the user id; the server looks the user up per
request. Passwords are bcrypt-hashed, never stored in plaintext.

Search endpoints stay public. Only these /api/auth/* routes and (later) the
saved-data routes use the session.

Secrets read from backend/.env (you add them yourself, see .env.example):
    SALMON_SESSION_SECRET   long random string, signs session cookies
    GOOGLE_CLIENT_ID        Google OAuth 2.0 client id
    GOOGLE_CLIENT_SECRET    Google OAuth 2.0 client secret
"""
from __future__ import annotations

import os
import secrets
import sys

import bcrypt
from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, URLSafeTimedSerializer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette.responses import RedirectResponse

from app.db import User, get_db

# ── config ───────────────────────────────────────────────────────────────────
SESSION_COOKIE = "salmon_session"
SESSION_MAX_AGE = 60 * 60 * 24 * 14            # 14 days
# where the SPA lives, so OAuth can bounce the browser back to it
FRONTEND_URL = os.environ.get("SALMON_FRONTEND_URL", "http://localhost:3000")

# Production = HTTPS, and frontend (Vercel) and backend (Railway) are on DIFFERENT
# domains, so the session cookie must be SameSite=None + Secure or the browser
# will not send it on cross-site XHR. Locally (http) we use Lax + insecure.
# Set SALMON_SECURE_COOKIES=1 (or true/yes) in production.
SECURE_COOKIES = os.environ.get("SALMON_SECURE_COOKIES", "").lower() in ("1", "true", "yes")
COOKIE_SAMESITE = "none" if SECURE_COOKIES else "lax"


def resolve_session_secret(configured: str, secure: bool) -> str:
    """The cookie signing key. There is no hardcoded fallback: production must set
    one, and local dev without one gets a random key for this process only."""
    if configured:
        return configured
    if secure:
        raise RuntimeError("SALMON_SESSION_SECRET must be set when SALMON_SECURE_COOKIES is on.")
    print("[startup] SALMON_SESSION_SECRET not set: using a random key, so logins "
          "reset when the server restarts.", file=sys.stderr, flush=True)
    return secrets.token_urlsafe(48)


SESSION_SECRET = resolve_session_secret(os.environ.get("SALMON_SESSION_SECRET", ""), SECURE_COOKIES)

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET", "")

_signer = URLSafeTimedSerializer(SESSION_SECRET, salt="salmon-session")

oauth = OAuth()
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name="google",
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ── password hashing (bcrypt directly; passlib 1.7 + bcrypt 5 are incompatible)
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ── session cookie ───────────────────────────────────────────────────────────
def issue_session(resp: Response, user_id: int) -> None:
    token = _signer.dumps({"uid": user_id})
    resp.set_cookie(
        SESSION_COOKIE, token,
        max_age=SESSION_MAX_AGE, httponly=True,
        samesite=COOKIE_SAMESITE, secure=SECURE_COOKIES,
        path="/",
    )


def clear_session(resp: Response) -> None:
    resp.delete_cookie(SESSION_COOKIE, path="/")


def _uid_from_cookie(token: str | None) -> int | None:
    if not token:
        return None
    try:
        data = _signer.loads(token, max_age=SESSION_MAX_AGE)
        return int(data["uid"])
    except (BadSignature, KeyError, ValueError, TypeError):
        return None


def current_user(
    db: Session = Depends(get_db),
    salmon_session: str | None = Cookie(default=None),
) -> User:
    """Dependency for routes that REQUIRE a logged-in user (401 if not)."""
    uid = _uid_from_cookie(salmon_session)
    user = db.get(User, uid) if uid else None
    if not user:
        raise HTTPException(status_code=401, detail="Not signed in.")
    return user


def optional_user(
    db: Session = Depends(get_db),
    salmon_session: str | None = Cookie(default=None),
) -> User | None:
    """Dependency for routes that work logged-out but personalise if logged in."""
    uid = _uid_from_cookie(salmon_session)
    return db.get(User, uid) if uid else None


# ── request models ───────────────────────────────────────────────────────────
class Credentials(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


# ── email / password routes ──────────────────────────────────────────────────
@router.post("/signup")
def signup(body: Credentials, resp: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters.")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "An account with that email already exists.")
    user = User(email=email, hashed_password=hash_password(body.password),
                name=(body.name or "").strip() or None)
    db.add(user)
    db.commit()
    db.refresh(user)
    issue_session(resp, user.id)
    return user.public()


@router.post("/login")
def login(body: Credentials, resp: Response, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.hashed_password or not verify_password(
        body.password, user.hashed_password
    ):
        raise HTTPException(401, "Wrong email or password.")
    issue_session(resp, user.id)
    return user.public()


@router.post("/logout")
def logout(resp: Response):
    clear_session(resp)
    return {"ok": True}


@router.get("/me")
def me(user: User | None = Depends(optional_user)):
    """Current user, or null when logged out. Never 401s, the UI polls this."""
    return {"user": user.public() if user else None}


# ── Google OAuth ─────────────────────────────────────────────────────────────
def google_enabled() -> bool:
    """True when Google OAuth credentials are set, so the login route works."""
    return "google" in oauth._clients


@router.get("/google/login")
async def google_login(request: Request):
    if not google_enabled():
        raise HTTPException(503, "Google sign-in is not configured on the server.")
    redirect_uri = str(request.url_for("google_callback"))
    # Behind Railway's TLS-terminating proxy the app sees http, so url_for builds
    # an http:// callback that Google rejects. Force https in production (Google
    # requires https for non-localhost redirect URIs).
    if SECURE_COOKIES and redirect_uri.startswith("http://"):
        redirect_uri = "https://" + redirect_uri[len("http://"):]
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    if not google_enabled():
        raise HTTPException(503, "Google sign-in is not configured on the server.")
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception:
        return RedirectResponse(f"{FRONTEND_URL}/app?auth=google_failed")
    info = token.get("userinfo") or {}
    sub, email = info.get("sub"), (info.get("email") or "").lower()
    if not sub or not email:
        return RedirectResponse(f"{FRONTEND_URL}/app?auth=google_failed")

    # link by google_sub, else by existing email, else create
    user = db.scalar(select(User).where(User.google_sub == sub))
    if not user:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.google_sub = sub
        else:
            user = User(email=email, google_sub=sub, name=info.get("name"))
            db.add(user)
    db.commit()
    db.refresh(user)

    resp = RedirectResponse(f"{FRONTEND_URL}/app?auth=ok")
    issue_session(resp, user.id)
    return resp
