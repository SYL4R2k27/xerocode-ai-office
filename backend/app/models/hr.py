"""HR models — employees, time off, onboarding."""
from __future__ import annotations

import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class Employee(Base):
    __tablename__ = "employees"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, unique=True)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    department = Column(String(100))
    position = Column(String(200))
    hire_date = Column(Date)
    contract_type = Column(String(30), default="full_time")  # full_time, part_time, contractor
    emergency_contact = Column(JSONB)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())


class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    employee_id = Column(GUID(), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # vacation, sick, personal, maternity
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    approved_by = Column(GUID(), nullable=True)
    comment = Column(Text)
    created_at = Column(DateTime, default=func.now())


class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    employee_id = Column(GUID(), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    items = Column(JSONB, default=list)  # [{title, description, completed}]
    status = Column(String(20), default="in_progress")  # in_progress, completed
    created_at = Column(DateTime, default=func.now())
