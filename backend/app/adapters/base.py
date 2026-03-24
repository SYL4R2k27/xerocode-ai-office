from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import httpx


@dataclass
class ToolCall:
    """Вызов инструмента от модели."""

    id: str
    name: str
    arguments: dict


@dataclass
class AIResponse:
    """Стандартный ответ от любой модели."""

    content: str
    tokens_input: int = 0
    tokens_output: int = 0
    cost_usd: float = 0.0
    model: str = ""
    raw: dict | None = None
    tool_calls: list[ToolCall] | None = None
    stop_reason: str = "end_turn"  # "end_turn" | "tool_use"


class BaseAdapter(ABC):
    """
    Единый интерфейс для всех AI-провайдеров.
    Каждый адаптер (OpenAI, Anthropic, Ollama, Custom) реализует этот интерфейс.
    """

    def __init__(self, api_key: str | None = None, base_url: str | None = None):
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    async def call(
        self,
        messages: list[dict],
        model: str,
        system_prompt: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        tools: list[dict] | None = None,
    ) -> AIResponse:
        """
        Отправить промпт модели и получить ответ.

        messages: [{"role": "user"|"assistant"|"system", "content": "..."}]
        tools: OpenAI function-calling format (optional)
        """
        ...

    def _get_client(self, timeout: float = 120.0) -> httpx.AsyncClient:
        """Создать HTTP клиент с прокси (если настроен)."""
        from app.core.config import settings
        kwargs: dict = {"timeout": timeout}
        if settings.api_proxy:
            kwargs["proxy"] = settings.api_proxy
        return httpx.AsyncClient(**kwargs)

    @abstractmethod
    async def test_connection(self, model: str) -> bool:
        """Проверить что подключение работает."""
        ...
