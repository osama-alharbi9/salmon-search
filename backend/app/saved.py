"""saved.py — per-user saved data (auth-gated).

Three self-contained pieces, each a separate router so they can be tested alone:
  - saved searches   (/api/saved_searches)  save / list / rename / run / delete
  - saved works      (/api/saved_works)     bookmark / list / remove
  - search history   (/api/history)         auto-recorded, list / re-run / clear

A saved search and a history entry both store the exact raw `items` list the VDS
panel sends to /api/vds_search, so re-running is just replaying it through the
unchanged search path. The engine and ranking are never touched here.

Every route requires a logged-in user (current_user, 401 otherwise) and only ever
touches rows owned by that user.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.auth import current_user
from app.db import (
    HISTORY_CAP, SavedSearch, SavedWork, SearchHistory, User, get_db,
)

router = APIRouter(prefix="/api/saved_searches", tags=["saved"])


class SaveSearchBody(BaseModel):
    name: str
    items: list[str]

    @field_validator("name")
    @classmethod
    def _name_ok(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Name is required.")
        return v[:200]

    @field_validator("items")
    @classmethod
    def _items_ok(cls, v: list[str]) -> list[str]:
        cleaned = [s.strip() for s in (v or []) if s and s.strip()]
        if not cleaned:
            raise ValueError("Cannot save an empty search.")
        return cleaned


@router.get("")
def list_searches(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(SavedSearch)
        .where(SavedSearch.user_id == user.id)
        .order_by(SavedSearch.created_at.desc())
    ).all()
    return {"saved": [r.public() for r in rows]}


@router.post("")
def create_search(body: SaveSearchBody, user: User = Depends(current_user),
                  db: Session = Depends(get_db)):
    row = SavedSearch(user_id=user.id, name=body.name, items=body.items)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row.public()


class RenameBody(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def _name_ok(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("Name is required.")
        return v[:200]


@router.patch("/{search_id}")
def rename_search(search_id: int, body: RenameBody,
                  user: User = Depends(current_user), db: Session = Depends(get_db)):
    row = db.get(SavedSearch, search_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "Saved search not found.")
    row.name = body.name
    db.commit()
    db.refresh(row)
    return row.public()


@router.delete("/{search_id}")
def delete_search(search_id: int, user: User = Depends(current_user),
                  db: Session = Depends(get_db)):
    row = db.get(SavedSearch, search_id)
    if not row or row.user_id != user.id:
        raise HTTPException(404, "Saved search not found.")
    db.execute(delete(SavedSearch).where(SavedSearch.id == search_id))
    db.commit()
    return {"ok": True}


# ── saved works (bookmarks) ──────────────────────────────────────────────────
works_router = APIRouter(prefix="/api/saved_works", tags=["saved"])


class SaveWorkBody(BaseModel):
    work_id: str
    title: str
    namespace: str | None = None

    @field_validator("work_id", "title")
    @classmethod
    def _required(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("work_id and title are required.")
        return v[:500]


@works_router.get("")
def list_works(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(SavedWork)
        .where(SavedWork.user_id == user.id)
        .order_by(SavedWork.created_at.desc())
    ).all()
    return {"saved": [r.public() for r in rows]}


@works_router.post("")
def save_work(body: SaveWorkBody, user: User = Depends(current_user),
              db: Session = Depends(get_db)):
    # idempotent: saving an already-saved work just returns it
    existing = db.scalar(
        select(SavedWork).where(SavedWork.user_id == user.id,
                                SavedWork.work_id == body.work_id))
    if existing:
        return existing.public()
    row = SavedWork(user_id=user.id, work_id=body.work_id, title=body.title,
                    namespace=body.namespace)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row.public()


@works_router.delete("/{work_id:path}")
def remove_work(work_id: str, user: User = Depends(current_user),
                db: Session = Depends(get_db)):
    """Remove a bookmark by its work_id (Namespace/Slug). Path-typed so the slash
    in the id is allowed."""
    db.execute(delete(SavedWork).where(SavedWork.user_id == user.id,
                                       SavedWork.work_id == work_id))
    db.commit()
    return {"ok": True}


# ── search history ───────────────────────────────────────────────────────────
history_router = APIRouter(prefix="/api/history", tags=["saved"])


class HistoryBody(BaseModel):
    items: list[str]

    @field_validator("items")
    @classmethod
    def _items_ok(cls, v: list[str]) -> list[str]:
        return [s.strip() for s in (v or []) if s and s.strip()]


@history_router.get("")
def list_history(user: User = Depends(current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(SearchHistory)
        .where(SearchHistory.user_id == user.id)
        .order_by(SearchHistory.created_at.desc())
        .limit(HISTORY_CAP)
    ).all()
    return {"history": [r.public() for r in rows]}


@history_router.post("")
def record_history(body: HistoryBody, user: User = Depends(current_user),
                   db: Session = Depends(get_db)):
    """Record one search. No-op on empty items. Prunes to HISTORY_CAP newest."""
    if not body.items:
        return {"ok": True, "recorded": False}
    db.add(SearchHistory(user_id=user.id, items=body.items))
    db.commit()
    # prune: keep only the newest HISTORY_CAP rows for this user
    count = db.scalar(
        select(func.count()).select_from(SearchHistory)
        .where(SearchHistory.user_id == user.id))
    if count and count > HISTORY_CAP:
        cutoff = db.scalar(
            select(SearchHistory.created_at)
            .where(SearchHistory.user_id == user.id)
            .order_by(SearchHistory.created_at.desc())
            .offset(HISTORY_CAP).limit(1))
        if cutoff is not None:
            db.execute(delete(SearchHistory).where(
                SearchHistory.user_id == user.id,
                SearchHistory.created_at < cutoff))
            db.commit()
    return {"ok": True, "recorded": True}


@history_router.delete("")
def clear_history(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.execute(delete(SearchHistory).where(SearchHistory.user_id == user.id))
    db.commit()
    return {"ok": True}
