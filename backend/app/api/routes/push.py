"""Push notification subscribe/unsubscribe endpoints."""
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.push_subscription import PushSubscription

router = APIRouter(prefix="/push", tags=["push"])
logger = logging.getLogger(__name__)


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Public VAPID key for client subscription."""
    key = getattr(settings, "vapid_public_key", None)
    if not key:
        raise HTTPException(503, "Push not configured on server")
    return {"key": key}


@router.post("/subscribe")
async def subscribe(
    body: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Body: {endpoint, keys: {p256dh, auth}, user_agent?}"""
    endpoint = body.get("endpoint")
    keys = body.get("keys") or {}
    if not endpoint or not keys.get("p256dh") or not keys.get("auth"):
        raise HTTPException(400, "endpoint + keys.p256dh + keys.auth required")

    # Upsert (delete existing if endpoint matches, then insert fresh)
    await db.execute(delete(PushSubscription).where(PushSubscription.endpoint == endpoint))
    sub = PushSubscription(
        id=uuid.uuid4(),
        user_id=user.id,
        endpoint=endpoint,
        p256dh=keys["p256dh"],
        auth=keys["auth"],
        user_agent=(body.get("user_agent") or "")[:500] or None,
    )
    db.add(sub)
    await db.commit()
    return {"ok": True, "subscription_id": str(sub.id)}


@router.post("/unsubscribe")
async def unsubscribe(body: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    endpoint = body.get("endpoint")
    if not endpoint:
        raise HTTPException(400, "endpoint required")
    await db.execute(
        delete(PushSubscription).where(
            PushSubscription.user_id == user.id,
            PushSubscription.endpoint == endpoint,
        )
    )
    await db.commit()
    return {"ok": True}


@router.post("/test")
async def test_push(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Отправить тестовый push (для отладки)."""
    from app.services.push_service import send_push_to_user
    delivered = await send_push_to_user(
        db, str(user.id),
        title="XeroCode",
        body="Push-нотификации работают! ✅",
        url="/",
        tag="test",
    )
    return {"delivered": delivered}
