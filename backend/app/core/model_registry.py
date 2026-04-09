"""
Реестр всех ИИ моделей доступных в платформе.
Маппинг провайдер+модель → OpenRouter ID, тир подписки, категории, цены.
"""
from __future__ import annotations

MODELS: dict[str, dict] = {
    # ===== GROQ (бесплатные, напрямую) =====
    "groq/llama-3.3-70b-versatile": {
        "provider": "groq",
        "display_name": "Llama 3.3 70B",
        "openrouter_id": "meta-llama/llama-3.3-70b-instruct:free",
        "tier": "free_pool",
        "categories": ["code", "text", "research", "planning"],
        "price_input": 0.0,
        "price_output": 0.0,
        "context_window": 128000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Быстрая и умная, отлично для кода и планирования",
    },
    "groq/llama-3.1-8b-instant": {
        "provider": "groq",
        "display_name": "Llama 3.1 8B",
        "openrouter_id": None,
        "tier": "free_pool",
        "categories": ["code", "text"],
        "price_input": 0.0,
        "price_output": 0.0,
        "context_window": 128000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Очень быстрая, для простых задач",
    },
    "groq/llama-4-scout-17b-16e-instruct": {
        "provider": "groq",
        "display_name": "Llama 4 Scout 17B",
        "openrouter_id": None,
        "tier": "free_pool",
        "categories": ["code", "text", "research"],
        "price_input": 0.0,
        "price_output": 0.0,
        "context_window": 128000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Новейшая модель Meta, универсальная",
    },

    # ===== OPENROUTER FREE (бесплатные через OpenRouter) =====
    "openrouter/google/gemma-3-12b-it:free": {
        "provider": "openrouter",
        "display_name": "Gemma 3 12B",
        "openrouter_id": "google/gemma-3-12b-it:free",
        "tier": "free_pool",
        "categories": ["code", "text"],
        "price_input": 0.0,
        "price_output": 0.0,
        "context_window": 32000,
        "supports_tools": False,
        "supports_vision": False,
        "supports_images": False,
        "description": "Google Gemma, бесплатная",
    },
    "openrouter/google/gemma-3-27b-it:free": {
        "provider": "openrouter",
        "display_name": "Gemma 3 27B",
        "openrouter_id": "google/gemma-3-27b-it:free",
        "tier": "free_pool",
        "categories": ["code", "text", "research"],
        "price_input": 0.0,
        "price_output": 0.0,
        "context_window": 32000,
        "supports_tools": False,
        "supports_vision": False,
        "supports_images": False,
        "description": "Google Gemma побольше, бесплатная",
    },

    # ===== GOOGLE GEMINI (через OpenRouter) =====
    "google/gemini-2.5-flash": {
        "provider": "openrouter",
        "display_name": "Gemini 2.5 Flash",
        "openrouter_id": "google/gemini-2.5-flash",
        "tier": "premium",
        "categories": ["code", "text", "research"],
        "price_input": 0.30,
        "price_output": 2.50,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Быстрая Google, 1M контекст",
    },
    "google/gemini-2.5-pro": {
        "provider": "openrouter",
        "display_name": "Gemini 2.5 Pro",
        "openrouter_id": "google/gemini-2.5-pro",
        "tier": "premium",
        "categories": ["code", "text", "research", "planning"],
        "price_input": 1.25,
        "price_output": 10.00,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Топ Google, сложные задачи",
    },
    "google/gemini-2.5-flash-image": {
        "provider": "openrouter",
        "display_name": "Nano Banana",
        "openrouter_id": "google/gemini-2.5-flash-image",
        "tier": "premium",
        "categories": ["design", "image"],
        "price_input": 0.30,
        "price_output": 2.50,
        "context_window": 1000000,
        "supports_tools": False,
        "supports_vision": True,
        "supports_images": True,
        "description": "Генерация изображений от Google",
    },
    "google/gemini-3-pro-image-preview": {
        "provider": "openrouter",
        "display_name": "Nano Banana Pro",
        "openrouter_id": "google/gemini-3-pro-image-preview",
        "tier": "premium",
        "categories": ["design", "image"],
        "price_input": 2.00,
        "price_output": 12.00,
        "context_window": 1000000,
        "supports_tools": False,
        "supports_vision": True,
        "supports_images": True,
        "description": "Топ генерация изображений Google",
    },

    # ===== OPENAI (через OpenRouter) =====
    "openai/gpt-4o": {
        "provider": "openrouter",
        "display_name": "GPT-4o",
        "openrouter_id": "openai/gpt-4o",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "text", "research", "planning"],
        "price_input": 2.50,
        "price_output": 10.00,
        "context_window": 128000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Основная модель OpenAI, универсальная",
    },
    "openai/gpt-5.4": {
        "provider": "openrouter",
        "display_name": "GPT-5.4 Pro",
        "openrouter_id": "openai/gpt-5.4",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "text", "research", "planning", "analysis"],
        "price_input": 5.00,
        "price_output": 15.00,
        "context_window": 256000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Самая мощная модель OpenAI, максимальное качество",
    },
    "openai/o3-pro": {
        "provider": "openrouter",
        "display_name": "o3-pro (Reasoning)",
        "openrouter_id": "openai/o3-pro",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["research", "analysis", "code", "planning"],
        "price_input": 20.00,
        "price_output": 80.00,
        "context_window": 200000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Глубокое reasoning, математика, сложные задачи",
    },
    "openai/gpt-4.1": {
        "provider": "openrouter",
        "display_name": "GPT-4.1",
        "openrouter_id": "openai/gpt-4.1",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "text", "research", "planning"],
        "price_input": 2.00,
        "price_output": 8.00,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Новейшая OpenAI, 1M контекст",
    },
    "openai/gpt-4.1-mini": {
        "provider": "openrouter",
        "display_name": "GPT-4.1 Mini",
        "openrouter_id": "openai/gpt-4.1-mini",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "text"],
        "price_input": 0.40,
        "price_output": 1.60,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Баланс цена/качество",
    },
    "openai/gpt-4.1-nano": {
        "provider": "openrouter",
        "display_name": "GPT-4.1 Nano",
        "openrouter_id": "openai/gpt-4.1-nano",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "text", "testing"],
        "price_input": 0.10,
        "price_output": 0.40,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Самая дешёвая OpenAI, для тестов и ревью",
    },
    "openai/o3": {
        "provider": "openrouter",
        "display_name": "o3 (Reasoning)",
        "openrouter_id": "openai/o3",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "research", "planning"],
        "price_input": 2.00,
        "price_output": 8.00,
        "context_window": 200000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Reasoning модель, сложная логика",
    },
    "openai/o4-mini": {
        "provider": "openrouter",
        "display_name": "o4-mini (Reasoning)",
        "openrouter_id": "openai/o4-mini",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "research"],
        "price_input": 1.10,
        "price_output": 4.40,
        "context_window": 200000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Reasoning дешевле, быстрее",
    },
    "openai/gpt-4o-mini": {
        "provider": "openrouter",
        "display_name": "GPT-4o Mini",
        "openrouter_id": "openai/gpt-4o-mini",
        "direct_provider": "openai",
        "tier": "premium",
        "categories": ["code", "text", "testing"],
        "price_input": 0.15,
        "price_output": 0.60,
        "context_window": 128000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Дешёвая GPT-4o, для массовых задач",
    },

    # ===== ANTHROPIC (через OpenRouter) =====
    "anthropic/claude-sonnet-4.6": {
        "provider": "openrouter",
        "display_name": "Claude Sonnet 4.6",
        "openrouter_id": "anthropic/claude-sonnet-4.6",
        "direct_provider": "anthropic",
        "tier": "premium",
        "categories": ["code", "text", "research", "planning"],
        "price_input": 3.00,
        "price_output": 15.00,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Лучшая для кода и анализа",
    },
    "anthropic/claude-opus-4.6": {
        "provider": "openrouter",
        "display_name": "Claude Opus 4.6",
        "openrouter_id": "anthropic/claude-opus-4.6",
        "direct_provider": "anthropic",
        "tier": "premium",
        "categories": ["code", "text", "research", "planning"],
        "price_input": 5.00,
        "price_output": 25.00,
        "context_window": 1000000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Самая умная Anthropic",
    },
    "anthropic/claude-haiku-4.5": {
        "provider": "openrouter",
        "display_name": "Claude Haiku 4.5",
        "openrouter_id": "anthropic/claude-haiku-4.5",
        "direct_provider": "anthropic",
        "tier": "premium",
        "categories": ["code", "text", "testing"],
        "price_input": 1.00,
        "price_output": 5.00,
        "context_window": 200000,
        "supports_tools": True,
        "supports_vision": True,
        "supports_images": False,
        "description": "Быстрая и дешёвая Claude",
    },

    # ===== XAI GROK (через OpenRouter) =====
    "xai/grok-4": {
        "provider": "openrouter",
        "display_name": "Grok 4",
        "openrouter_id": "x-ai/grok-4",
        "tier": "premium",
        "categories": ["code", "text", "research"],
        "price_input": 3.00,
        "price_output": 15.00,
        "context_window": 200000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "xAI Grok, сильный reasoning",
    },
    "xai/grok-4.1-fast": {
        "provider": "openrouter",
        "display_name": "Grok 4.1 Fast",
        "openrouter_id": "x-ai/grok-4.1-fast",
        "tier": "premium",
        "categories": ["code", "text"],
        "price_input": 0.20,
        "price_output": 0.50,
        "context_window": 2000000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "Самая дешёвая топ-модель, 2M контекст",
    },
    "xai/grok-3": {
        "provider": "openrouter",
        "display_name": "Grok 3",
        "openrouter_id": "x-ai/grok-3",
        "tier": "premium",
        "categories": ["code", "text", "research"],
        "price_input": 3.00,
        "price_output": 15.00,
        "context_window": 131000,
        "supports_tools": True,
        "supports_vision": False,
        "supports_images": False,
        "description": "xAI Grok 3, универсальная",
    },
}


def get_model_info(model_key: str) -> dict | None:
    """Получить информацию о модели по ключу."""
    return MODELS.get(model_key)


def get_openrouter_model_id(provider: str, model_name: str) -> str | None:
    """
    Получить OpenRouter model ID для провайдера и модели.
    Используется для fallback маршрутизации.
    """
    # Прямой поиск по ключу
    key = f"{provider}/{model_name}"
    if key in MODELS:
        return MODELS[key].get("openrouter_id")

    # Поиск по direct_provider + model_name
    for model_key, info in MODELS.items():
        if info.get("direct_provider") == provider:
            # Сравниваем часть после /
            or_id = info.get("openrouter_id", "")
            if or_id and or_id.endswith(model_name):
                return or_id
            # Или совпадение display_name
            if model_name in model_key:
                return info.get("openrouter_id")

    # Если ничего не нашли — попробуем формат provider/model_name
    fallback_id = f"{provider}/{model_name}"
    return fallback_id


def get_models_by_tier(tier: str) -> list[dict]:
    """Получить все модели определённого тира."""
    result = []
    for key, info in MODELS.items():
        if info["tier"] == tier:
            result.append({"key": key, **info})
    return result


def get_models_by_category(category: str) -> list[dict]:
    """Получить все модели для определённой категории задач."""
    result = []
    for key, info in MODELS.items():
        if category in info.get("categories", []):
            result.append({"key": key, **info})
    return result


def get_all_models() -> list[dict]:
    """Получить все модели."""
    return [{"key": key, **info} for key, info in MODELS.items()]
