"""
Smart Model Router — маршрутизация по модели, не по провайдеру.
Прямой ключ → OpenRouter → другие провайдеры → ошибка.

Полная карта: 300+ моделей от всех провайдеров.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ProviderConfig:
    provider: str
    api_key: str
    base_url: str | None = None
    model_id: str = ""


# Маршруты: ключ = короткое имя модели, значение = [(провайдер, model_id)]
# Порядок = приоритет (прямой ключ первый)
MODEL_ROUTES: dict[str, list[tuple[str, str]]] = {
    # ============================================================
    # OpenAI — GPT-5.x серия (прямой ключ работает!)
    # ============================================================
    "gpt-5.4-pro": [("openai", "gpt-5.4-pro"), ("openrouter", "openai/gpt-5.4-pro")],
    "gpt-5.4": [("openai", "gpt-5.4"), ("openrouter", "openai/gpt-5.4")],
    "gpt-5.4-mini": [("openai", "gpt-5.4-mini"), ("openrouter", "openai/gpt-5.4-mini")],
    "gpt-5.4-nano": [("openai", "gpt-5.4-nano"), ("openrouter", "openai/gpt-5.4-nano")],
    "gpt-5.3-codex": [("openai", "gpt-5.3-codex"), ("openrouter", "openai/gpt-5.3-codex")],
    "gpt-5.2-pro": [("openai", "gpt-5.2-pro"), ("openrouter", "openai/gpt-5.2-pro")],
    "gpt-5.2": [("openai", "gpt-5.2"), ("openrouter", "openai/gpt-5.2")],
    "gpt-5.2-codex": [("openai", "gpt-5.2-codex"), ("openrouter", "openai/gpt-5.2-codex")],
    "gpt-5.1-codex-max": [("openai", "gpt-5.1-codex-max"), ("openrouter", "openai/gpt-5.1-codex-max")],
    "gpt-5.1-codex": [("openai", "gpt-5.1-codex"), ("openrouter", "openai/gpt-5.1-codex")],
    "gpt-5.1-codex-mini": [("openai", "gpt-5.1-codex-mini"), ("openrouter", "openai/gpt-5.1-codex-mini")],
    "gpt-5.1": [("openai", "gpt-5.1"), ("openrouter", "openai/gpt-5.1")],
    "gpt-5-pro": [("openai", "gpt-5-pro"), ("openrouter", "openai/gpt-5-pro")],
    "gpt-5": [("openai", "gpt-5"), ("openrouter", "openai/gpt-5")],
    "gpt-5-mini": [("openai", "gpt-5-mini"), ("openrouter", "openai/gpt-5-mini")],
    "gpt-5-nano": [("openai", "gpt-5-nano"), ("openrouter", "openai/gpt-5-nano")],
    "gpt-5-codex": [("openai", "gpt-5-codex"), ("openrouter", "openai/gpt-5-codex")],
    # OpenAI — GPT-4.x
    "gpt-4o": [("openai", "gpt-4o"), ("openrouter", "openai/gpt-4o")],
    "gpt-4o-mini": [("openai", "gpt-4o-mini"), ("openrouter", "openai/gpt-4o-mini")],
    "gpt-4.1": [("openai", "gpt-4.1"), ("openrouter", "openai/gpt-4.1")],
    "gpt-4.1-mini": [("openai", "gpt-4.1-mini"), ("openrouter", "openai/gpt-4.1-mini")],
    "gpt-4.1-nano": [("openai", "gpt-4.1-nano"), ("openrouter", "openai/gpt-4.1-nano")],
    "gpt-4-turbo": [("openai", "gpt-4-turbo"), ("openrouter", "openai/gpt-4-turbo")],
    # OpenAI — Reasoning
    "o4-mini": [("openai", "o4-mini"), ("openrouter", "openai/o4-mini")],
    "o3": [("openai", "o3"), ("openrouter", "openai/o3")],
    "o3-mini": [("openai", "o3-mini"), ("openrouter", "openai/o3-mini")],
    "o1-pro": [("openai", "o1-pro"), ("openrouter", "openai/o1-pro")],
    "o1": [("openai", "o1"), ("openrouter", "openai/o1")],
    # OpenAI — Изображения
    "gpt-image-1.5": [("openai", "gpt-image-1.5")],
    "gpt-image-1": [("openai", "gpt-image-1")],
    "gpt-image-1-mini": [("openai", "gpt-image-1-mini")],
    "dall-e-3": [("openai", "dall-e-3")],
    # OpenAI — Видео
    "sora-2-pro": [("openai", "sora-2-pro")],
    "sora-2": [("openai", "sora-2")],

    # ============================================================
    # Nano Banana (через APIyi!)
    # ============================================================
    "nano-banana": [("apiyi", "nano-banana"), ("openrouter", "google/gemini-2.5-flash-image")],
    "nano-banana-2": [("apiyi", "nano-banana-2"), ("openrouter", "google/gemini-3.1-flash-image-preview")],
    "nano-banana-pro": [("apiyi", "nano-banana-pro"), ("openrouter", "google/gemini-3-pro-image-preview")],

    # Gemini через APIyi (подстраховка)
    "gemini-2.5-flash": [("apiyi", "gemini-2.5-flash"), ("openrouter", "google/gemini-2.5-flash")],
    "gemini-2.5-pro": [("apiyi", "gemini-2.5-pro"), ("openrouter", "google/gemini-2.5-pro")],
    "gemini-2.5-flash-image": [("apiyi", "gemini-2.5-flash-image"), ("openrouter", "google/gemini-2.5-flash-image")],
    "gemini-3.1-pro-preview": [("apiyi", "gemini-3.1-pro-preview")],

    # FLUX через APIyi
    "flux-2-pro": [("apiyi", "flux-2-pro")],
    "flux-2-max": [("apiyi", "flux-2-max")],
    "flux-kontext-pro": [("apiyi", "flux-kontext-pro")],

    # ============================================================
    # Anthropic — Claude (прямой ключ работает!)
    # ============================================================
    "claude-sonnet-4-6": [("anthropic", "claude-sonnet-4-6"), ("openrouter", "anthropic/claude-sonnet-4.6")],
    "claude-opus-4-6": [("anthropic", "claude-opus-4-6"), ("openrouter", "anthropic/claude-opus-4.6")],
    "claude-haiku-4-5": [("anthropic", "claude-haiku-4-5-20251001"), ("openrouter", "anthropic/claude-haiku-4.5")],
    "claude-sonnet-4-5": [("anthropic", "claude-sonnet-4-5-20250929"), ("openrouter", "anthropic/claude-sonnet-4.5")],
    "claude-opus-4-5": [("anthropic", "claude-opus-4-5-20251101"), ("openrouter", "anthropic/claude-opus-4.5")],
    "claude-opus-4-1": [("anthropic", "claude-opus-4-1-20250805"), ("openrouter", "anthropic/claude-opus-4.1")],
    "claude-opus-4": [("anthropic", "claude-opus-4-20250514"), ("openrouter", "anthropic/claude-opus-4")],
    "claude-sonnet-4": [("anthropic", "claude-sonnet-4-20250514"), ("openrouter", "anthropic/claude-sonnet-4")],

    # ============================================================
    # Groq — бесплатно, быстро
    # ============================================================
    "llama-3.3-70b-versatile": [("groq", "llama-3.3-70b-versatile"), ("openrouter", "meta-llama/llama-3.3-70b-instruct")],
    "llama-3.1-8b-instant": [("groq", "llama-3.1-8b-instant"), ("cerebras", "llama3.1-8b"), ("openrouter", "meta-llama/llama-3.1-8b-instruct")],

    # ============================================================
    # Cerebras — быстро, бесплатно
    # ============================================================
    "qwen-3-235b": [("cerebras", "qwen-3-235b-a22b-instruct-2507"), ("openrouter", "qwen/qwen3-235b-a22b")],

    # ============================================================
    # DeepSeek — через OpenRouter
    # ============================================================
    "deepseek-r1": [("openrouter", "deepseek/deepseek-r1")],
    "deepseek-r1-0528": [("openrouter", "deepseek/deepseek-r1-0528")],
    "deepseek-chat": [("openrouter", "deepseek/deepseek-chat")],
    "deepseek-chat-v3.1": [("openrouter", "deepseek/deepseek-chat-v3.1")],
    "deepseek-v3.2-speciale": [("openrouter", "deepseek/deepseek-v3.2-speciale")],
    "deepseek-prover-v2": [("openrouter", "deepseek/deepseek-prover-v2")],

    # ============================================================
    # Qwen — через OpenRouter (49 моделей)
    # ============================================================
    "qwen-max": [("openrouter", "qwen/qwen-max")],
    "qwen3-max": [("openrouter", "qwen/qwen3-max")],
    "qwen3-coder": [("openrouter", "qwen/qwen3-coder")],
    "qwen3-coder-plus": [("openrouter", "qwen/qwen3-coder-plus")],
    "qwen-plus": [("openrouter", "qwen/qwen-plus")],
    "qwen-turbo": [("openrouter", "qwen/qwen-turbo")],
    "qwen3-235b-a22b": [("cerebras", "qwen-3-235b-a22b-instruct-2507"), ("openrouter", "qwen/qwen3-235b-a22b")],

    # ============================================================
    # xAI Grok — через OpenRouter
    # ============================================================
    "grok-4": [("openrouter", "x-ai/grok-4")],
    "grok-4.1-fast": [("openrouter", "x-ai/grok-4.1-fast")],
    "grok-4-fast": [("openrouter", "x-ai/grok-4-fast")],
    "grok-4.20-beta": [("openrouter", "x-ai/grok-4.20-beta")],
    "grok-4.20-multi-agent-beta": [("openrouter", "x-ai/grok-4.20-multi-agent-beta")],
    "grok-code-fast-1": [("openrouter", "x-ai/grok-code-fast-1")],
    "grok-3": [("openrouter", "x-ai/grok-3")],
    "grok-3-beta": [("openrouter", "x-ai/grok-3-beta")],
    "grok-3-mini": [("openrouter", "x-ai/grok-3-mini")],
    "grok-3-mini-beta": [("openrouter", "x-ai/grok-3-mini-beta")],

    # ============================================================
    # Mistral — через OpenRouter
    # ============================================================
    "mistral-large-2411": [("openrouter", "mistralai/mistral-large-2411")],
    "mistral-large": [("openrouter", "mistralai/mistral-large")],
    "codestral-2508": [("openrouter", "mistralai/codestral-2508")],
    "devstral-medium": [("openrouter", "mistralai/devstral-medium")],
    "devstral-small": [("openrouter", "mistralai/devstral-small")],
    "mistral-small-3.1-24b": [("openrouter", "mistralai/mistral-small-3.1-24b-instruct")],
    "pixtral-large-2411": [("openrouter", "mistralai/pixtral-large-2411")],

    # ============================================================
    # Meta Llama — через OpenRouter + Groq
    # ============================================================
    "llama-4-maverick": [("openrouter", "meta-llama/llama-4-maverick")],
    "llama-4-scout": [("openrouter", "meta-llama/llama-4-scout")],
    "llama-3.3-70b-instruct": [("groq", "llama-3.3-70b-versatile"), ("openrouter", "meta-llama/llama-3.3-70b-instruct")],
    "llama-3.1-70b-instruct": [("openrouter", "meta-llama/llama-3.1-70b-instruct")],
    "llama-3-70b-instruct": [("openrouter", "meta-llama/llama-3-70b-instruct")],

    # ============================================================
    # Nvidia
    # ============================================================
    "nemotron-ultra-253b": [("openrouter", "nvidia/llama-3.1-nemotron-ultra-253b-v1")],
    "nemotron-super-49b": [("openrouter", "nvidia/llama-3.3-nemotron-super-49b-v1.5")],

    # ============================================================
    # Perplexity (с поиском!)
    # ============================================================
    "sonar-pro": [("openrouter", "perplexity/sonar-pro")],
    "sonar-pro-search": [("openrouter", "perplexity/sonar-pro-search")],
    "sonar-reasoning-pro": [("openrouter", "perplexity/sonar-reasoning-pro")],
    "sonar-deep-research": [("openrouter", "perplexity/sonar-deep-research")],

    # ============================================================
    # Cohere
    # ============================================================
    "command-a": [("openrouter", "cohere/command-a")],
    "command-r-plus": [("openrouter", "cohere/command-r-plus-08-2024")],

    # ============================================================
    # Moonshot (Kimi)
    # ============================================================
    "kimi-k2.5": [("openrouter", "moonshotai/kimi-k2.5")],
    "kimi-k2": [("openrouter", "moonshotai/kimi-k2")],

    # ============================================================
    # Amazon
    # ============================================================
    "nova-premier": [("openrouter", "amazon/nova-premier-v1")],
    "nova-pro": [("openrouter", "amazon/nova-pro-v1")],

    # ============================================================
    # Baidu (Ernie)
    # ============================================================
    "ernie-4.5": [("openrouter", "baidu/ernie-4.5-300b-a47b")],

    # ============================================================
    # Z-AI (GLM)
    # ============================================================
    "glm-5-turbo": [("openrouter", "z-ai/glm-5-turbo")],
    "glm-5": [("openrouter", "z-ai/glm-5")],
    "glm-4.6": [("openrouter", "z-ai/glm-4.6")],

    # ============================================================
    # MiniMax
    # ============================================================
    "minimax-m1": [("openrouter", "minimax/minimax-m1")],
    "minimax-m2.7": [("openrouter", "minimax/minimax-m2.7")],

    # ============================================================
    # Inception (Mercury)
    # ============================================================
    "mercury-2": [("openrouter", "inception/mercury-2")],
    "mercury-coder": [("openrouter", "inception/mercury-coder")],

    # ============================================================
    # NousResearch
    # ============================================================
    "hermes-4-405b": [("openrouter", "nousresearch/hermes-4-405b")],

    # ============================================================
    # Stability AI — изображения (прямой ключ, $1021 баланс!)
    # ============================================================
    "sd3.5-large": [("stability", "sd3.5-large")],
    "sd3.5-large-turbo": [("stability", "sd3.5-large-turbo")],
    "sd3.5-medium": [("stability", "sd3.5-medium")],
    "stable-image-core": [("stability", "stable-image-core")],
    "stable-image-ultra": [("stability", "stable-image-ultra")],
}


def get_provider_keys() -> dict[str, ProviderConfig]:
    """Получить все настроенные ключи провайдеров."""
    from app.core.config import settings

    providers: dict[str, ProviderConfig] = {}
    if getattr(settings, "openai_api_key", None):
        providers["openai"] = ProviderConfig("openai", settings.openai_api_key)
    if getattr(settings, "anthropic_api_key", None):
        providers["anthropic"] = ProviderConfig("anthropic", settings.anthropic_api_key)
    if getattr(settings, "groq_api_key", None):
        providers["groq"] = ProviderConfig("groq", settings.groq_api_key)
    if getattr(settings, "openrouter_api_key", None):
        providers["openrouter"] = ProviderConfig("openrouter", settings.openrouter_api_key)
    if getattr(settings, "sambanova_api_key", None):
        providers["sambanova"] = ProviderConfig("custom", settings.sambanova_api_key, "https://api.sambanova.ai/v1")
    if getattr(settings, "cerebras_api_key", None):
        providers["cerebras"] = ProviderConfig("custom", settings.cerebras_api_key, "https://api.cerebras.ai/v1")
    if getattr(settings, "stability_api_key", None):
        providers["stability"] = ProviderConfig("stability", settings.stability_api_key)
    if getattr(settings, "apiyi_api_key", None):
        providers["apiyi"] = ProviderConfig("custom", settings.apiyi_api_key, "https://api.apiyi.com/v1")
    return providers


def resolve_model_route(
    model_name: str,
    agent_provider: str,
    agent_api_key: str,
    agent_base_url: str | None = None,
) -> list[ProviderConfig]:
    """Построить список маршрутов для модели (прямой → fallback → OpenRouter)."""
    clean = model_name.split("/")[-1] if "/" in model_name else model_name
    routes: list[ProviderConfig] = []

    # 1. Agent's own key (primary)
    routes.append(ProviderConfig(agent_provider, agent_api_key, agent_base_url, model_name))

    platform_keys = get_provider_keys()

    # 2. Check MODEL_ROUTES for fallbacks
    matched = False
    for route_key, providers in MODEL_ROUTES.items():
        if route_key == clean.lower() or clean.lower().startswith(route_key) or route_key in clean.lower():
            matched = True
            for prov_name, prov_model_id in providers:
                if prov_name in platform_keys and prov_name != agent_provider:
                    cfg = platform_keys[prov_name]
                    routes.append(ProviderConfig(cfg.provider, cfg.api_key, cfg.base_url, prov_model_id))
            break

    # 3. OpenRouter as last fallback (for any model with / in name)
    if "openrouter" in platform_keys and agent_provider != "openrouter":
        or_cfg = platform_keys["openrouter"]
        or_model = model_name if "/" in model_name else None
        if not or_model and matched:
            for rk, provs in MODEL_ROUTES.items():
                if rk in clean.lower():
                    for pn, pm in provs:
                        if pn == "openrouter":
                            or_model = pm
                            break
                    break
        if or_model:
            # Avoid duplicate
            existing_ids = {r.model_id for r in routes}
            if or_model not in existing_ids:
                routes.append(ProviderConfig("openrouter", or_cfg.api_key, None, or_model))

    return routes


def get_all_available_models() -> list[dict]:
    """Вернуть все доступные модели для каталога в UI."""
    keys = get_provider_keys()
    models = []

    for model_key, providers in MODEL_ROUTES.items():
        available = False
        primary_provider = ""
        for prov_name, prov_model_id in providers:
            if prov_name in keys:
                available = True
                primary_provider = prov_name
                break

        if available:
            models.append({
                "id": model_key,
                "provider": primary_provider,
                "routes": len(providers),
            })

    return models
