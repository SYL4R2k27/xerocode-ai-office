"""
Task Parser — разбирает ответ AI-модели и создает Task объекты.

Когда менеджер или планировщик отвечает структурированно:
  TASK: Написать контент
  ASSIGNED TO: Аналитик
  TYPE: research
  DEPENDS ON: NONE
  DESCRIPTION: Исследовать конкурентов

Парсер превращает это в реальные Task записи в БД.
"""
from __future__ import annotations

import re
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.task import Task


class TaskParser:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def parse_and_create_tasks(
        self,
        text: str,
        goal_id: uuid.UUID,
        agents: list[Agent],
    ) -> list[Task]:
        """
        Парсит текстовый ответ модели → создает Task объекты.
        Поддерживает разные форматы ответов (модели не всегда отвечают идеально).
        """
        blocks = self._extract_task_blocks(text)

        if not blocks:
            # Fallback: попробуем разбить по нумерованным спискам
            blocks = self._extract_numbered_tasks(text)

        if not blocks:
            return []

        agent_map = {a.name.lower(): a for a in agents}
        created_tasks = []
        title_to_id: dict[str, str] = {}  # для зависимостей

        for block in blocks:
            title = block.get("title", "Untitled task")
            task_type = self._normalize_type(block.get("type", "general"))
            description = block.get("description", "")
            assigned_name = block.get("assigned_to", "").lower().strip()
            depends_on_title = block.get("depends_on", "").strip()

            # Match agent by name (fuzzy)
            assigned_agent = self._find_agent(assigned_name, agent_map)

            # Resolve dependencies
            depends_on = []
            if depends_on_title and depends_on_title.lower() not in ("none", "нет", "-", ""):
                for dep_title in re.split(r"[,;]", depends_on_title):
                    dep_title = dep_title.strip()
                    if dep_title.lower() in title_to_id:
                        depends_on.append(title_to_id[dep_title.lower()])

            task = Task(
                goal_id=goal_id,
                title=title[:500],
                description=description[:2000] if description else None,
                task_type=task_type,
                status="assigned" if assigned_agent else "pending",
                assigned_agent_id=assigned_agent.id if assigned_agent else None,
                depends_on=depends_on if depends_on else None,
            )
            self.db.add(task)
            await self.db.flush()

            title_to_id[title.lower()] = str(task.id)
            created_tasks.append(task)

        await self.db.commit()
        return created_tasks

    def _extract_task_blocks(self, text: str) -> list[dict]:
        """
        Извлечь блоки формата:
        TASK: ...
        ASSIGNED TO: ...
        TYPE: ...
        DEPENDS ON: ...
        DESCRIPTION: ...
        """
        blocks = []
        current = {}

        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue

            # Match key: value patterns
            match = re.match(
                r"^(?:\d+\.\s*)?(?:\*{0,2})(TASK|ASSIGNED\s*TO|TYPE|DEPENDS\s*ON|DESCRIPTION|ЗАДАЧА|НАЗНАЧИТЬ|ТИП|ЗАВИСИТ\s*ОТ|ОПИСАНИЕ)\s*(?:\*{0,2})\s*[:：]\s*(.*)",
                line,
                re.IGNORECASE,
            )

            if match:
                key = match.group(1).upper().strip()
                value = match.group(2).strip().strip("*")

                # Normalize keys
                key_map = {
                    "TASK": "title",
                    "ЗАДАЧА": "title",
                    "ASSIGNED TO": "assigned_to",
                    "ASSIGNEDTO": "assigned_to",
                    "НАЗНАЧИТЬ": "assigned_to",
                    "TYPE": "type",
                    "ТИП": "type",
                    "DEPENDS ON": "depends_on",
                    "DEPENDSON": "depends_on",
                    "ЗАВИСИТ ОТ": "depends_on",
                    "DESCRIPTION": "description",
                    "ОПИСАНИЕ": "description",
                }

                normalized = key_map.get(key.replace(" ", ""), key.lower().replace(" ", "_"))

                # New task block starts with "title"
                if normalized == "title" and current.get("title"):
                    blocks.append(current)
                    current = {}

                current[normalized] = value

        if current.get("title"):
            blocks.append(current)

        return blocks

    def _extract_numbered_tasks(self, text: str) -> list[dict]:
        """
        Fallback: парсит нумерованные списки.
        1. Исследовать конкурентов
        2. Написать контент
        """
        blocks = []
        lines = text.split("\n")

        for line in lines:
            line = line.strip()
            match = re.match(r"^(\d+)[.)]\s+(.+)", line)
            if match:
                title = match.group(2).strip().rstrip(".")
                # Remove markdown bold
                title = re.sub(r"\*{1,2}(.+?)\*{1,2}", r"\1", title)
                if len(title) > 5:  # skip trivially short
                    blocks.append({"title": title, "type": "general"})

        return blocks

    def _normalize_type(self, raw_type: str) -> str:
        """Нормализовать тип задачи."""
        raw = raw_type.lower().strip()
        valid_types = {"research", "code", "design", "analysis", "general"}

        # Direct match
        if raw in valid_types:
            return raw

        # Fuzzy mapping
        type_map = {
            "исследование": "research",
            "разработка": "code",
            "программирование": "code",
            "coding": "code",
            "development": "code",
            "дизайн": "design",
            "ui": "design",
            "ux": "design",
            "анализ": "analysis",
            "review": "analysis",
            "writing": "general",
            "текст": "general",
            "content": "general",
        }

        return type_map.get(raw, "general")

    def _find_agent(self, name: str, agent_map: dict[str, Agent]) -> Optional[Agent]:
        """Найти агента по имени (нечеткий поиск)."""
        if not name:
            return None

        # Exact match
        if name in agent_map:
            return agent_map[name]

        # Partial match
        for agent_name, agent in agent_map.items():
            if name in agent_name or agent_name in name:
                return agent

        # Match by role
        for agent in agent_map.values():
            if name in agent.role.lower():
                return agent

        return None
