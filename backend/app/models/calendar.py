"""Calendar events for corporate scheduling."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, default=False)
    event_type = Column(String(20), default="meeting")  # meeting, deadline, reminder, vacation
    attendees = Column(JSONB, default=list)  # [{user_id, name, status: accepted/declined/pending}]
    location = Column(String(300))
    recurrence_rule = Column(String(200))  # iCal RRULE format
    google_event_id = Column(String(200))
    linked_task_id = Column(GUID(), nullable=True)
    linked_deal_id = Column(GUID(), nullable=True)
    color = Column(String(20))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
