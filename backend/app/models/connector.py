"""Connector models — persistent integration configs + sync logs."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class ConnectorConfig(Base):
    """Configuration for an external system connector (Bitrix24, 1C, etc.)."""
    __tablename__ = "connector_configs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    connector_type = Column(String(30), nullable=False)  # bitrix24, 1c, google, slack
    name = Column(String(200), default="")  # user-friendly name
    status = Column(String(20), default="disconnected")  # disconnected, connected, syncing, error
    auth_config = Column(JSONB, default=dict)  # {webhook_url, oauth_token, base_url, username, password} — encrypted
    sync_config = Column(JSONB, default=dict)  # {entities: ["deals", "contacts", "tasks"], interval_minutes: 5, direction: "both"}
    field_mapping = Column(JSONB, default=dict)  # {deals: {bitrix_field: xerocode_field, ...}, contacts: {...}}
    last_sync_at = Column(DateTime)
    last_sync_status = Column(String(20))  # success, partial, failed
    last_sync_stats = Column(JSONB)  # {imported: 142, updated: 5, errors: 2}
    sync_enabled = Column(Boolean, default=False)  # auto-sync on/off
    created_by = Column(GUID(), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class SyncLog(Base):
    """Log entry for each sync operation."""
    __tablename__ = "sync_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    connector_id = Column(GUID(), ForeignKey("connector_configs.id", ondelete="CASCADE"), nullable=False, index=True)
    sync_type = Column(String(20), default="full")  # full, incremental, entity
    entity = Column(String(30))  # deals, contacts, tasks, users, documents
    direction = Column(String(10), default="import")  # import, export, both
    status = Column(String(20), default="running")  # running, success, partial, failed
    items_total = Column(Integer, default=0)
    items_imported = Column(Integer, default=0)
    items_updated = Column(Integer, default=0)
    items_skipped = Column(Integer, default=0)
    items_failed = Column(Integer, default=0)
    errors = Column(JSONB, default=list)  # [{entity_id, error_message}]
    started_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)
