from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["Payments"])


PLANS = [
    {
        "id": "free",
        "name": "FREE",
        "price_rub": 500,
        "billing": "one_time",
        "features": [
            "50 задач в месяц",
            "3 агента",
            "Свои модели (BYOK)",
            "Конструктор пулов",
            "Tool-calling",
            "Локальный агент",
            "Fallback OpenRouter",
        ],
    },
    {
        "id": "pro",
        "name": "PRO",
        "price_rub": 1990,
        "billing": "monthly",
        "features": [
            "500 задач в месяц",
            "10 агентов",
            "Бесплатный пул моделей",
            "100 изображений / месяц",
            "Готовые пулы под задачи",
            "Всё из FREE",
        ],
    },
    {
        "id": "pro_plus",
        "name": "PRO PLUS",
        "price_rub": 5490,
        "billing": "monthly",
        "features": [
            "2 000 задач в месяц",
            "15 агентов",
            "Средние модели (Haiku, GPT-4.1 mini, Grok Fast)",
            "100K премиум токенов / день",
            "500 изображений + Nano Banana 2",
            "Кастомные пулы",
            "Всё из PRO",
        ],
    },
    {
        "id": "ultima",
        "name": "ULTIMA",
        "price_rub": 34990,
        "billing": "monthly",
        "features": [
            "Безлимитные задачи",
            "Безлимитные агенты",
            "ВСЕ премиум модели без ограничений",
            "GPT-5.4 Pro, Claude Opus 4.6, o3-pro",
            "Безлимитные изображения + Nano Banana Pro",
            "Docker Sandbox",
            "Всё из PRO PLUS",
        ],
    },
    {
        "id": "corporate_5",
        "name": "CORPORATE (5 профилей)",
        "price_rub": 89990,
        "billing": "monthly",
        "features": [
            "5 профилей",
            "Командный дашборд",
            "Роли: руководитель / менеджер / сотрудник",
            "Общие пулы на команду",
            "Ревью workflow (approve/reject)",
            "SSO, Audit log, Webhook",
            "Всё из ULTIMA",
        ],
    },
    {
        "id": "corporate_10",
        "name": "CORPORATE (10 профилей)",
        "price_rub": 359990,
        "billing": "monthly",
        "features": [
            "10 профилей",
            "Командный дашборд",
            "Роли: руководитель / менеджер / сотрудник",
            "Общие пулы на команду",
            "Ревью workflow (approve/reject)",
            "SSO, Audit log, Webhook",
            "Всё из ULTIMA",
        ],
    },
    {
        "id": "corporate_15",
        "name": "CORPORATE (15 профилей)",
        "price_rub": 539990,
        "billing": "monthly",
        "features": [
            "15 профилей",
            "Командный дашборд",
            "Роли: руководитель / менеджер / сотрудник",
            "Общие пулы на команду",
            "Ревью workflow (approve/reject)",
            "SSO, Audit log, Webhook",
            "Всё из ULTIMA",
        ],
    },
    {
        "id": "corporate_20",
        "name": "CORPORATE (20 профилей)",
        "price_rub": 719990,
        "billing": "monthly",
        "features": [
            "20 профилей",
            "Командный дашборд",
            "Роли: руководитель / менеджер / сотрудник",
            "Общие пулы на команду",
            "Ревью workflow (approve/reject)",
            "SSO, Audit log, Webhook",
            "Всё из ULTIMA",
        ],
    },
]


@router.get("/plans")
async def get_plans():
    """Return available subscription plans with prices."""
    return PLANS


@router.post("/create")
async def create_payment():
    """Placeholder for payment integration (YooKassa / Stripe)."""
    return {
        "status": "coming_soon",
        "message": "Payment integration is under development. Contact support for manual plan activation.",
    }
