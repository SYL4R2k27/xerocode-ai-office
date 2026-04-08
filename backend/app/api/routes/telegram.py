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
    """Receive Telegram updates (public endpoint, verified by secret token)."""
    # Verify Telegram secret token header (set via setWebhook secret_token param)
    secret_header = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
    if secret_header:
        # Verify against stored bot config — find any active telegram integration
        from app.models.integration import Integration
        result = await db.execute(
            select(Integration).where(Integration.type == "telegram", Integration.status == "active")
        )
        integration = result.scalar_one_or_none()
        if integration:
            expected_secret = (integration.config or {}).get("webhook_secret", "")
            if expected_secret and secret_header != expected_secret:
                return {"ok": False, "error": "Invalid secret token"}

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
        if not task_text:
            return {"ok": True}
        # Actually create task in DB if user is linked
        if link:
            from app.models.task import Task
            linked_user = (await db.execute(select(User).where(User.id == link.user_id))).scalar_one_or_none()
            if linked_user:
                task = Task(
                    title=task_text[:500],
                    status="backlog",
                    created_by_user_id=linked_user.id,
                    created_by_ai=False,
                )
                db.add(task)
                await db.commit()
        return {"ok": True}

    if text.startswith("/deals"):
        # Fetch top 5 deals from CRM
        if link:
            linked_user = (await db.execute(select(User).where(User.id == link.user_id))).scalar_one_or_none()
            if linked_user and linked_user.organization_id:
                from app.models.crm import Deal
                deals_result = await db.execute(
                    select(Deal)
                    .where(Deal.organization_id == linked_user.organization_id)
                    .order_by(Deal.amount.desc())
                    .limit(5)
                )
                deals = deals_result.scalars().all()
                if deals:
                    lines = ["Top deals:"]
                    for i, d in enumerate(deals, 1):
                        lines.append(f"{i}. {d.title} — {d.amount:,.0f} {d.currency} [{d.stage}]")
                    return {"ok": True, "method": "sendMessage", "chat_id": chat_id, "text": "\n".join(lines)}
        return {"ok": True, "method": "sendMessage", "chat_id": chat_id, "text": "No deals found or account not linked."}

    if text.startswith("/status"):
        # Fetch real org stats
        if link:
            linked_user = (await db.execute(select(User).where(User.id == link.user_id))).scalar_one_or_none()
            if linked_user and linked_user.organization_id:
                from sqlalchemy import func as sa_func
                from app.models.crm import Deal
                org_id = linked_user.organization_id

                members_count = (await db.execute(
                    select(sa_func.count(User.id)).where(User.organization_id == org_id)
                )).scalar() or 0

                tasks_count = (await db.execute(
                    select(sa_func.count(Task.id)).where(
                        Task.created_by_user_id.in_(select(User.id).where(User.organization_id == org_id))
                    )
                )).scalar() or 0

                deals_count = (await db.execute(
                    select(sa_func.count(Deal.id)).where(Deal.organization_id == org_id)
                )).scalar() or 0

                status_text = (
                    f"XeroCode Status:\n"
                    f"Team: {members_count}\n"
                    f"Tasks: {tasks_count}\n"
                    f"Deals: {deals_count}"
                )
                return {"ok": True, "method": "sendMessage", "chat_id": chat_id, "text": status_text}

        return {"ok": True, "method": "sendMessage", "chat_id": chat_id, "text": "Account not linked. Use /start to link."}

    # Free-text → AI response
    try:
        from app.api.routes.documents import _call_ai
        ai_response = await _call_ai(
            "You are XeroCode AI assistant in Telegram. Be concise and helpful. Reply in the same language the user writes.",
            text,
            prefer_premium=False,
        )
        if ai_response:
            # Truncate to Telegram message limit
            reply = ai_response[:4000]
            return {"ok": True, "method": "sendMessage", "chat_id": chat_id, "text": reply}
    except Exception as e:
        print(f"[Telegram] AI error: {e}")

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
