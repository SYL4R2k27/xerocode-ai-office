"""Training log — датасет для XeroCode AI Phase 2 (fine-tune + distillation).

Каждый запрос через /api/modes/run логируется сюда:
  - user_query, mode, chosen_models, final_response
  - total_tokens, total_cost, duration_sec
  - user_rating (👍/👎) — заполняется позже через /api/training/rate

Анонимизация: user_id → hash (SHA-256 первые 16 символов).
Периодически экспортируется в JSONL для тренировки.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class TrainingLog(Base):
    __tablename__ = "training_logs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_hash: Mapped[str] = mapped_column(String(16), index=True, nullable=False)  # hash, не raw id
    mode: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    user_query: Mapped[str] = mapped_column(Text, nullable=False)
    final_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # DAG метаданные
    dag_nodes: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)  # [{id, model, tokens, duration}]
    chosen_models: Mapped[Optional[list]] = mapped_column(JSONB(), nullable=True)  # ["anthropic/claude-...", ...]
    router_decision: Mapped[Optional[dict]] = mapped_column(JSONB(), nullable=True)  # {domain, tier} для xerocode_ai
    # Метрики
    total_tokens: Mapped[int] = mapped_column(Integer, default=0)
    total_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    duration_sec: Mapped[float] = mapped_column(Float, default=0.0)
    success: Mapped[bool] = mapped_column(default=True)
    # Юзерский фидбек — заполняется позже через отдельный endpoint
    user_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # +1 / -1 / NULL
    rating_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Таймстампы
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    rated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
