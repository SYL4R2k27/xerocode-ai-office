"""
Готовые пулы моделей под разные задачи.
PRO — бесплатные модели (Groq + OpenRouter free).
ULTIMA — премиум модели (GPT-4o, Claude, Gemini, Grok через OpenRouter).
"""
from __future__ import annotations

POOLS: dict[str, dict] = {
    # ===== PRO пулы (бесплатные модели) =====
    "coding_start": {
        "name": "Кодинг Старт",
        "description": "Быстрая команда для написания кода. Бесплатные модели.",
        "icon": "💻",
        "tier": "pro",
        "category": "code",
        "agents": [
            {
                "name": "Архитектор",
                "role": "Планирование и декомпозиция задач",
                "avatar": "🏗️",
                "provider": "groq",
                "model_name": "llama-3.3-70b-versatile",
                "skills": ["code", "planning"],
            },
            {
                "name": "Кодер",
                "role": "Написание кода",
                "avatar": "⌨️",
                "provider": "groq",
                "model_name": "llama-3.1-8b-instant",
                "skills": ["code"],
            },
            {
                "name": "Ревьюер",
                "role": "Проверка и тестирование кода",
                "avatar": "🔍",
                "provider": "groq",
                "model_name": "llama-4-scout-17b-16e-instruct",
                "skills": ["review", "testing"],
            },
        ],
    },
    "research": {
        "name": "Ресёрч",
        "description": "Команда для исследований и анализа. Бесплатные модели.",
        "icon": "🔬",
        "tier": "pro",
        "category": "research",
        "agents": [
            {
                "name": "Исследователь",
                "role": "Сбор и анализ информации",
                "avatar": "📊",
                "provider": "groq",
                "model_name": "llama-3.3-70b-versatile",
                "skills": ["research", "analysis"],
            },
            {
                "name": "Аналитик",
                "role": "Выводы и рекомендации",
                "avatar": "🧠",
                "provider": "groq",
                "model_name": "llama-4-scout-17b-16e-instruct",
                "skills": ["analysis", "text"],
            },
        ],
    },
    "copywriting": {
        "name": "Копирайтинг",
        "description": "Написание и редактирование текстов. Бесплатные модели.",
        "icon": "✍️",
        "tier": "pro",
        "category": "text",
        "agents": [
            {
                "name": "Копирайтер",
                "role": "Написание текстов",
                "avatar": "📝",
                "provider": "groq",
                "model_name": "llama-3.3-70b-versatile",
                "skills": ["text"],
            },
            {
                "name": "Редактор",
                "role": "Редактирование и корректура",
                "avatar": "📋",
                "provider": "groq",
                "model_name": "llama-3.1-8b-instant",
                "skills": ["text", "review"],
            },
        ],
    },

    # ===== ULTIMA пулы (премиум модели через OpenRouter) =====
    "coding_premium": {
        "name": "Кодинг Премиум",
        "description": "Лучшие модели для серьёзной разработки.",
        "icon": "🚀",
        "tier": "ultima",
        "category": "code",
        "agents": [
            {
                "name": "Архитектор",
                "role": "Планирование архитектуры",
                "avatar": "🏗️",
                "provider": "openrouter",
                "model_name": "openai/gpt-4.1",
                "skills": ["code", "planning"],
            },
            {
                "name": "Кодер",
                "role": "Написание кода",
                "avatar": "⌨️",
                "provider": "openrouter",
                "model_name": "anthropic/claude-sonnet-4.6",
                "skills": ["code"],
            },
            {
                "name": "Тестер",
                "role": "Тестирование и ревью",
                "avatar": "🧪",
                "provider": "openrouter",
                "model_name": "openai/gpt-4.1-nano",
                "skills": ["testing", "review"],
            },
        ],
    },
    "design": {
        "name": "Дизайн",
        "description": "Генерация дизайна и вёрстка. Nano Banana + код.",
        "icon": "🎨",
        "tier": "ultima",
        "category": "design",
        "agents": [
            {
                "name": "Дизайнер",
                "role": "Генерация макетов и изображений",
                "avatar": "🖼️",
                "provider": "openrouter",
                "model_name": "google/gemini-2.5-flash-image",
                "skills": ["design", "image"],
            },
            {
                "name": "Верстальщик",
                "role": "HTML/CSS/JS по макету",
                "avatar": "🖥️",
                "provider": "openrouter",
                "model_name": "anthropic/claude-sonnet-4.6",
                "skills": ["code", "design"],
            },
            {
                "name": "Копирайтер",
                "role": "Тексты для дизайна",
                "avatar": "✍️",
                "provider": "groq",
                "model_name": "llama-3.3-70b-versatile",
                "skills": ["text"],
            },
        ],
    },
    "full_team": {
        "name": "Полная команда",
        "description": "Все роли: архитектор, кодер, дизайнер, тестер, аналитик.",
        "icon": "👥",
        "tier": "ultima",
        "category": "all",
        "agents": [
            {
                "name": "Менеджер",
                "role": "Управление и планирование",
                "avatar": "👔",
                "provider": "openrouter",
                "model_name": "openai/gpt-4o",
                "skills": ["planning", "management"],
            },
            {
                "name": "Кодер",
                "role": "Разработка",
                "avatar": "⌨️",
                "provider": "openrouter",
                "model_name": "anthropic/claude-sonnet-4.6",
                "skills": ["code"],
            },
            {
                "name": "Дизайнер",
                "role": "Визуал и UX",
                "avatar": "🎨",
                "provider": "openrouter",
                "model_name": "google/gemini-2.5-flash-image",
                "skills": ["design", "image"],
            },
            {
                "name": "Тестер",
                "role": "QA и тестирование",
                "avatar": "🧪",
                "provider": "openrouter",
                "model_name": "openai/gpt-4.1-nano",
                "skills": ["testing", "review"],
            },
            {
                "name": "Аналитик",
                "role": "Ресёрч и анализ",
                "avatar": "📊",
                "provider": "openrouter",
                "model_name": "google/gemini-2.5-flash",
                "skills": ["research", "analysis"],
            },
        ],
    },
    "reasoning": {
        "name": "Логика и решения",
        "description": "Reasoning модели для сложных задач.",
        "icon": "🧩",
        "tier": "ultima",
        "category": "research",
        "agents": [
            {
                "name": "Мыслитель",
                "role": "Глубокий анализ и рассуждения",
                "avatar": "🤔",
                "provider": "openrouter",
                "model_name": "openai/o3",
                "skills": ["research", "planning"],
            },
            {
                "name": "Проверяющий",
                "role": "Верификация выводов",
                "avatar": "✅",
                "provider": "openrouter",
                "model_name": "openai/o4-mini",
                "skills": ["review", "analysis"],
            },
        ],
    },
    "speed": {
        "name": "Скорость",
        "description": "Самые быстрые и дешёвые модели для массовых задач.",
        "icon": "⚡",
        "tier": "ultima",
        "category": "all",
        "agents": [
            {
                "name": "Быстрый",
                "role": "Быстрое выполнение",
                "avatar": "🏃",
                "provider": "openrouter",
                "model_name": "x-ai/grok-4.1-fast",
                "skills": ["code", "text"],
            },
            {
                "name": "Дешёвый",
                "role": "Массовые операции",
                "avatar": "💰",
                "provider": "openrouter",
                "model_name": "openai/gpt-4.1-nano",
                "skills": ["code", "text", "testing"],
            },
        ],
    },
}


def get_pool(pool_id: str) -> dict | None:
    """Получить пул по ID."""
    return POOLS.get(pool_id)


def get_pools_by_tier(tier: str) -> list[dict]:
    """Получить все пулы определённого тира (pro / ultima)."""
    result = []
    for pool_id, pool in POOLS.items():
        if pool["tier"] == tier:
            result.append({"id": pool_id, **pool})
    return result


def get_pools_by_category(category: str) -> list[dict]:
    """Получить пулы для определённой категории задач."""
    result = []
    for pool_id, pool in POOLS.items():
        if pool["category"] == category or pool["category"] == "all":
            result.append({"id": pool_id, **pool})
    return result


def get_all_pools() -> list[dict]:
    """Получить все пулы."""
    return [{"id": pool_id, **pool} for pool_id, pool in POOLS.items()]


def get_available_pools(user_tier: str) -> list[dict]:
    """
    Получить пулы доступные для тира подписки пользователя.
    free → ничего
    pro → pro пулы
    ultima → pro + ultima пулы
    """
    if user_tier == "free":
        return []
    elif user_tier == "pro":
        return get_pools_by_tier("pro")
    elif user_tier == "ultima":
        return get_all_pools()
    return []
