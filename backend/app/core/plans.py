"""XeroCode AI Office — Plans & Cost-Tier registry.

Single source of truth for pricing, quotas, model tiers and access control.
Imported everywhere instead of hardcoded dicts.

Reference: BRANDBOOK_FINAL_v3.0.html, Sections 23-24.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Literal


# ──────────────────────────────────────────────────────────────────────
# Cost tiers — model categorization by price
# ──────────────────────────────────────────────────────────────────────


class CostTier(int, Enum):
    """Model cost tier. Higher tier = more expensive = stricter quotas."""

    FREE = 0       # Groq free, Pollinations, DeepSeek free — cost ≈ 0
    CHEAP = 1      # Haiku, gpt-4o-mini, Flash — ~$0.50–5 / 1M tok
    STANDARD = 2   # Sonnet, GPT-4.1, Gemini Pro — ~$10–15 / 1M
    PREMIUM = 3    # Opus, GPT-5, o3, Grok 4 — ~$60–75 / 1M
    MEDIA = 4      # gpt-image-2, Veo, Suno, ElevenLabs — per unit


# ──────────────────────────────────────────────────────────────────────
# Plans
# ──────────────────────────────────────────────────────────────────────


PlanName = Literal["free", "go", "pro", "prime", "enterprise", "enterprise_plus"]


@dataclass(frozen=True)
class PlanQuotas:
    """Monthly quotas per cost tier."""

    # Token quotas (-1 = unlimited, 0 = blocked)
    t0_free_tokens: int = -1          # always ∞
    t1_cheap_tokens: int = 0
    t2_standard_tokens: int = 0
    t3_premium_tokens: int = 0
    # Media quotas (per month)
    t4a_images: int = 0               # gpt-image, flux, dall-e
    t4b_video_seconds: int = 0        # sora, veo, runway
    t4c_audio_minutes: int = 0        # tts, suno, elevenlabs
    # Other AI features
    docs_per_day: int = 0
    deep_research_per_month: int = 0
    parallel_dags: int = 0
    max_output_tokens_per_request: int = 4_000


@dataclass(frozen=True)
class PlanCorpModules:
    """Corporate modules — only on Enterprise+ tiers."""

    crm: bool = False
    channels: bool = False
    team_tasks: bool = False
    hr: bool = False
    rbac_roles: int = 0               # 0 = no RBAC
    edo: bool = False                 # Диадок/СБИС
    integrations_1c: bool = False
    integrations_bitrix: bool = False
    integrations_whatsapp_vk: bool = False


@dataclass(frozen=True)
class PlanWorkspaces:
    """Which workspaces are unlocked."""

    chat: bool = True       # everyone has chat
    text: bool = False
    code: bool = False
    images: Literal["off", "base", "full"] = "off"
    video: bool = False
    sound: bool = False
    corp: bool = False
    orchestration: bool = False


@dataclass(frozen=True)
class PlanInfra:
    """Storage, seats, integrations, support."""

    seats: int = 1                    # -1 = ∞
    extra_seat_price_rub: int | None = None
    storage_mb: int = 100             # -1 = ∞
    history_days: int = 7             # -1 = ∞
    api_requests_per_day: int = 0     # -1 = ∞
    webhooks: int = 0                 # -1 = ∞
    mcp_server: bool = False
    on_premise: bool = False
    sso_saml_ldap: bool = False
    white_label: bool = False
    custom_finetune: bool = False


@dataclass(frozen=True)
class PlanSupport:
    """Support level + SLA."""

    channel: str = "docs"             # docs / email / chat / dedicated
    response_hours: int | None = None # None for "best effort"
    sla_uptime: float | None = None   # 0.995 = 99.5%
    onboarding_sessions: int = 0      # 0 / 1 / 2 / "full"


@dataclass(frozen=True)
class Plan:
    """Complete plan definition. Single source of truth."""

    name: PlanName
    display_name: str
    segment: Literal["b2c", "b2b"]
    audience: str

    price_rub_monthly: int            # 0 for Free
    price_usd_monthly: int            # 0 for Free
    yearly_discount_percent: int = 0  # 0..30
    is_negotiable: bool = False       # True for Enterprise+

    # Worst-case cost analysis (for margin tracking)
    worst_case_cost_rub: int = 0
    target_margin_percent: int = 0

    quotas: PlanQuotas = field(default_factory=PlanQuotas)
    corp: PlanCorpModules = field(default_factory=PlanCorpModules)
    workspaces: PlanWorkspaces = field(default_factory=PlanWorkspaces)
    infra: PlanInfra = field(default_factory=PlanInfra)
    support: PlanSupport = field(default_factory=PlanSupport)

    @property
    def margin_percent(self) -> float:
        """Real-time margin percentage."""
        if self.price_rub_monthly == 0:
            return 0.0
        return (self.price_rub_monthly - self.worst_case_cost_rub) / self.price_rub_monthly * 100


# ──────────────────────────────────────────────────────────────────────
# PLANS — finalized v3.0
# ──────────────────────────────────────────────────────────────────────


PLANS: dict[PlanName, Plan] = {
    # ──────────────── FREE ────────────────
    "free": Plan(
        name="free",
        display_name="Free",
        segment="b2c",
        audience="Попробовать",
        price_rub_monthly=0,
        price_usd_monthly=0,
        worst_case_cost_rub=0,
        target_margin_percent=0,
        quotas=PlanQuotas(
            t1_cheap_tokens=0,
            t2_standard_tokens=0,
            t3_premium_tokens=0,
            t4a_images=0,
            docs_per_day=3,
            deep_research_per_month=0,
            parallel_dags=0,
            max_output_tokens_per_request=4_000,
        ),
        workspaces=PlanWorkspaces(chat=True),
        infra=PlanInfra(
            seats=1,
            storage_mb=100,
            history_days=7,
        ),
        support=PlanSupport(channel="docs"),
    ),

    # ──────────────── GO ────────────────
    "go": Plan(
        name="go",
        display_name="Go",
        segment="b2c",
        audience="Новичок",
        price_rub_monthly=490,
        price_usd_monthly=5,
        yearly_discount_percent=15,
        worst_case_cost_rub=300,
        target_margin_percent=39,
        quotas=PlanQuotas(
            t1_cheap_tokens=200_000,
            t2_standard_tokens=0,
            t3_premium_tokens=0,
            t4a_images=10,
            docs_per_day=10,
            deep_research_per_month=5,
            parallel_dags=1,
            max_output_tokens_per_request=4_000,
        ),
        workspaces=PlanWorkspaces(chat=True, text=True, code=True),
        infra=PlanInfra(
            seats=1,
            storage_mb=2_048,
            history_days=30,
            api_requests_per_day=100,
        ),
        support=PlanSupport(channel="email", response_hours=72),
    ),

    # ──────────────── PRO ────────────────
    "pro": Plan(
        name="pro",
        display_name="Pro",
        segment="b2c",
        audience="Соло-проф",
        price_rub_monthly=1_990,
        price_usd_monthly=19,
        yearly_discount_percent=20,
        worst_case_cost_rub=1_250,
        target_margin_percent=37,
        quotas=PlanQuotas(
            t1_cheap_tokens=-1,            # ∞
            t2_standard_tokens=500_000,
            t3_premium_tokens=50_000,
            t4a_images=30,
            t4b_video_seconds=0,
            t4c_audio_minutes=0,
            docs_per_day=50,
            deep_research_per_month=50,
            parallel_dags=5,
            max_output_tokens_per_request=8_000,
        ),
        workspaces=PlanWorkspaces(
            chat=True, text=True, code=True,
            images="full", orchestration=True,
        ),
        infra=PlanInfra(
            seats=1,
            storage_mb=20_480,
            history_days=-1,
            api_requests_per_day=10_000,
            webhooks=5,
            mcp_server=True,
        ),
        support=PlanSupport(channel="email_priority", response_hours=24, sla_uptime=0.995),
    ),

    # ──────────────── PRIME ────────────────
    "prime": Plan(
        name="prime",
        display_name="Prime",
        segment="b2c",
        audience="Power-user",
        price_rub_monthly=9_990,
        price_usd_monthly=99,
        yearly_discount_percent=25,
        worst_case_cost_rub=6_400,
        target_margin_percent=36,
        quotas=PlanQuotas(
            t1_cheap_tokens=-1,
            t2_standard_tokens=2_000_000,
            t3_premium_tokens=200_000,
            t4a_images=200,
            t4b_video_seconds=20,
            t4c_audio_minutes=3,
            docs_per_day=200,
            deep_research_per_month=300,
            parallel_dags=20,
            max_output_tokens_per_request=16_000,
        ),
        workspaces=PlanWorkspaces(
            chat=True, text=True, code=True,
            images="full", video=True, sound=True,
            orchestration=True,
        ),
        infra=PlanInfra(
            seats=1,
            storage_mb=102_400,
            history_days=-1,
            api_requests_per_day=100_000,
            webhooks=50,
            mcp_server=True,
        ),
        support=PlanSupport(channel="chat", response_hours=8, sla_uptime=0.995, onboarding_sessions=1),
    ),

    # ──────────────── ENTERPRISE ────────────────
    "enterprise": Plan(
        name="enterprise",
        display_name="Enterprise",
        segment="b2b",
        audience="Команда до 10",
        price_rub_monthly=24_990,
        price_usd_monthly=249,
        yearly_discount_percent=25,
        worst_case_cost_rub=15_500,
        target_margin_percent=38,
        quotas=PlanQuotas(
            t1_cheap_tokens=-1,
            t2_standard_tokens=5_000_000,    # shared pool
            t3_premium_tokens=500_000,
            t4a_images=500,
            t4b_video_seconds=60,
            t4c_audio_minutes=10,
            docs_per_day=500,
            deep_research_per_month=1_000,
            parallel_dags=50,
            max_output_tokens_per_request=16_000,
        ),
        corp=PlanCorpModules(
            crm=True, channels=True, team_tasks=True, hr=True,
            rbac_roles=5,
            integrations_1c=True, integrations_bitrix=True,
        ),
        workspaces=PlanWorkspaces(
            chat=True, text=True, code=True,
            images="full", video=True, sound=True,
            corp=True, orchestration=True,
        ),
        infra=PlanInfra(
            seats=10,
            extra_seat_price_rub=4_990,
            storage_mb=204_800,
            history_days=-1,
            api_requests_per_day=100_000,
            webhooks=50,
            mcp_server=True,
        ),
        support=PlanSupport(channel="chat_priority", response_hours=4, sla_uptime=0.999, onboarding_sessions=2),
    ),

    # ──────────────── ENTERPRISE+ ────────────────
    "enterprise_plus": Plan(
        name="enterprise_plus",
        display_name="Enterprise+",
        segment="b2b",
        audience="Корпорация",
        price_rub_monthly=79_990,
        price_usd_monthly=799,
        yearly_discount_percent=25,
        is_negotiable=True,
        worst_case_cost_rub=49_600,
        target_margin_percent=38,
        quotas=PlanQuotas(
            t1_cheap_tokens=-1,
            t2_standard_tokens=-1,
            t3_premium_tokens=-1,
            t4a_images=-1,
            t4b_video_seconds=-1,
            t4c_audio_minutes=-1,
            docs_per_day=-1,
            deep_research_per_month=-1,
            parallel_dags=-1,
            max_output_tokens_per_request=32_000,
        ),
        corp=PlanCorpModules(
            crm=True, channels=True, team_tasks=True, hr=True,
            rbac_roles=-1,
            edo=True,
            integrations_1c=True, integrations_bitrix=True, integrations_whatsapp_vk=True,
        ),
        workspaces=PlanWorkspaces(
            chat=True, text=True, code=True,
            images="full", video=True, sound=True,
            corp=True, orchestration=True,
        ),
        infra=PlanInfra(
            seats=-1,
            storage_mb=-1,
            history_days=-1,
            api_requests_per_day=-1,
            webhooks=-1,
            mcp_server=True,
            on_premise=True,
            sso_saml_ldap=True,
            white_label=True,
            custom_finetune=True,
        ),
        support=PlanSupport(channel="dedicated", response_hours=1, sla_uptime=0.9995, onboarding_sessions=999),
    ),
}


# ──────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────


def get_plan(name: str | None) -> Plan:
    """Get plan by name. Defaults to Free for unknown/None."""
    if not name:
        return PLANS["free"]
    # Backwards compatibility: legacy names mapped to new
    legacy_map = {
        "start": "go",
        "starter": "go",
        "pro_plus": "prime",
        "ultima": "prime",
        "corporate": "enterprise",
        "corporate_plus": "enterprise_plus",
        "business": "enterprise",
    }
    name = legacy_map.get(name.lower(), name.lower())
    return PLANS.get(name, PLANS["free"])


def quota_for_tier(plan: Plan, tier: CostTier) -> int:
    """Return monthly quota for a cost tier. -1 = ∞, 0 = blocked."""
    q = plan.quotas
    if tier == CostTier.FREE:
        return -1                        # always ∞
    if tier == CostTier.CHEAP:
        return q.t1_cheap_tokens
    if tier == CostTier.STANDARD:
        return q.t2_standard_tokens
    if tier == CostTier.PREMIUM:
        return q.t3_premium_tokens
    if tier == CostTier.MEDIA:
        return q.t4a_images              # primary; video/audio handled separately
    return 0


def daily_cap_for_tier(plan: Plan, tier: CostTier) -> int:
    """Daily soft cap = monthly / 12 (anti-burn). -1 = ∞."""
    monthly = quota_for_tier(plan, tier)
    if monthly == -1:
        return -1
    if monthly == 0:
        return 0
    return max(monthly // 12, 1)


def is_workspace_allowed(plan: Plan, workspace: str) -> bool:
    """Check if workspace unlocked for this plan."""
    ws = plan.workspaces
    mapping = {
        "chat": ws.chat,
        "text": ws.text,
        "code": ws.code,
        "images": ws.images != "off",
        "video": ws.video,
        "sound": ws.sound,
        "corp": ws.corp,
        "orchestration": ws.orchestration,
    }
    return mapping.get(workspace, False)


def annual_price_rub(plan: Plan) -> int:
    """Calculate annual price with discount."""
    if plan.is_negotiable or plan.price_rub_monthly == 0:
        return plan.price_rub_monthly * 12
    discount = plan.yearly_discount_percent / 100
    return int(plan.price_rub_monthly * 12 * (1 - discount))


# ──────────────────────────────────────────────────────────────────────
# Quick sanity check (run as module: python -m app.core.plans)
# ──────────────────────────────────────────────────────────────────────


if __name__ == "__main__":
    print(f"{'Plan':<18} {'Price':<10} {'Cost':<10} {'Margin':<8}")
    print("-" * 50)
    for p in PLANS.values():
        margin = f"{p.margin_percent:.1f}%" if p.price_rub_monthly else "—"
        price = f"{p.price_rub_monthly:,}₽" if not p.is_negotiable else f"от {p.price_rub_monthly:,}₽"
        cost = f"{p.worst_case_cost_rub:,}₽" if p.worst_case_cost_rub else "—"
        print(f"{p.display_name:<18} {price:<10} {cost:<10} {margin:<8}")
