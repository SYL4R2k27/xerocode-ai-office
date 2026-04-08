"""Telegram Bot integration — webhook mode."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.integration import Integration, TelegramLink
from app.models.user import User

router = APIRouter(prefix="/integrations/telegram", tags=["telegram"])


@router.post("/setup")
async def setup_telegram(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Configure Telegram bot for organization."""
    bot_token = data.get("bot_token", "").strip()
    if not bot_token:
        raise HTTPException(status_code=400, detail="Bot token is required")

    org_id = user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Not in an organization")

    # Upsert integration
    result = await db.execute(
        select(Integration).where(Integration.organization_id == org_id, Integration.type == "telegram")
    )
    integration = result.scalar_one_or_none()
    if integration:
        integration.config = {"bot_token": bot_token}
        integration.status = "active"
    else:
        integration = Integration(
            organization_id=org_id,
            type="telegram",
            config={"bot_token": bot_token},
            status="active",
            created_by=user.id,
        )
        db.add(integration)

    await db.commit()
    return {"detail": "Telegram bot configured", "status": "active"}


@router.get("/status")
async def telegram_status(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Telegram integration status."""
    org_id = user.organization_id
    if not org_id:
        return {"status": "not_configured"}

    result = await db.execute(
        select(Integration).where(Integration.organization_id == org_id, Integration.type == "telegram")
    )
    integration = result.scalar_one_or_none()
    if not integration:
        return {"status": "not_configured"}

    # Count linked users
    links_count = (
        await db.execute(
            select(TelegramLink).join(User).where(User.organization_id == org_id)
        )
    ).scalars().all()

    return {
        "status": integration.status,
        "linked_users": len(links_count),
    }


@router.post("/webhook")
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive Telegram updates (public endpoint, no auth)."""
    try:
        data = await request.json()
    except Exception:
        return {"ok": True}

    # Parse Telegram update
    message = data.get("message", {})
    text = message.get("text", "")
    chat_id = message.get("chat", {}).get("id")
    tg_user_id = message.get("from", {}).get("id")
    tg_username = message.get("from", {}).get("username", "")

    if not chat_id or not text:
        return {"ok": True}

    # Find linked user
    result = await db.execute(
        select(TelegramLink).where(TelegramLink.telegram_user_id == tg_user_id)
    )
    link = result.scalar_one_or_none()

    if text.startswith("/start"):
        # Link account flow
        return {"ok": True, "method": "sendMessage", "chat_id": chat_id, "text": "Привет! Я XeroCode Bot. Используйте /task для создания задач, /status для статуса."}

    if text.startswith("/task"):
        task_text = text.replace("/task", "").strip()
        reply = f"Задача создана: {task_text}" if task_text else "Формат: /task описание задачи"
        return {"ok": True}

    if text.startswith("/status"):
        return {"ok": True}

    # Free-text → AI (TODO: implement in next iteration)
    return {"ok": True}


@router.delete("/remove")
async def remove_telegram(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove Telegram integration."""
    org_id = user.organization_id
    result = await db.execute(
        select(Integration).where(Integration.organization_id == org_id, Integration.type == "telegram")
    )
    integration = result.scalar_one_or_none()
    if integration:
        await db.delete(integration)
        await db.commit()
    return {"detail": "Telegram integration removed"}
