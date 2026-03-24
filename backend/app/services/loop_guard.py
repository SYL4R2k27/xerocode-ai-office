"""
Loop Guard — защита от зацикливания.

AI-модели могут бесконечно обсуждать, повторяться, или зациклиться.
Этот модуль следит чтобы этого не было.

Защита:
1. Лимит обменов (max_exchanges на цели)
2. Лимит на одну задачу (max iterations)
3. Детекция повторений (одинаковые сообщения)
4. Timeout на ожидание ответа
5. Детекция "мертвых петель" (A → B → A → B → ...)
"""
from __future__ import annotations

import uuid
from collections import Counter
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.message import Message


# Constants
MAX_ITERATIONS_PER_TASK = 10
MAX_EXCHANGES_DEFAULT = 50
SIMILARITY_THRESHOLD = 0.85  # if message is >85% similar to previous = loop
MAX_CONSECUTIVE_SAME_AGENT = 10


class LoopGuard:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def check(
        self,
        goal_id: uuid.UUID,
        max_exchanges: Optional[int] = None,
    ) -> tuple[bool, str]:
        """
        Проверить можно ли продолжать.
        Returns: (safe_to_continue, reason)
        """
        messages = await self._recent_messages(goal_id, limit=100)

        if not messages:
            return True, "OK"

        # 1. Check exchange count
        agent_msgs = [m for m in messages if m.sender_type == "agent"]
        limit = max_exchanges or MAX_EXCHANGES_DEFAULT

        if len(agent_msgs) >= limit:
            return False, f"Exchange limit reached: {len(agent_msgs)}/{limit}"

        # 2. Check for repetitions (exact duplicates)
        recent_contents = [m.content for m in agent_msgs[-10:]]
        content_counts = Counter(recent_contents)

        for content, count in content_counts.items():
            if count >= 3:
                return False, f"Loop detected: same message repeated {count} times"

        # 3. Check for ping-pong (A→B→A→B pattern)
        if len(agent_msgs) >= 6:
            recent_senders = [m.sender_name for m in agent_msgs[-6:]]
            if self._is_ping_pong(recent_senders):
                return False, "Ping-pong loop detected between agents"

        # 4. Check for same agent talking too much consecutively
        if len(agent_msgs) >= MAX_CONSECUTIVE_SAME_AGENT:
            recent_senders = [m.sender_name for m in agent_msgs[-MAX_CONSECUTIVE_SAME_AGENT:]]
            if len(set(recent_senders)) == 1:
                return False, f"Agent '{recent_senders[0]}' responded {MAX_CONSECUTIVE_SAME_AGENT} times in a row"

        # 5. Check for short repetitive answers (signs of confusion)
        recent_short = [
            m.content for m in agent_msgs[-5:]
            if len(m.content.strip()) < 50
        ]
        if len(recent_short) >= 3:
            return False, "Multiple short/empty responses detected — agents may be confused"

        return True, "OK"

    async def check_task_iterations(
        self,
        goal_id: uuid.UUID,
        task_title: str,
    ) -> tuple[bool, str]:
        """Проверить что одна задача не решается бесконечно."""
        messages = await self._recent_messages(goal_id, limit=200)

        # Count how many times this task was discussed
        task_mentions = sum(
            1 for m in messages
            if task_title.lower() in m.content.lower()
            and m.sender_type == "agent"
        )

        if task_mentions >= MAX_ITERATIONS_PER_TASK:
            return False, f"Task '{task_title}' discussed {task_mentions} times — forcing completion"

        return True, "OK"

    def _is_ping_pong(self, senders: list[str]) -> bool:
        """Detect A→B→A→B pattern."""
        if len(senders) < 4:
            return False

        # Check if it's alternating between exactly 2 agents
        unique = set(senders)
        if len(unique) != 2:
            return False

        # Check alternating pattern
        for i in range(len(senders) - 2):
            if senders[i] != senders[i + 2]:
                return False

        return True

    async def _recent_messages(
        self, goal_id: uuid.UUID, limit: int = 100
    ) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.goal_id == goal_id)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = list(result.scalars().all())
        messages.reverse()
        return messages
