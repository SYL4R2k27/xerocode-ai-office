from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.agent import Agent
from app.models.custom_pool import CustomPool
from app.models.user import User
from app.schemas.custom_pool import CustomPoolCreate

router = APIRouter(prefix="/custom-pools", tags=["custom-pools"])

PLAN_LIMITS = {
    "free": {"max_agents": 3, "platform_keys": False},
    "pro": {"max_agents": 10, "platform_keys": True},
    "ultima": {"max_agents": 999, "platform_keys": True},
    "admin": {"max_agents": 999, "platform_keys": True},
}


@router.get("/")
async def list_pools(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CustomPool).where(CustomPool.user_id == current_user.id)
    )
    pools = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "name": p.name,
            "description": p.description,
            "category": p.category,
            "agents_config": p.agents_config,
            "is_active": p.is_active,
            "created_at": str(p.created_at),
        }
        for p in pools
    ]


@router.post("/")
async def create_pool(
    data: CustomPoolCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    limits = PLAN_LIMITS.get(current_user.plan, PLAN_LIMITS["free"])

    # Check agent count
    if len(data.agents_config) > limits["max_agents"]:
        raise HTTPException(
            403,
            f"Ваш план позволяет до {limits['max_agents']} агентов в пуле",
        )

    # Check platform key access
    for agent_cfg in data.agents_config:
        if agent_cfg.api_key_source == "platform" and not limits["platform_keys"]:
            raise HTTPException(
                403,
                "Модели платформы доступны в PRO и ULTIMA подписках",
            )

    pool = CustomPool(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        category=data.category,
        agents_config=[a.model_dump() for a in data.agents_config],
    )
    db.add(pool)
    await db.commit()
    await db.refresh(pool)

    return {
        "id": str(pool.id),
        "name": pool.name,
        "description": pool.description,
        "category": pool.category,
        "agents_config": pool.agents_config,
        "is_active": pool.is_active,
        "created_at": str(pool.created_at),
    }


@router.delete("/{pool_id}")
async def delete_pool(
    pool_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CustomPool).where(
            CustomPool.id == pool_id, CustomPool.user_id == current_user.id
        )
    )
    pool = result.scalar_one_or_none()
    if not pool:
        raise HTTPException(404, "Пул не найден")
    await db.delete(pool)
    await db.commit()
    return {"status": "deleted"}


@router.post("/{pool_id}/activate")
async def activate_pool(
    pool_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.core.config import settings

    result = await db.execute(
        select(CustomPool).where(
            CustomPool.id == pool_id, CustomPool.user_id == current_user.id
        )
    )
    pool = result.scalar_one_or_none()
    if not pool:
        raise HTTPException(404, "Пул не найден")

    platform_keys = {
        "groq": getattr(settings, "groq_api_key", None),
        "openrouter": getattr(settings, "openrouter_api_key", None),
    }

    created_agents = []
    for cfg in pool.agents_config:
        api_key = cfg.get("api_key", "")
        if cfg.get("api_key_source") == "platform":
            provider = cfg.get("provider", "groq")
            api_key = platform_keys.get(provider, platform_keys.get("openrouter", ""))

        if not api_key:
            continue

        agent = Agent(
            name=cfg.get("name", "Agent"),
            role=cfg.get("role", "Assistant"),
            provider=cfg.get("provider", "groq"),
            model_name=cfg.get("model_name", "llama-3.3-70b-versatile"),
            api_key_encrypted=api_key,
            skills=cfg.get("skills", []),
            owner_type="user",
        )
        db.add(agent)
        created_agents.append(agent)

    await db.commit()

    return {
        "status": "activated",
        "agents_created": len(created_agents),
        "agents": [
            {"id": str(a.id), "name": a.name, "provider": a.provider}
            for a in created_agents
        ],
    }
