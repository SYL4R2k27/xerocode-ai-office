from __future__ import annotations

import uuid
from dataclasses import asdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.websocket import ws_manager
from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.agent import Agent
from app.models.message import Message
from app.models.task import Task
from app.models.user import User
from app.schemas.message import UserInput
from app.core.subscription import check_subscription_limits, increment_task_usage
from app.services.cost_tracker import CostTracker
from app.services.supervisor import Supervisor

router = APIRouter(prefix="/orchestration", tags=["Orchestration"])


@router.post("/start/{goal_id}")
async def start_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    🚀 Запустить цель — главная кнопка.

    Supervisor разбивает задачу, распределяет между агентами,
    запускает выполнение. Весь процесс идет с реалтайм уведомлениями.
    """
    # Check subscription limits
    check_subscription_limits(current_user, "create_task")
    await increment_task_usage(current_user, db)

    supervisor = Supervisor(db)
    supervisor.set_ws_callback(ws_manager.broadcast)

    try:
        result = await supervisor.start_goal(goal_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Orchestration error: {str(e)}")


@router.post("/user-input")
async def process_user_input(data: UserInput, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    🎯 Пользователь-дирижер вмешивается в процесс.

    - command: прямое указание команде
    - edit: изменить план
    - idea: предложить идею на обсуждение
    """
    supervisor = Supervisor(db)
    supervisor.set_ws_callback(ws_manager.broadcast)

    try:
        result = await supervisor.process_user_input(
            goal_id=data.goal_id,
            content=data.content,
            input_type=data.input_type,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.get("/status/{goal_id}")
async def goal_status(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    """Полный статус выполнения цели с отчетом по стоимости."""
    # Task stats
    task_result = await db.execute(
        select(Task.status, func.count(Task.id))
        .where(Task.goal_id == goal_id)
        .group_by(Task.status)
    )
    task_stats = dict(task_result.all())

    # Cost report
    tracker = CostTracker(db)
    try:
        report = await tracker.get_report(goal_id)
        cost_data = {
            "total_cost_usd": report.total_cost_usd,
            "total_tokens": report.total_tokens,
            "message_count": report.message_count,
            "exchange_count": report.exchange_count,
            "cost_by_agent": report.cost_by_agent,
            "limit_reached": report.limit_reached,
            "remaining_exchanges": report.remaining_exchanges,
            "economy_mode": report.economy_mode,
        }
    except ValueError:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Agent statuses
    agent_result = await db.execute(
        select(Agent.id, Agent.name, Agent.status, Agent.total_cost_usd)
        .where(Agent.is_active == True)
    )
    agents = [
        {
            "id": str(row[0]),
            "name": row[1],
            "status": row[2],
            "cost_usd": round(float(row[3]), 6),
        }
        for row in agent_result.all()
    ]

    return {
        "goal_id": str(goal_id),
        "tasks": task_stats,
        "cost": cost_data,
        "agents": agents,
        "ws_connections": ws_manager.stats.get(str(goal_id), 0),
    }


@router.post("/resume/{goal_id}")
async def resume_goal(goal_id: uuid.UUID, db: AsyncSession = Depends(get_db), _user: User = Depends(get_current_user)):
    """
    ▶️ Продолжить выполнение — запустить незавершенные задачи.
    Используется после паузы или после вмешательства пользователя.
    """
    supervisor = Supervisor(db)
    supervisor.set_ws_callback(ws_manager.broadcast)

    try:
        goal = await supervisor._get_goal(goal_id)
        agents = await supervisor._get_active_agents()
        tasks = await supervisor._get_pending_tasks(goal_id)

        if not tasks:
            return {"status": "nothing_to_do", "message": "All tasks completed or no pending tasks"}

        result = await supervisor._execute_tasks(goal, agents, tasks)
        return {"status": "resumed", "execution": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume error: {str(e)}")
