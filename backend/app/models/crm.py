from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Contact(Base):
    __tablename__ = "crm_contacts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    position: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # website, phone, email, referral, social, ad
    created_by: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Deal(Base):
    __tablename__ = "crm_deals"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="RUB")
    stage: Mapped[str] = mapped_column(String(30), default="lead")
    # lead → qualification → proposal → negotiation → decision → won → lost → post_sale

    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    assignee_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Extended fields
    source: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # website, phone, email, referral
    priority: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="medium")  # low, medium, high, critical
    qualification_score: Mapped[int] = mapped_column(Integer, default=0)  # 0-100
    next_action: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_action_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    lost_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    won_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expected_close: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    linked_task_ids: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)
    linked_doc_ids: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)

    tags: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    activities = relationship("DealActivity", back_populates="deal", cascade="all, delete-orphan", order_by="DealActivity.created_at.desc()")


class DealActivity(Base):
    """Timeline of deal activities — calls, emails, meetings, notes, stage changes."""
    __tablename__ = "crm_deal_activities"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    deal_id: Mapped[uuid.UUID] = mapped_column(GUID(), ForeignKey("crm_deals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    activity_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # call, email, meeting, note, stage_change, task_linked, doc_linked, comment
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB(), nullable=True)
    # For stage_change: {from_stage, to_stage}
    # For call: {duration_min, outcome}
    # For email: {subject, direction: in/out}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    deal = relationship("Deal", back_populates="activities")
