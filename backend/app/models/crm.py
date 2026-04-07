from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Contact(Base):
    __tablename__ = "crm_contacts"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    company: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    position: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Deal(Base):
    __tablename__ = "crm_deals"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="RUB")
    stage: Mapped[str] = mapped_column(String(30), default="new")  # new/contact/proposal/negotiation/won/lost
    contact_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    assignee_id: Mapped[Optional[uuid.UUID]] = mapped_column(GUID(), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_close: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tags: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
