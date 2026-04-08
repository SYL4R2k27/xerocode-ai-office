"""Research session models for Deep Research feature."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class ResearchSession(Base):
    __tablename__ = "research_sessions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=False, index=True)
    query = Column(Text, nullable=False)
    params = Column(JSONB, default=dict)  # depth, sources_count, language, etc.
    status = Column(String(20), default="pending")  # pending, searching, analyzing, council, generating, completed, failed
    progress = Column(Float, default=0.0)  # 0.0 - 1.0
    progress_message = Column(String(200), default="")

    # Results
    result_summary = Column(Text)
    result_sections = Column(JSONB)  # [{title, content, sources: [idx]}]
    sources = Column(JSONB)  # [{url, title, snippet, relevance}]
    sparkpage_html = Column(Text)
    model_council_votes = Column(JSONB)  # [{model, score, reasoning}]

    # Metadata
    iterations_count = Column(Float, default=0)
    total_tokens = Column(Float, default=0)
    total_cost_usd = Column(Float, default=0)

    created_at = Column(DateTime, default=func.now())
    completed_at = Column(DateTime)

    sources_rel = relationship("ResearchSource", back_populates="session", cascade="all, delete-orphan")


class ResearchSource(Base):
    __tablename__ = "research_sources"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    session_id = Column(GUID(), ForeignKey("research_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    url = Column(Text)
    title = Column(Text)
    snippet = Column(Text)
    relevance_score = Column(Float, default=0.0)
    cited_in_sections = Column(JSONB)  # [section_index, ...]

    session = relationship("ResearchSession", back_populates="sources_rel")
