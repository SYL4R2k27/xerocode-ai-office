"""Company model — separate from Contact (CRM v3)."""
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from app.core.database import Base
from app.core.db_types import GUID, JSONB

class Company(Base):
    __tablename__ = "crm_companies"
    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(300), nullable=False)
    industry = Column(String(100))
    inn = Column(String(12))
    kpp = Column(String(9))
    address = Column(Text)
    phone = Column(String(50))
    email = Column(String(200))
    website = Column(String(300))
    employee_count = Column(Integer)
    revenue_annual = Column(String(50))
    notes = Column(Text)
    tags = Column(JSONB, default=list)
    source = Column(String(30))
    created_by = Column(GUID(), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
