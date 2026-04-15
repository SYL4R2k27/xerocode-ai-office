"""Web Push notifications via pywebpush.

Config required: vapid_private_key, vapid_public_key, vapid_subject (mailto:admin@xerocode.ru).
"""
from __future__ import annotations

import json
import logging
from typing import Optional

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.push_subscription import PushSubscription

logger = logging.getLogger(__name__)


async def send_push_to_user(
    db: AsyncSession,
    user_id: str,
    title: str,
    body: str,
    url: str = "/",
    tag: str = "xc-notif",
) -> int:
    """Отправить push всем активным подпискам юзера. Возвращает кол-во доставленных."""
    if not getattr(settings, "vapid_private_key", None):
        logger.warning("[Push] VAPID not configured — skipping send")
        return 0

    try:
        from pywebpush import webpush, WebPushException  # type: ignore
    except ImportError:
        logger.error("[Push] pywebpush not installed")
        return 0

    subs = (
        await db.execute(select(PushSubscription).where(PushSubscription.user_id == user_id))
    ).scalars().all()
    if not subs:
        return 0

    payload = json.dumps({"title": title, "body": body, "url": url, "tag": tag})
    delivered = 0
    expired_endpoints: list[str] = []

    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=payload,
                vapid_private_key=settings.vapid_private_key,
                vapid_claims={"sub": settings.vapid_subject or "mailto:admin@xerocode.ru"},
            )
            delivered += 1
        except WebPushException as e:  # type: ignore
            status = getattr(e.response, "status_code", None) if e.response else None
            if status in (404, 410):
                # Subscription expired/invalid — clean up
                expired_endpoints.append(sub.endpoint)
                logger.info(f"[Push] Removing expired endpoint {sub.endpoint[:60]}")
            else:
                logger.warning(f"[Push] Failed: {e}")
        except Exception as e:
            logger.error(f"[Push] Unexpected: {e}")

    if expired_endpoints:
        await db.execute(delete(PushSubscription).where(PushSubscription.endpoint.in_(expired_endpoints)))
        await db.commit()

    return delivered
