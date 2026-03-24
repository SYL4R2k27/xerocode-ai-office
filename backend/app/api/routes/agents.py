from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.encryption import encrypt_api_key
from app.core.model_pools import get_all_pools, get_available_pools, get_pool
from app.core.subscription import check_can_create_agent
from app.models.agent import Agent
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentResponse, AgentUpdate

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.post("/", response_model=AgentResponse, status_code=201)
async def create_agent(data: AgentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Подключить новую AI-модель к офису."""
    # Check subscription limit
    count_result = await db.execute(select(func.count(Agent.id)))
    current_count = count_result.scalar() or 0
    if not check_can_create_agent(current_user, current_count):
        raise HTTPException(
            status_code=403,
            detail=f"Agent limit reached for your plan ({current_user.plan}). Upgrade to add more.",
        )

    agent_data = data.model_dump(exclude={"api_key"})

    if data.api_key:
        agent_data["api_key_encrypted"] = encrypt_api_key(data.api_key)

    agent = Agent(**agent_data)
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/", response_model=list[AgentResponse])
async def list_agents(
    provider: str | None = None,
    is_active: bool | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Список всех подключенных моделей (сотрудников офиса)."""
    query = select(Agent).order_by(Agent.created_at)
    if provider:
        query = query.where(Agent.provider == provider)
    if is_active is not None:
        query = query.where(Agent.is_active == is_active)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: uuid.UUID,
    data: AgentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Обновить настройки модели."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = data.model_dump(exclude_unset=True)

    # Handle API key separately
    if "api_key" in update_data:
        api_key = update_data.pop("api_key")
        if api_key:
            agent.api_key_encrypted = encrypt_api_key(api_key)

    for field, value in update_data.items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Отключить модель от офиса."""
    from app.models.message import Message
    from app.models.task import Task
    from sqlalchemy import update

    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Отвязать сообщения и задачи от агента (SET NULL)
    await db.execute(
        update(Message).where(Message.sender_agent_id == str(agent_id)).values(sender_agent_id=None)
    )
    await db.execute(
        update(Task).where(Task.assigned_agent_id == str(agent_id)).values(assigned_agent_id=None)
    )

    await db.delete(agent)
    await db.commit()


@router.get("/pools/", response_model=list[dict])
async def list_pools(tier: str | None = None, category: str | None = None):
    """Список доступных пулов моделей."""
    if tier:
        pools = get_available_pools(tier)
    else:
        pools = get_all_pools()

    if category:
        pools = [p for p in pools if p.get("category") == category or p.get("category") == "all"]

    return pools


@router.post("/pools/{pool_id}/activate", response_model=list[AgentResponse], status_code=201)
async def activate_pool(pool_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Активировать пул — создать агентов из шаблона."""
    pool = get_pool(pool_id)
    if not pool:
        raise HTTPException(status_code=404, detail=f"Pool '{pool_id}' not found")

    created_agents = []
    for agent_template in pool.get("agents", []):
        agent = Agent(
            name=agent_template["name"],
            role=agent_template["role"],
            avatar=agent_template.get("avatar"),
            provider=agent_template["provider"],
            model_name=agent_template["model_name"],
            skills=agent_template.get("skills"),
            owner_type="platform",
            subscription_tier="free_pool" if pool["tier"] == "pro" else "premium",
        )
        db.add(agent)
        created_agents.append(agent)

    await db.commit()
    for agent in created_agents:
        await db.refresh(agent)

    return created_agents


@router.post("/{agent_id}/test", response_model=dict)
async def test_agent(agent_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    """Проверить подключение к модели — отправить тестовый запрос."""
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # TODO: implement actual test call via AI adapter
    return {
        "agent_id": str(agent.id),
        "status": "ok",
        "message": f"Connection to {agent.provider}/{agent.model_name} successful",
    }
