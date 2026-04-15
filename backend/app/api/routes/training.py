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


def _admin_only(user):
    if not getattr(user, "is_admin", False):
        raise HTTPException(403, "admin only")


@router.get("/stats")
async def training_stats(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Полная статистика по датасету (admin)."""
    _admin_only(user)
    from sqlalchemy import func as sqlfunc, distinct

    total = (await db.execute(select(sqlfunc.count(TrainingLog.id)))).scalar_one()
    rated = (await db.execute(
        select(sqlfunc.count(TrainingLog.id)).where(TrainingLog.user_rating.isnot(None))
    )).scalar_one()
    positive = (await db.execute(
        select(sqlfunc.count(TrainingLog.id)).where(TrainingLog.user_rating == 1)
    )).scalar_one()

    # Mode usage distribution
    mode_rows = (await db.execute(
        select(TrainingLog.mode, sqlfunc.count(TrainingLog.id), sqlfunc.avg(TrainingLog.total_cost_usd))
        .group_by(TrainingLog.mode)
    )).all()
    by_mode = [
        {"mode": m, "count": c, "avg_cost": float(cost or 0)}
        for m, c, cost in mode_rows
    ]

    # Positive rate per mode
    pos_rows = (await db.execute(
        select(TrainingLog.mode, sqlfunc.count(TrainingLog.id))
        .where(TrainingLog.user_rating == 1)
        .group_by(TrainingLog.mode)
    )).all()
    pos_by_mode = {m: c for m, c in pos_rows}

    # Daily counts (last 30 days)
    daily_rows = (await db.execute(
        select(
            sqlfunc.date_trunc("day", TrainingLog.created_at).label("day"),
            sqlfunc.count(TrainingLog.id),
            sqlfunc.sum(TrainingLog.total_cost_usd),
        )
        .group_by("day")
        .order_by("day")
        .limit(60)
    )).all()
    daily = [{"day": d.isoformat() if d else "", "count": c, "cost": float(cost or 0)} for d, c, cost in daily_rows]

    # Unique users (anonymized)
    unique_users = (await db.execute(
        select(sqlfunc.count(distinct(TrainingLog.user_hash)))
    )).scalar_one()

    return {
        "total_logs": total,
        "rated": rated,
        "positive": positive,
        "positive_rate": (positive / rated) if rated else None,
        "unique_users": unique_users,
        "by_mode": by_mode,
        "positive_by_mode": pos_by_mode,
        "daily": daily,
        "ready_for_finetune": rated >= 10000,  # минимум для LoRA
    }


@router.get("/logs")
async def training_logs(
    page: int = 1,
    page_size: int = 50,
    mode: str | None = None,
    rating: int | None = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Список логов (admin) с пагинацией и фильтрами."""
    _admin_only(user)
    from sqlalchemy import func as sqlfunc

    page = max(1, page)
    page_size = max(1, min(200, page_size))

    q = select(TrainingLog).order_by(TrainingLog.created_at.desc())
    if mode:
        q = q.where(TrainingLog.mode == mode)
    if rating == 1:
        q = q.where(TrainingLog.user_rating == 1)
    elif rating == -1:
        q = q.where(TrainingLog.user_rating == -1)
    elif rating == 0:
        q = q.where(TrainingLog.user_rating.is_(None))

    # Total count for pagination
    count_q = select(sqlfunc.count(TrainingLog.id))
    if mode:
        count_q = count_q.where(TrainingLog.mode == mode)
    if rating == 1:
        count_q = count_q.where(TrainingLog.user_rating == 1)
    elif rating == -1:
        count_q = count_q.where(TrainingLog.user_rating == -1)
    elif rating == 0:
        count_q = count_q.where(TrainingLog.user_rating.is_(None))
    total = (await db.execute(count_q)).scalar_one()

    rows = (await db.execute(q.offset((page - 1) * page_size).limit(page_size))).scalars().all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
        "items": [
            {
                "id": str(r.id),
                "mode": r.mode,
                "user_hash": r.user_hash,
                "user_query": (r.user_query or "")[:300],
                "final_response": (r.final_response or "")[:300],
                "chosen_models": r.chosen_models,
                "router_decision": r.router_decision,
                "total_tokens": r.total_tokens,
                "total_cost_usd": r.total_cost_usd,
                "duration_sec": r.duration_sec,
                "success": r.success,
                "user_rating": r.user_rating,
                "rating_comment": r.rating_comment,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ],
    }


@router.get("/export")
async def training_export(
    rated_only: bool = True,
    positive_only: bool = False,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Экспорт в JSONL для fine-tune (admin)."""
    _admin_only(user)
    from fastapi.responses import StreamingResponse
    import json as _json

    q = select(TrainingLog).order_by(TrainingLog.created_at)
    if rated_only:
        q = q.where(TrainingLog.user_rating.isnot(None))
    if positive_only:
        q = q.where(TrainingLog.user_rating == 1)

    async def stream():
        rows = (await db.execute(q)).scalars().all()
        for r in rows:
            obj = {
                "messages": [
                    {"role": "user", "content": r.user_query},
                    {"role": "assistant", "content": r.final_response or ""},
                ],
                "metadata": {
                    "mode": r.mode,
                    "models": r.chosen_models,
                    "rating": r.user_rating,
                    "tokens": r.total_tokens,
                    "cost": r.total_cost_usd,
                },
            }
            yield _json.dumps(obj, ensure_ascii=False) + "\n"

    return StreamingResponse(
        stream(),
        media_type="application/jsonl",
        headers={"Content-Disposition": "attachment; filename=xerocode_training.jsonl"},
    )
