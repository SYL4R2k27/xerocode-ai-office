"""XeroCode AI Office — AI Models Catalog.

Catalog of all AI models with cost-tier classification + provider routing.
Used by ai_router.py for selecting which provider to call based on tier.

Reference: BRANDBOOK_FINAL_v3.0.html, Section 25.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.core.plans import CostTier


ProviderName = Literal[
    "anthropic", "openai", "groq", "stability", "openrouter",
    "apiyi", "pollinations", "sambanova", "cerebras",
]


@dataclass(frozen=True)
class ModelEntry:
    """One model in our catalog."""

    id: str                            # Logical name (e.g. "sonnet-4.6")
    cost_tier: CostTier
    kind: Literal["text", "image", "video", "audio", "embedding"]
    # Provider chain — first that has key + responds = used
    providers: list[tuple[ProviderName, str]] = field(default_factory=list)
    # Pricing (USD per 1M tokens for text; per unit for media)
    input_price_usd_per_m: float = 0.0
    output_price_usd_per_m: float = 0.0
    media_price_usd_per_unit: float = 0.0
    # Estimated latency through proxy (ms, p50)
    typical_latency_ms: int = 1500
    # Display
    display_name: str = ""
    description: str = ""


# ──────────────────────────────────────────────────────────────────────
# CATALOG — finalized v3.0
# ──────────────────────────────────────────────────────────────────────

# Format: providers list = preference order (direct first, fallback last)

CATALOG: dict[str, ModelEntry] = {

    # ──────────────────────────────────────────────────────────────
    # T0 · FREE
    # ──────────────────────────────────────────────────────────────
    "llama-3.1-8b": ModelEntry(
        id="llama-3.1-8b",
        cost_tier=CostTier.FREE,
        kind="text",
        providers=[
            ("groq", "llama-3.1-8b-instant"),
            ("openrouter", "meta-llama/llama-3.1-8b-instruct:free"),
            ("apiyi", "llama-3.1-8b-instruct"),
        ],
        typical_latency_ms=85,
        display_name="Llama 3.1 8B Instant",
        description="Самая быстрая модель в мире. ~85мс.",
    ),
    "llama-3.3-70b": ModelEntry(
        id="llama-3.3-70b",
        cost_tier=CostTier.FREE,
        kind="text",
        providers=[
            ("groq", "llama-3.3-70b-versatile"),
            ("sambanova", "Meta-Llama-3.3-70B-Instruct"),
            ("openrouter", "meta-llama/llama-3.3-70b-instruct"),
            ("apiyi", "llama-3-3-70b-instruct"),
        ],
        typical_latency_ms=247,
        display_name="Llama 3.3 70B",
        description="Сбалансированная open-source модель.",
    ),
    "llama-4-maverick": ModelEntry(
        id="llama-4-maverick",
        cost_tier=CostTier.FREE,
        kind="text",
        providers=[
            ("openrouter", "meta-llama/llama-4-maverick"),
            ("apiyi", "llama-4-maverick"),
        ],
        typical_latency_ms=622,
        display_name="Llama 4 Maverick",
        description="Топовая Meta open модель.",
    ),
    "deepseek-v3.2": ModelEntry(
        id="deepseek-v3.2",
        cost_tier=CostTier.FREE,                # Fixed price extremely low
        kind="text",
        providers=[
            ("openrouter", "deepseek/deepseek-chat-v3.1"),
            ("apiyi", "deepseek-v3.2"),
        ],
        typical_latency_ms=1732,
        display_name="DeepSeek V3.2",
        description="Дешёвая китайская модель, MIT-class качество.",
    ),

    # ──────────────────────────────────────────────────────────────
    # T1 · CHEAP
    # ──────────────────────────────────────────────────────────────
    "haiku-4.5": ModelEntry(
        id="haiku-4.5",
        cost_tier=CostTier.CHEAP,
        kind="text",
        providers=[
            ("anthropic", "claude-haiku-4-5-20251001"),
            ("apiyi", "claude-haiku-4-5-20251001"),
        ],
        input_price_usd_per_m=1.0,
        output_price_usd_per_m=5.0,
        typical_latency_ms=712,
        display_name="Claude Haiku 4.5",
        description="Самый быстрый Claude. ~700мс.",
    ),
    "gpt-4o-mini": ModelEntry(
        id="gpt-4o-mini",
        cost_tier=CostTier.CHEAP,
        kind="text",
        providers=[
            ("openai", "gpt-4o-mini"),
            ("apiyi", "gpt-4o-mini"),
        ],
        input_price_usd_per_m=0.15,
        output_price_usd_per_m=0.60,
        typical_latency_ms=800,
        display_name="GPT-4o mini",
        description="Дешёвая OpenAI модель.",
    ),
    "gpt-4.1-mini": ModelEntry(
        id="gpt-4.1-mini",
        cost_tier=CostTier.CHEAP,
        kind="text",
        providers=[
            ("openai", "gpt-4.1-mini"),
            ("apiyi", "gpt-4.1-mini"),
        ],
        input_price_usd_per_m=0.40,
        output_price_usd_per_m=1.60,
        typical_latency_ms=1589,
        display_name="GPT-4.1 mini",
        description="Свежий mini от OpenAI.",
    ),
    "gpt-5.4-mini": ModelEntry(
        id="gpt-5.4-mini",
        cost_tier=CostTier.CHEAP,
        kind="text",
        providers=[
            ("openai", "gpt-5.4-mini"),
            ("apiyi", "gpt-5.4-mini"),
        ],
        input_price_usd_per_m=1.0,
        output_price_usd_per_m=4.0,
        typical_latency_ms=1572,
        display_name="GPT-5.4 mini",
        description="Mini-версия GPT-5.4.",
    ),
    "gemini-2.5-flash": ModelEntry(
        id="gemini-2.5-flash",
        cost_tier=CostTier.CHEAP,
        kind="text",
        providers=[
            ("apiyi", "gemini-2.5-flash"),       # OpenRouter geo-blocked, no direct google
        ],
        input_price_usd_per_m=0.075,
        output_price_usd_per_m=0.30,
        typical_latency_ms=1044,
        display_name="Gemini 2.5 Flash",
        description="Самый дешёвый Gemini.",
    ),

    # ──────────────────────────────────────────────────────────────
    # T2 · STANDARD
    # ──────────────────────────────────────────────────────────────
    "sonnet-4.6": ModelEntry(
        id="sonnet-4.6",
        cost_tier=CostTier.STANDARD,
        kind="text",
        providers=[
            ("anthropic", "claude-sonnet-4-6"),
            ("apiyi", "claude-sonnet-4-6"),
        ],
        input_price_usd_per_m=3.0,
        output_price_usd_per_m=15.0,
        typical_latency_ms=2346,
        display_name="Claude Sonnet 4.6",
        description="⭐ Главная T2. Глубокий анализ + скорость.",
    ),
    "gpt-4.1": ModelEntry(
        id="gpt-4.1",
        cost_tier=CostTier.STANDARD,
        kind="text",
        providers=[
            ("openai", "gpt-4.1"),
            ("apiyi", "gpt-4.1"),
        ],
        input_price_usd_per_m=2.0,
        output_price_usd_per_m=8.0,
        typical_latency_ms=926,
        display_name="GPT-4.1",
        description="⚡ Самая быстрая T2 — 926мс.",
    ),
    "gpt-4o": ModelEntry(
        id="gpt-4o",
        cost_tier=CostTier.STANDARD,
        kind="text",
        providers=[
            ("openai", "gpt-4o"),
            ("apiyi", "gpt-4o"),
        ],
        input_price_usd_per_m=2.5,
        output_price_usd_per_m=10.0,
        typical_latency_ms=1380,
        display_name="GPT-4o",
        description="Multimodal Vision/Text.",
    ),
    "gemini-2.5-pro": ModelEntry(
        id="gemini-2.5-pro",
        cost_tier=CostTier.STANDARD,
        kind="text",
        providers=[
            ("apiyi", "gemini-2.5-pro"),         # OR geo-blocked
        ],
        input_price_usd_per_m=1.25,
        output_price_usd_per_m=5.0,
        typical_latency_ms=1833,
        display_name="Gemini 2.5 Pro",
        description="Большой контекст, multimodal.",
    ),
    "grok-4-fast": ModelEntry(
        id="grok-4-fast",
        cost_tier=CostTier.STANDARD,
        kind="text",
        providers=[
            ("openrouter", "x-ai/grok-4"),
            ("apiyi", "grok-4-1-fast-non-reasoning"),
        ],
        typical_latency_ms=773,
        display_name="Grok 4 Fast",
        description="Быстрый Grok без reasoning.",
    ),

    # ──────────────────────────────────────────────────────────────
    # T3 · PREMIUM
    # ──────────────────────────────────────────────────────────────
    "opus-4.7": ModelEntry(
        id="opus-4.7",
        cost_tier=CostTier.PREMIUM,
        kind="text",
        providers=[
            ("anthropic", "claude-opus-4-7"),
            ("apiyi", "claude-opus-4-6"),         # 4-7 ещё нет в apiyi
        ],
        input_price_usd_per_m=15.0,
        output_price_usd_per_m=75.0,
        typical_latency_ms=1741,
        display_name="Claude Opus 4.7",
        description="⭐ Глубочайший анализ. Премиум.",
    ),
    "gpt-5.4": ModelEntry(
        id="gpt-5.4",
        cost_tier=CostTier.PREMIUM,
        kind="text",
        providers=[
            ("openai", "gpt-5.4"),
            ("apiyi", "gpt-5.4"),
        ],
        input_price_usd_per_m=15.0,
        output_price_usd_per_m=60.0,
        typical_latency_ms=1216,
        display_name="GPT-5.4",
        description="⭐⭐ Самая быстрая T3 — 1.2с.",
    ),
    "gpt-5": ModelEntry(
        id="gpt-5",
        cost_tier=CostTier.PREMIUM,
        kind="text",
        providers=[
            ("openai", "gpt-5"),
            ("apiyi", "gpt-5"),
        ],
        input_price_usd_per_m=10.0,
        output_price_usd_per_m=40.0,
        typical_latency_ms=1288,
        display_name="GPT-5",
        description="Базовая премиум OpenAI.",
    ),
    "grok-4-reasoning": ModelEntry(
        id="grok-4-reasoning",
        cost_tier=CostTier.PREMIUM,
        kind="text",
        providers=[
            ("openrouter", "x-ai/grok-4"),
            ("apiyi", "grok-4-1-fast-reasoning"),
        ],
        typical_latency_ms=2655,
        display_name="Grok 4 Reasoning",
        description="С reasoning chain.",
    ),
    "gemini-3.1-pro": ModelEntry(
        id="gemini-3.1-pro",
        cost_tier=CostTier.PREMIUM,
        kind="text",
        providers=[
            ("apiyi", "gemini-3.1-pro-preview"),
        ],
        typical_latency_ms=41977,                # ⚠️ только для async
        display_name="Gemini 3.1 Pro Preview",
        description="⚠️ Медленный (~42с) — только для deep research.",
    ),

    # ──────────────────────────────────────────────────────────────
    # T4a · IMAGE
    # ──────────────────────────────────────────────────────────────
    "gpt-image-2": ModelEntry(
        id="gpt-image-2",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("openai", "gpt-image-2"),            # ⏳ pending org verification
            ("apiyi", "gpt-image-2"),             # ⚠️ overload sometimes
        ],
        media_price_usd_per_unit=0.17,
        typical_latency_ms=20_000,
        display_name="GPT Image 2",
        description="⭐ Премиум image — text→image, image→image.",
    ),
    "gpt-image-1.5": ModelEntry(
        id="gpt-image-1.5",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("openai", "gpt-image-1.5"),
            ("apiyi", "gpt-image-1.5"),
        ],
        media_price_usd_per_unit=0.10,
        typical_latency_ms=14_834,
        display_name="GPT Image 1.5",
        description="⭐ Работает СЕЙЧАС — primary direct OpenAI.",
    ),
    "gpt-image-1": ModelEntry(
        id="gpt-image-1",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("openai", "gpt-image-1"),
            ("apiyi", "gpt-image-1"),
        ],
        media_price_usd_per_unit=0.04,
        typical_latency_ms=17_560,
        display_name="GPT Image 1",
        description="Дешёвая стандартная.",
    ),
    "dall-e-3": ModelEntry(
        id="dall-e-3",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("openai", "dall-e-3"),
            ("apiyi", "dall-e-3"),
        ],
        media_price_usd_per_unit=0.04,
        typical_latency_ms=14_450,
        display_name="DALL-E 3",
        description="Легаси OpenAI image.",
    ),
    "stability-sd35-ultra": ModelEntry(
        id="stability-sd35-ultra",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("stability", "stable-image-ultra"),
        ],
        media_price_usd_per_unit=0.08,
        typical_latency_ms=8_000,
        display_name="Stability SD 3.5 Ultra",
        description="Топ open-source качество.",
    ),
    "flux-2-pro": ModelEntry(
        id="flux-2-pro",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("apiyi", "flux-2-pro"),
        ],
        media_price_usd_per_unit=0.05,
        typical_latency_ms=8_650,
        display_name="Flux 2 Pro",
        description="Photorealism.",
    ),
    "flux-kontext-pro": ModelEntry(
        id="flux-kontext-pro",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("apiyi", "flux-kontext-pro"),
        ],
        media_price_usd_per_unit=0.05,
        typical_latency_ms=10_100,
        display_name="Flux Kontext Pro",
        description="Контекстная генерация.",
    ),
    "nano-banana-pro": ModelEntry(
        id="nano-banana-pro",
        cost_tier=CostTier.MEDIA,
        kind="image",
        providers=[
            ("apiyi", "nano-banana-pro"),
            ("openrouter", "google/gemini-2.5-flash-image"),
        ],
        media_price_usd_per_unit=0.03,
        typical_latency_ms=19_409,
        display_name="Nano Banana Pro",
        description="Gemini Flash image — дешёвая, качественная.",
    ),
    "pollinations-flux": ModelEntry(
        id="pollinations-flux",
        cost_tier=CostTier.FREE,                  # бесплатно!
        kind="image",
        providers=[
            ("pollinations", "flux"),
        ],
        media_price_usd_per_unit=0.0,
        typical_latency_ms=320,
        display_name="Pollinations FLUX",
        description="Free fallback. Просто работает.",
    ),

    # ──────────────────────────────────────────────────────────────
    # T4b · VIDEO (apiyi only)
    # ──────────────────────────────────────────────────────────────
    "veo-3.1-fast": ModelEntry(
        id="veo-3.1-fast",
        cost_tier=CostTier.MEDIA,
        kind="video",
        providers=[
            ("apiyi", "veo-3.1-fast"),
        ],
        media_price_usd_per_unit=0.30,            # per second
        typical_latency_ms=120_000,
        display_name="Google Veo 3.1 Fast",
        description="Видео из текста.",
    ),
    "sora-character": ModelEntry(
        id="sora-character",
        cost_tier=CostTier.MEDIA,
        kind="video",
        providers=[
            ("apiyi", "sora-character"),
        ],
        media_price_usd_per_unit=0.50,
        typical_latency_ms=180_000,
        display_name="Sora Character",
        description="OpenAI Sora — character-based.",
    ),

    # ──────────────────────────────────────────────────────────────
    # T4c · AUDIO
    # ──────────────────────────────────────────────────────────────
    "tts-1-hd": ModelEntry(
        id="tts-1-hd",
        cost_tier=CostTier.MEDIA,
        kind="audio",
        providers=[
            ("openai", "tts-1-hd"),
            ("apiyi", "tts-1-hd"),
        ],
        media_price_usd_per_unit=0.030,           # per 1k chars
        typical_latency_ms=2_000,
        display_name="OpenAI TTS-1 HD",
        description="HD-голос синтез.",
    ),
    "whisper-large-v3": ModelEntry(
        id="whisper-large-v3",
        cost_tier=CostTier.FREE,
        kind="audio",
        providers=[
            ("groq", "whisper-large-v3"),
        ],
        typical_latency_ms=1_500,
        display_name="Whisper Large v3",
        description="Speech-to-Text. Бесплатно через Groq.",
    ),
}


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def get_model(model_id: str) -> ModelEntry | None:
    return CATALOG.get(model_id)


def models_by_tier(tier: CostTier) -> list[ModelEntry]:
    return [m for m in CATALOG.values() if m.cost_tier == tier]


def models_by_kind(kind: str) -> list[ModelEntry]:
    return [m for m in CATALOG.values() if m.kind == kind]


def estimate_cost_usd(model: ModelEntry, tokens_in: int = 0, tokens_out: int = 0, units: int = 0) -> float:
    """Calculate approximate cost in USD for a request."""
    cost = 0.0
    if tokens_in:
        cost += tokens_in * model.input_price_usd_per_m / 1_000_000
    if tokens_out:
        cost += tokens_out * model.output_price_usd_per_m / 1_000_000
    if units:
        cost += units * model.media_price_usd_per_unit
    return cost


if __name__ == "__main__":
    print(f"\n📚 XEROCODE Models Catalog · {len(CATALOG)} models\n")
    for tier in CostTier:
        models = models_by_tier(tier)
        if not models:
            continue
        print(f"\n── T{tier.value} · {tier.name} ──")
        for m in models:
            providers = " → ".join(p[0] for p in m.providers)
            print(f"  {m.id:<24}  {m.kind:<8}  {m.typical_latency_ms:>6}ms  [{providers}]")
