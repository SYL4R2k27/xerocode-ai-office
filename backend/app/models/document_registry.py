"""Document registry, templates, and approval workflow models."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class DocumentRecord(Base):
    __tablename__ = "document_records"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    doc_number = Column(String(30), nullable=False)  # e.g. OUT-2026-0001
    doc_type = Column(String(20), nullable=False)  # incoming, outgoing, internal
    category = Column(String(30), default="other")  # contract, invoice, act, proposal, report, other
    title = Column(String(500), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="draft")  # draft, approval, signed, archive, rejected
    file_path = Column(Text)
    file_size = Column(Integer, default=0)
    template_id = Column(GUID(), ForeignKey("document_templates.id"), nullable=True)
    deal_id = Column(GUID(), nullable=True)  # link to CRM deal
    created_by = Column(GUID(), nullable=False)
    assignee_id = Column(GUID(), nullable=True)
    signed_by = Column(JSONB)  # [{user_id, name, signed_at}]
    signed_at = Column(DateTime)
    current_approval_step = Column(Integer, default=0)
    approval_route_id = Column(GUID(), ForeignKey("approval_routes.id"), nullable=True)
    version = Column(Integer, default=1)
    parent_id = Column(GUID(), nullable=True)  # for version chain
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(30), default="other")
    description = Column(Text)
    content_template = Column(Text)  # Jinja2 or structured content
    fields = Column(JSONB, default=list)  # [{name, label, type, required, default}]
    created_by = Column(GUID(), nullable=False)
    created_at = Column(DateTime, default=func.now())


class ApprovalRoute(Base):
    __tablename__ = "approval_routes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    steps = Column(JSONB, default=list)  # [{role, action, label}]
    created_by = Column(GUID(), nullable=False)
    created_at = Column(DateTime, default=func.now())


class ApprovalStep(Base):
    __tablename__ = "approval_steps"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    document_id = Column(GUID(), ForeignKey("document_records.id", ondelete="CASCADE"), nullable=False, index=True)
    route_id = Column(GUID(), ForeignKey("approval_routes.id"), nullable=True)
    step_index = Column(Integer, default=0)
    approver_id = Column(GUID(), ForeignKey("users.id"), nullable=True)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    comment = Column(Text)
    decided_at = Column(DateTime)
