"""
Cost Tracker — отслеживание стоимости в реальном времени.

Считает:
- Стоимость каждого сообщения
- Общую стоимость по цели
- Стоимость по агентам
- Проверяет лимиты
- Экономный режим
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.goal import Goal
from app.models.message import Message


@dataclass
class CostReport:
    """Отчет о стоимости для цели."""
    goal_id: str
    total_cost_usd: float
    total_tokens: int
    message_count: int
    exchange_count: int  # количество AI-обменов (не считая system/user)
    cost_by_agent: dict  # agent_name → cost
    limit_reached: bool
    remaining_exchanges: Optional[int]  # None = unlimited
    economy_mode: bool


class CostTracker:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_report(self, goal_id: uuid.UUID) -> CostReport:
        """Полный отчет по стоимости цели."""
        goal = await self._get_goal(goal_id)

        # Total cost and tokens
        cost_result = await self.db.execute(
            select(
                func.coalesce(func.sum(Message.cost_usd), 0.0),
                func.coalesce(func.sum(Message.tokens_used), 0),
                func.count(Message.id),
            ).where(Message.goal_id == goal_id)
        )
        row = cost_result.one()
        total_cost = float(row[0])
        total_tokens = int(row[1])
        message_count = int(row[2])

        # Exchange count (only AI responses)
        exchange_result = await self.db.execute(
            select(func.count(Message.id))
            .where(Message.goal_id == goal_id)
            .where(Message.sender_type == "agent")
        )
        exchange_count = int(exchange_result.scalar() or 0)

        # Cost by agent
        agent_cost_result = await self.db.execute(
            select(
                Message.sender_name,
                func.sum(Message.cost_usd),
            )
            .where(Message.goal_id == goal_id)
            .where(Message.sender_type == "agent")
            .group_by(Message.sender_name)
        )
        cost_by_agent = {
            name: round(float(cost), 6)
            for name, cost in agent_cost_result.all()
        }

        # Check limits
        remaining = None
        limit_reached = False
        if goal.max_exchanges is not None:
            remaining = max(0, goal.max_exchanges - exchange_count)
            limit_reached = remaining <= 0

        return CostReport(
            goal_id=str(goal_id),
            total_cost_usd=round(total_cost, 6),
            total_tokens=total_tokens,
            message_count=message_count,
            exchange_count=exchange_count,
            cost_by_agent=cost_by_agent,
            limit_reached=limit_reached,
            remaining_exchanges=remaining,
            economy_mode=goal.economy_mode,
        )

    async def check_can_continue(self, goal_id: uuid.UUID) -> tuple[bool, str]:
        """
        Проверить можно ли продолжать обмены.
        Returns: (can_continue, reason)
        """
        report = await self.get_report(goal_id)

        if report.limit_reached:
            return False, f"Exchange limit reached ({report.exchange_count} exchanges used)"

        return True, "OK"

    async def get_economy_params(self, goal_id: uuid.UUID) -> dict:
        """
        Параметры для экономного режима.
        Снижает temperature, max_tokens, ограничивает обсуждения.
        """
        goal = await self._get_goal(goal_id)

        if goal.economy_mode:
            return {
                "temperature": 0.3,       # less creative = less tokens
                "max_tokens": 1024,       # shorter responses
                "max_discussion_rounds": 2,  # less back-and-forth
                "skip_confirmations": True,  # don't ask "is this OK?"
            }

        return {
            "temperature": 0.7,
            "max_tokens": 4096,
            "max_discussion_rounds": 5,
            "skip_confirmations": False,
        }

    async def _get_goal(self, goal_id: uuid.UUID) -> Goal:
        result = await self.db.execute(select(Goal).where(Goal.id == goal_id))
        goal = result.scalar_one_or_none()
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")
        return goal
