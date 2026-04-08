"""Integration models — Telegram, Slack, Google, etc."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), nullable=False)  # telegram, slack, google_drive, gmail
    config = Column(JSONB, default=dict)  # encrypted config (bot_token, webhook_url, etc.)
    status = Column(String(20), default="inactive")  # inactive, active, error
    created_by = Column(GUID(), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class TelegramLink(Base):
    __tablename__ = "telegram_links"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    telegram_user_id = Column(BigInteger, nullable=False, unique=True)
    telegram_username = Column(String(100))
    linked_at = Column(DateTime, default=func.now())
