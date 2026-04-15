"""Training dataset collection + rating endpoints."""
from __future__ import annotations

import hashlib
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.training_log import TrainingLog

router = APIRouter(prefix="/training", tags=["training"])


def user_hash(user_id: str) -> str:
    return hashlib.sha256(user_id.encode()).hexdigest()[:16]


@router.post("/rate")
async def rate_response(
    body: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Оценить ответ: body = {log_id, rating: +1|-1, comment?: str}"""
    log_id = body.get("log_id")
    rating = body.get("rating")
    if not log_id or rating not in (1, -1):
        raise HTTPException(400, "log_id and rating (+1/-1) required")

    uh = user_hash(str(user.id))
    row = (
        await db.execute(select(TrainingLog).where(TrainingLog.id == log_id))
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(404, "log not found")
    if row.user_hash != uh:
        raise HTTPException(403, "not your log")

    row.user_rating = rating
    row.rating_comment = (body.get("comment") or "")[:500] or None
    from datetime import datetime, timezone
    row.rated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True}


@router.get("/stats")
async def training_stats(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Статистика по датасету — только для админа."""
    if not getattr(user, "is_admin", False):
        raise HTTPException(403, "admin only")
    from sqlalchemy import func as sqlfunc
    total = (await db.execute(select(sqlfunc.count(TrainingLog.id)))).scalar_one()
    rated = (
        await db.execute(select(sqlfunc.count(TrainingLog.id)).where(TrainingLog.user_rating.isnot(None)))
    ).scalar_one()
    positive = (
        await db.execute(select(sqlfunc.count(TrainingLog.id)).where(TrainingLog.user_rating == 1))
    ).scalar_one()
    return {
        "total_logs": total,
        "rated": rated,
        "positive": positive,
        "positive_rate": (positive / rated) if rated else None,
    }
