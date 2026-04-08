"""Slack Bot integration — OAuth, Events API, Slash Commands."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.integration import Integration
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/integrations/slack", tags=["slack"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SlackSetupRequest(BaseModel):
    bot_token: str = Field(..., min_length=10)
    webhook_url: str = Field(default="")
    channel_id: str = Field(default="")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_slack_integration(db: AsyncSession, org_id) -> Integration | None:
    result = await db.execute(
        select(Integration).where(
            Integration.organization_id == org_id,
            Integration.type == "slack",
        )
    )
    return result.scalar_one_or_none()


async def _get_org_stats(db: AsyncSession, org_id) -> dict:
    """Get basic org statistics for status commands."""
    from app.models.crm import Deal

    # Members count
    members = await db.execute(
        select(func.count(User.id)).where(User.organization_id == org_id)
    )
    members_count = members.scalar() or 0

    # Tasks count
    tasks = await db.execute(
        select(func.count(Task.id)).where(Task.created_by_user_id.in_(
            select(User.id).where(User.organization_id == org_id)
        ))
    )
    tasks_count = tasks.scalar() or 0

    # Active tasks
    active_tasks = await db.execute(
        select(func.count(Task.id)).where(
            Task.status.in_(["in_progress", "review_operator", "review_manager"]),
            Task.created_by_user_id.in_(
                select(User.id).where(User.organization_id == org_id)
            ),
        )
    )
    active_count = active_tasks.scalar() or 0

    # Deals count
    deals = await db.execute(
        select(func.count(Deal.id)).where(Deal.organization_id == org_id)
    )
    deals_count = deals.scalar() or 0

    return {
        "members": members_count,
        "total_tasks": tasks_count,
        "active_tasks": active_count,
        "deals": deals_count,
    }


async def _get_top_deals(db: AsyncSession, org_id, limit: int = 5) -> list[dict]:
    """Get top deals by amount."""
    from app.models.crm import Deal

    result = await db.execute(
        select(Deal)
        .where(Deal.organization_id == org_id)
        .order_by(Deal.amount.desc())
        .limit(limit)
    )
    deals = result.scalars().all()
    return [
        {"title": d.title, "amount": d.amount, "currency": d.currency, "stage": d.stage}
        for d in deals
    ]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/setup")
async def setup_slack(
    body: SlackSetupRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Configure Slack integration for organization."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(status_code=400, detail="Not in an organization")

    integration = await _get_slack_integration(db, org_id)
    config = {
        "bot_token": body.bot_token,
        "webhook_url": body.webhook_url,
        "channel_id": body.channel_id,
    }

    if integration:
        integration.config = config
        integration.status = "active"
    else:
        integration = Integration(
            organization_id=org_id,
            type="slack",
            config=config,
            status="active",
            created_by=user.id,
        )
        db.add(integration)

    await db.commit()
    return {"detail": "Slack integration configured", "status": "active"}


@router.post("/events")
async def slack_events(request: Request, db: AsyncSession = Depends(get_db)):
    """Slack Events API webhook (public endpoint)."""
    try:
        data = await request.json()
    except Exception:
        return {"ok": False}

    # URL verification challenge
    if data.get("type") == "url_verification":
        return {"challenge": data.get("challenge", "")}

    # Event handling
    event = data.get("event", {})
    event_type = event.get("type", "")

    if event_type == "message" and not event.get("bot_id"):
        # Human message — log it for now
        text = event.get("text", "")
        user_id = event.get("user", "")
        channel = event.get("channel", "")
        print(f"[Slack] Message from {user_id} in {channel}: {text[:100]}")

        # Future: forward to AI, respond in thread, etc.

    return {"ok": True}


@router.post("/slash")
async def slack_slash_command(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Slack slash commands: /xero-task, /xero-status, /xero-deals."""
    form = await request.form()
    command = form.get("command", "")
    text = form.get("text", "").strip()
    user_id = form.get("user_id", "")
    team_id = form.get("team_id", "")

    # Find integration by team
    result = await db.execute(
        select(Integration).where(
            Integration.type == "slack",
            Integration.status == "active",
        )
    )
    integration = result.scalars().first()
    org_id = integration.organization_id if integration else None

    if command == "/xero-task":
        if not text:
            return {"response_type": "ephemeral", "text": "Usage: /xero-task <task description>"}

        if org_id:
            # Find first admin user in org to attribute the task
            admin_result = await db.execute(
                select(User).where(User.organization_id == org_id).limit(1)
            )
            admin_user = admin_result.scalar_one_or_none()
            if admin_user:
                task = Task(
                    title=text[:500],
                    status="backlog",
                    created_by_user_id=admin_user.id,
                    created_by_ai=False,
                )
                db.add(task)
                await db.commit()

        return {"response_type": "in_channel", "text": f"Task created: {text[:200]}"}

    elif command == "/xero-status":
        if not org_id:
            return {"response_type": "ephemeral", "text": "Organization not linked."}

        stats = await _get_org_stats(db, org_id)
        return {
            "response_type": "ephemeral",
            "text": (
                f"*XeroCode Status*\n"
                f"Team members: {stats['members']}\n"
                f"Total tasks: {stats['total_tasks']}\n"
                f"Active tasks: {stats['active_tasks']}\n"
                f"CRM deals: {stats['deals']}"
            ),
        }

    elif command == "/xero-deals":
        if not org_id:
            return {"response_type": "ephemeral", "text": "Organization not linked."}

        deals = await _get_top_deals(db, org_id)
        if not deals:
            return {"response_type": "ephemeral", "text": "No deals found."}

        lines = ["*Top Deals:*"]
        for i, d in enumerate(deals, 1):
            lines.append(f"{i}. {d['title']} — {d['amount']:,.0f} {d['currency']} [{d['stage']}]")

        return {"response_type": "ephemeral", "text": "\n".join(lines)}

    return {"response_type": "ephemeral", "text": f"Unknown command: {command}"}


@router.get("/status")
async def slack_status(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Slack integration status."""
    org_id = user.organization_id
    if not org_id:
        return {"status": "not_configured"}

    integration = await _get_slack_integration(db, org_id)
    if not integration:
        return {"status": "not_configured"}

    return {
        "status": integration.status,
        "has_webhook": bool((integration.config or {}).get("webhook_url")),
    }


@router.delete("/remove")
async def remove_slack(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove Slack integration."""
    org_id = user.organization_id
    integration = await _get_slack_integration(db, org_id)
    if integration:
        await db.delete(integration)
        await db.commit()
    return {"detail": "Slack integration removed"}
