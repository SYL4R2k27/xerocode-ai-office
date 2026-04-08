"""Group chat channels for corporate communication."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Channel(Base):
    __tablename__ = "channels"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    channel_type = Column(String(20), default="general")  # department, project, general
    is_private = Column(Boolean, default=False)
    members = Column(JSONB, default=list)  # [user_id, ...]
    created_by = Column(GUID(), nullable=False)
    created_at = Column(DateTime, default=func.now())


class ChannelMessage(Base):
    __tablename__ = "channel_messages"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    channel_id = Column(GUID(), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    message_type = Column(String(20), default="text")  # text, file, system
    reply_to_id = Column(GUID(), nullable=True)
    attachments = Column(JSONB, default=list)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
