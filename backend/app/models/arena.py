from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class ArenaBattle(Base):
    __tablename__ = "arena_battles"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    mode: Mapped[str] = mapped_column(String(20), nullable=False)  # duel, evolution, tournament, blind
    prompt: Mapped[str] = mapped_column(Text, nullable=False)

    model_a: Mapped[str] = mapped_column(String(100), nullable=False)
    model_b: Mapped[str] = mapped_column(String(100), nullable=False)

    response_a: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    response_b: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # For evolution mode: store rounds as JSON array
    evolution_rounds: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)

    # For tournament mode: bracket data
    tournament_data: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, running, completed, voted
    winner: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # model_a, model_b, draw

    # Timing
    time_a_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_b_ms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class ArenaLeaderboard(Base):
    __tablename__ = "arena_leaderboard"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    wins: Mapped[int] = mapped_column(Integer, default=0)
    losses: Mapped[int] = mapped_column(Integer, default=0)
    draws: Mapped[int] = mapped_column(Integer, default=0)
    elo_rating: Mapped[float] = mapped_column(Float, default=1500.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
