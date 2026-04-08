"""Channels — group messaging for organizations."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.channel import Channel, ChannelMessage

router = APIRouter(prefix="/channels", tags=["channels"])


@router.get("/")
async def list_channels(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        return []
    result = await db.execute(
        select(Channel).where(Channel.organization_id == org_id).order_by(Channel.created_at)
    )
    channels = result.scalars().all()
    return [
        {
            "id": str(c.id), "name": c.name, "description": c.description,
            "channel_type": c.channel_type, "is_private": c.is_private,
            "members_count": len(c.members or []),
        }
        for c in channels
    ]


@router.post("/", status_code=201)
async def create_channel(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    channel = Channel(
        organization_id=org_id,
        name=data.get("name", "General"),
        description=data.get("description"),
        channel_type=data.get("channel_type", "general"),
        is_private=data.get("is_private", False),
        members=[str(user.id)],
        created_by=user.id,
    )
    db.add(channel)
    await db.commit()
    return {"id": str(channel.id), "name": channel.name}


@router.get("/{channel_id}/messages")
async def get_messages(channel_id: str, limit: int = 50, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ChannelMessage)
        .where(ChannelMessage.channel_id == channel_id)
        .order_by(desc(ChannelMessage.created_at))
        .limit(limit)
    )
    messages = result.scalars().all()
    return [
        {
            "id": str(m.id), "user_id": str(m.user_id), "content": m.content,
            "message_type": m.message_type, "created_at": str(m.created_at),
        }
        for m in reversed(messages)
    ]


@router.post("/{channel_id}/messages", status_code=201)
async def send_message(channel_id: str, data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    content = data.get("content", "").strip()
    if not content:
        raise HTTPException(400, "Content required")
    msg = ChannelMessage(
        channel_id=channel_id,
        user_id=user.id,
        content=content,
        message_type=data.get("message_type", "text"),
    )
    db.add(msg)
    await db.commit()
    return {"id": str(msg.id), "content": msg.content}
