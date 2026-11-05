"""db.py — database layer for salmon (SQLite or Postgres via SQLAlchemy 2.0).

Owns the engine, session factory, and ORM models. Auth (step 1) defines the
User table here; saved searches / works / history (steps 2-4) will add their own
tables alongside it. Tables are created at import via create_all (no migrations
yet; add Alembic when the schema starts changing in production).

Connection string comes from DATABASE_URL in backend/.env, e.g.
    postgresql+psycopg://USER:PASSWORD@localhost:5432/salmon
When it is empty, accounts and saved data live in a local SQLite file at
backend/data/salmon.db, so a fresh clone needs no database server.
"""
from __future__ import annotations

import datetime as _dt
import os

from sqlalchemy import (
    JSON, DateTime, ForeignKey, String, UniqueConstraint, create_engine, func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker,
)

_DEFAULT_SQLITE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "salmon.db")
DATABASE_URL = os.environ.get("DATABASE_URL") or f"sqlite:///{_DEFAULT_SQLITE}"
# Managed Postgres (Railway, Neon, Heroku) hands out a bare "postgresql://" (or
# legacy "postgres://") URL. SQLAlchemy needs the psycopg 3 driver named
# explicitly, so normalise the scheme rather than make the user edit the URL.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgres://"):]
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = "postgresql+psycopg://" + DATABASE_URL[len("postgresql://"):]

_connect_args: dict = {}
if DATABASE_URL.startswith("sqlite"):
    # FastAPI runs a request's dependency and handler on different pool threads.
    _connect_args["check_same_thread"] = False
    if DATABASE_URL == f"sqlite:///{_DEFAULT_SQLITE}":
        os.makedirs(os.path.dirname(_DEFAULT_SQLITE), exist_ok=True)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# JSONB on Postgres, plain JSON on SQLite.
_JsonList = JSON().with_variant(JSONB(), "postgresql")


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    # nullable: Google-only users have no local password
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Google's stable subject id, set when an account is linked via OAuth
    google_sub: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    def public(self) -> dict:
        """Safe-to-return view of a user (never includes the password hash)."""
        return {"id": self.id, "email": self.email, "name": self.name,
                "has_google": self.google_sub is not None}


class SavedSearch(Base):
    """A named search a user can re-run. `items` is the exact raw input list the
    VDS panel sends to /api/vds_search (trope chips, any "like Title", and any
    medium-filter clause), so re-running is just replaying it."""
    __tablename__ = "saved_searches"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200))
    items: Mapped[list] = mapped_column(_JsonList)
    created_at: Mapped[_dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship()

    def public(self) -> dict:
        return {"id": self.id, "name": self.name, "items": self.items,
                "created_at": self.created_at.isoformat() if self.created_at else None}


class SavedWork(Base):
    """A bookmarked work. work_id is the engine's canonical "Namespace/Slug" id,
    so it links straight to the work page. Unique per (user, work) so saving twice
    is a no-op rather than a duplicate."""
    __tablename__ = "saved_works"
    __table_args__ = (UniqueConstraint("user_id", "work_id", name="uq_user_work"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    work_id: Mapped[str] = mapped_column(String(500))      # "Namespace/Slug"
    title: Mapped[str] = mapped_column(String(500))
    namespace: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship()

    def public(self) -> dict:
        return {"id": self.id, "work_id": self.work_id, "title": self.title,
                "namespace": self.namespace,
                "created_at": self.created_at.isoformat() if self.created_at else None}


class SearchHistory(Base):
    """Auto-recorded per-user search. `items` is the same raw VDS input list, so a
    history entry is re-runnable. Capped at HISTORY_CAP rows per user (oldest
    pruned) so it never grows without bound."""
    __tablename__ = "search_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True)
    items: Mapped[list] = mapped_column(_JsonList)
    created_at: Mapped[_dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship()

    def public(self) -> dict:
        return {"id": self.id, "items": self.items,
                "created_at": self.created_at.isoformat() if self.created_at else None}


# keep at most this many history rows per user (oldest pruned on insert)
HISTORY_CAP = 100


def init_db() -> None:
    """Create tables if they do not exist. Safe to call on every startup."""
    Base.metadata.create_all(engine)


def get_db():
    """FastAPI dependency: yields a session, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
