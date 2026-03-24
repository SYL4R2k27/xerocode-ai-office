from __future__ import annotations

import logging

from app.adapters.anthropic_adapter import AnthropicAdapter
from app.adapters.base import AIResponse, BaseAdapter, ToolCall
from app.adapters.custom_adapter import CustomAdapter
from app.adapters.gemini_adapter import GeminiAdapter
from app.adapters.groq_adapter import GroqAdapter
from app.adapters.ollama_adapter import OllamaAdapter
from app.adapters.openai_adapter import OpenAIAdapter
from app.adapters.openrouter_adapter import OpenRouterAdapter
from app.adapters.stability_adapter import StabilityAdapter

logger = logging.getLogger(__name__)


def get_adapter(provider: str, api_key: str | None = None, base_url: str | None = None) -> BaseAdapter:
    """
    Фабрика адаптеров — получить нужный адаптер по провайдеру.
    Пользователь подключает модель → мы создаем правильный адаптер.
    """
    adapters = {
        "openai": lambda: OpenAIAdapter(api_key=api_key, base_url=base_url),
        "anthropic": lambda: AnthropicAdapter(api_key=api_key, base_url=base_url),
        "ollama": lambda: OllamaAdapter(base_url=base_url or "http://localhost:11434"),
        "groq": lambda: GroqAdapter(api_key=api_key, base_url=base_url),
        "google": lambda: GeminiAdapter(api_key=api_key, base_url=base_url),
        "gemini": lambda: GeminiAdapter(api_key=api_key, base_url=base_url),
        "openrouter": lambda: OpenRouterAdapter(api_key=api_key, base_url=base_url),
        "stability": lambda: StabilityAdapter(api_key=api_key, base_url=base_url),
        "custom": lambda: CustomAdapter(base_url=base_url, api_key=api_key),
    }

    factory = adapters.get(provider)
    if not factory:
        raise ValueError(f"Unknown provider: {provider}. Supported: {list(adapters.keys())}")
    return factory()


async def get_adapter_with_fallback(
    provider: str,
    model_name: str,
    api_key: str | None = None,
    base_url: str | None = None,
    messages: list[dict] | None = None,
    **call_kwargs,
) -> tuple[BaseAdapter, AIResponse]:
    """
    Создать адаптер и выполнить вызов. При 403/блокировке — фолбэк через OpenRouter.

    Возвращает (adapter, response).
    """
    import httpx

    from app.core.config import settings
    from app.core.model_registry import get_openrouter_model_id

    adapter = get_adapter(provider=provider, api_key=api_key, base_url=base_url)

    try:
        response = await adapter.call(messages=messages or [], model=model_name, **call_kwargs)
        return adapter, response
    except httpx.HTTPStatusError as e:
        if e.response.status_code not in (403, 451) or not settings.openrouter_fallback_enabled:
            raise

        logger.warning(
            f"Direct call to {provider}/{model_name} got {e.response.status_code}, "
            f"falling back to OpenRouter"
        )

        if not settings.openrouter_api_key:
            raise ValueError("OpenRouter fallback enabled but no openrouter_api_key configured") from e

        openrouter_model = get_openrouter_model_id(provider, model_name)
        if not openrouter_model:
            raise ValueError(f"No OpenRouter mapping for {provider}/{model_name}") from e

        fallback_adapter = OpenRouterAdapter(api_key=settings.openrouter_api_key)
        response = await fallback_adapter.call(
            messages=messages or [], model=openrouter_model, **call_kwargs
        )
        return fallback_adapter, response


__all__ = [
    "BaseAdapter", "AIResponse", "ToolCall",
    "OpenAIAdapter", "AnthropicAdapter", "OllamaAdapter",
    "GroqAdapter", "GeminiAdapter", "StabilityAdapter",
    "OpenRouterAdapter", "CustomAdapter",
    "get_adapter", "get_adapter_with_fallback",
]
