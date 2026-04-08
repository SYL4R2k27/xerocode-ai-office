"""Calendar API — events, meetings, deadlines."""
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.calendar import CalendarEvent

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events")
async def list_events(
    start: str = None, end: str = None,
    user=Depends(get_current_user), db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    if not org_id:
        return []
    q = select(CalendarEvent).where(CalendarEvent.organization_id == org_id).order_by(CalendarEvent.start_at)
    if start:
        q = q.where(CalendarEvent.start_at >= start)
    if end:
        q = q.where(CalendarEvent.end_at <= end)
    result = await db.execute(q.limit(200))
    return [
        {
            "id": str(e.id), "title": e.title, "description": e.description,
            "start_at": str(e.start_at), "end_at": str(e.end_at),
            "all_day": e.all_day, "event_type": e.event_type,
            "attendees": e.attendees or [], "location": e.location, "color": e.color,
        }
        for e in result.scalars().all()
    ]


@router.post("/events", status_code=201)
async def create_event(data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")
    event = CalendarEvent(
        organization_id=org_id,
        user_id=user.id,
        title=data.get("title", "Event"),
        description=data.get("description"),
        start_at=data.get("start_at"),
        end_at=data.get("end_at"),
        all_day=data.get("all_day", False),
        event_type=data.get("event_type", "meeting"),
        attendees=data.get("attendees", []),
        location=data.get("location"),
        color=data.get("color"),
        linked_task_id=data.get("linked_task_id"),
        linked_deal_id=data.get("linked_deal_id"),
    )
    db.add(event)
    await db.commit()
    return {"id": str(event.id), "title": event.title}


@router.patch("/events/{event_id}")
async def update_event(event_id: str, data: dict, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    for key in ["title", "description", "start_at", "end_at", "all_day", "event_type", "attendees", "location", "color"]:
        if key in data:
            setattr(event, key, data[key])
    await db.commit()
    return {"detail": "Event updated"}


@router.delete("/events/{event_id}")
async def delete_event(event_id: str, user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    await db.delete(event)
    await db.commit()
    return {"detail": "Event deleted"}
