"""
Готовые пулы моделей под разные задачи.
15 пулов: flagship, coding (3), design (2), research (2), text, data, automation, solo (3).
"""
from __future__ import annotations

POOLS: dict[str, dict] = {
    # ============ FLAGSHIP ============
    "flagship": {
        "name": "🏆 Флагман",
        "description": "Claude Opus + GPT-5.4 + Grok 4 — максимальное качество",
        "tier": "ultima",
        "agents": [
            {"name": "Архитектор", "role": "Планирование и архитектура", "avatar": "🏗️", "provider": "openrouter", "model_name": "anthropic/claude-opus-4-20250514", "skills": ["planning", "analysis", "code"]},
            {"name": "Кодер", "role": "Разработка и код", "avatar": "⌨️", "provider": "openrouter", "model_name": "openai/gpt-5.4", "skills": ["code", "text"]},
            {"name": "Аналитик", "role": "Reasoning и анализ", "avatar": "🧠", "provider": "openrouter", "model_name": "x-ai/grok-4", "skills": ["research", "analysis"]},
            {"name": "Ревьюер", "role": "Code review и тесты", "avatar": "🔍", "provider": "openrouter", "model_name": "deepseek/deepseek-r1-0528", "skills": ["review", "testing", "code"]},
        ],
    },

    # ============ CODING ============
    "coding_start": {
        "name": "💻 Кодинг Старт",
        "description": "Бесплатные модели для программирования",
        "tier": "pro",
        "agents": [
            {"name": "Планер", "role": "Планирование", "avatar": "📋", "provider": "groq", "model_name": "llama-3.3-70b-versatile", "skills": ["planning", "code"]},
            {"name": "Кодер", "role": "Разработка", "avatar": "⌨️", "provider": "groq", "model_name": "llama-3.1-8b-instant", "skills": ["code"]},
            {"name": "Тестер", "role": "Тестирование", "avatar": "🧪", "provider": "openrouter", "model_name": "mistralai/devstral-small", "skills": ["testing", "review"]},
        ],
    },
    "coding_pro": {
        "name": "💻 Кодинг Про",
        "description": "Продвинутые модели для серьёзной разработки",
        "tier": "pro_plus",
        "agents": [
            {"name": "Архитектор", "role": "Архитектура и планирование", "avatar": "🏗️", "provider": "openrouter", "model_name": "deepseek/deepseek-r1-0528", "skills": ["planning", "analysis"]},
            {"name": "Кодер", "role": "Написание кода", "avatar": "⌨️", "provider": "openrouter", "model_name": "qwen/qwen3-coder", "skills": ["code"]},
            {"name": "Ревьюер", "role": "Code review", "avatar": "🔍", "provider": "openrouter", "model_name": "mistralai/codestral-2508", "skills": ["review", "code"]},
        ],
    },
    "coding_fullstack": {
        "name": "🌐 Fullstack",
        "description": "Frontend + Backend + DevOps",
        "tier": "pro_plus",
        "agents": [
            {"name": "Frontend", "role": "React/Vue/CSS", "avatar": "🎯", "provider": "openrouter", "model_name": "qwen/qwen3-coder", "skills": ["code", "design"]},
            {"name": "Backend", "role": "API/DB/Logic", "avatar": "⚙️", "provider": "openrouter", "model_name": "deepseek/deepseek-chat-v3.1", "skills": ["code"]},
            {"name": "DevOps", "role": "Docker/CI/Deploy", "avatar": "🚀", "provider": "openrouter", "model_name": "x-ai/grok-4.1-fast", "skills": ["code", "planning"]},
            {"name": "Тестер", "role": "Тесты и QA", "avatar": "🧪", "provider": "openrouter", "model_name": "mistralai/devstral-small", "skills": ["testing"]},
        ],
    },

    # ============ DESIGN ============
    "design_start": {
        "name": "🎨 Дизайн Старт",
        "description": "Генерация изображений + вёрстка",
        "tier": "pro",
        "agents": [
            {"name": "Генератор", "role": "Создание изображений", "avatar": "🖼️", "provider": "openrouter", "model_name": "meta-llama/llama-4-maverick", "skills": ["image", "design"]},
            {"name": "Верстальщик", "role": "HTML/CSS по макету", "avatar": "💻", "provider": "groq", "model_name": "llama-3.3-70b-versatile", "skills": ["code", "design"]},
        ],
    },
    "design_pro": {
        "name": "🎨 Дизайн Про",
        "description": "Премиум дизайн-студия с SD 3.5",
        "tier": "ultima",
        "agents": [
            {"name": "Концептер", "role": "Идеи и мудборд", "avatar": "💡", "provider": "openrouter", "model_name": "x-ai/grok-4", "skills": ["planning", "design"]},
            {"name": "Генератор", "role": "SD 3.5 изображения", "avatar": "🖼️", "provider": "stability", "model_name": "sd3.5-large", "skills": ["image"]},
            {"name": "Верстальщик", "role": "Код по дизайну", "avatar": "💻", "provider": "openrouter", "model_name": "qwen/qwen3-coder", "skills": ["code", "design"]},
        ],
    },

    # ============ RESEARCH ============
    "research": {
        "name": "🔬 Ресёрч",
        "description": "Анализ, исследования, reasoning",
        "tier": "pro",
        "agents": [
            {"name": "Исследователь", "role": "Поиск и анализ", "avatar": "🔍", "provider": "openrouter", "model_name": "deepseek/deepseek-r1-0528", "skills": ["research", "analysis"]},
            {"name": "Аналитик", "role": "Выводы и отчёты", "avatar": "📊", "provider": "groq", "model_name": "llama-3.3-70b-versatile", "skills": ["analysis", "text"]},
        ],
    },
    "research_deep": {
        "name": "🔬 Глубокий ресёрч",
        "description": "С поиском в интернете (Perplexity)",
        "tier": "ultima",
        "agents": [
            {"name": "Поисковик", "role": "Поиск в интернете", "avatar": "🌐", "provider": "openrouter", "model_name": "perplexity/sonar-pro-search", "skills": ["research"]},
            {"name": "Аналитик", "role": "Reasoning и анализ", "avatar": "🧠", "provider": "openrouter", "model_name": "deepseek/deepseek-r1-0528", "skills": ["analysis", "research"]},
            {"name": "Автор", "role": "Написание отчёта", "avatar": "📝", "provider": "openrouter", "model_name": "mistralai/mistral-large-2411", "skills": ["text"]},
        ],
    },

    # ============ TEXT ============
    "copywriting": {
        "name": "📝 Копирайтинг",
        "description": "Тексты, статьи, контент",
        "tier": "pro",
        "agents": [
            {"name": "Копирайтер", "role": "Написание текстов", "avatar": "✍️", "provider": "openrouter", "model_name": "mistralai/mistral-large-2411", "skills": ["text"]},
            {"name": "Редактор", "role": "Редактура и корректура", "avatar": "📖", "provider": "groq", "model_name": "llama-3.3-70b-versatile", "skills": ["review", "text"]},
        ],
    },

    # ============ DATA ============
    "data_analysis": {
        "name": "📊 Данные",
        "description": "Анализ данных, SQL, Python",
        "tier": "pro_plus",
        "agents": [
            {"name": "Аналитик", "role": "SQL и анализ", "avatar": "📊", "provider": "openrouter", "model_name": "deepseek/deepseek-chat-v3.1", "skills": ["code", "analysis"]},
            {"name": "Визуализатор", "role": "Графики и дашборды", "avatar": "📈", "provider": "openrouter", "model_name": "qwen/qwen3-coder", "skills": ["code", "design"]},
        ],
    },

    # ============ AUTOMATION ============
    "automation": {
        "name": "🤖 Автоматизация",
        "description": "Скрипты, боты, автоматизация процессов",
        "tier": "pro_plus",
        "agents": [
            {"name": "Автоматизатор", "role": "Скрипты и интеграции", "avatar": "⚡", "provider": "openrouter", "model_name": "x-ai/grok-code-fast-1", "skills": ["code"]},
            {"name": "Тестер", "role": "Проверка и отладка", "avatar": "🧪", "provider": "openrouter", "model_name": "deepseek/deepseek-chat-v3.1", "skills": ["testing", "code"]},
        ],
    },

    # ============ SINGLE MODELS ============
    "solo_grok": {
        "name": "⚡ Grok 4 (соло)",
        "description": "Одна модель — Grok 4, 2M контекст",
        "tier": "pro_plus",
        "agents": [
            {"name": "Grok", "role": "Универсальный", "avatar": "⚡", "provider": "openrouter", "model_name": "x-ai/grok-4", "skills": ["code", "research", "text", "planning"]},
        ],
    },
    "solo_deepseek": {
        "name": "🧠 DeepSeek R1 (соло)",
        "description": "Одна модель — DeepSeek R1 Reasoning",
        "tier": "pro",
        "agents": [
            {"name": "DeepSeek", "role": "Reasoning", "avatar": "🧠", "provider": "openrouter", "model_name": "deepseek/deepseek-r1-0528", "skills": ["research", "analysis", "code"]},
        ],
    },
    "solo_fast": {
        "name": "🚀 Быстрый (соло)",
        "description": "Одна модель — Llama 3.3 70B через Groq (бесплатно)",
        "tier": "pro",
        "agents": [
            {"name": "Llama", "role": "Быстрый универсальный", "avatar": "🚀", "provider": "groq", "model_name": "llama-3.3-70b-versatile", "skills": ["code", "text", "research"]},
        ],
    },
}


def get_pool(pool_id: str) -> dict | None:
    """Получить пул по ID."""
    return POOLS.get(pool_id)


def get_pools_by_tier(tier: str) -> list[dict]:
    """Получить все пулы определённого тира (pro / pro_plus / ultima)."""
    result = []
    for pool_id, pool in POOLS.items():
        if pool["tier"] == tier:
            result.append({"id": pool_id, **pool})
    return result


def get_all_pools() -> list[dict]:
    """Получить все пулы."""
    return [{"id": pool_id, **pool} for pool_id, pool in POOLS.items()]


def get_available_pools(user_tier: str) -> list[dict]:
    """
    Получить пулы доступные для тира подписки пользователя.
    Использует POOL_ACCESS из subscription.py.
    """
    from app.core.subscription import POOL_ACCESS

    access = POOL_ACCESS.get(user_tier, [])
    if isinstance(access, list):
        return [{"id": pid, **POOLS[pid]} for pid in access if pid in POOLS]
    # "all" or list of all keys
    return get_all_pools()
