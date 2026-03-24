from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.user import User
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse, UserInput

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/", response_model=list[MessageResponse])
async def list_messages(
    goal_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Получить историю чата моделей для конкретной цели."""
    query = (
        select(Message)
        .where(Message.goal_id == goal_id)
        .order_by(Message.created_at)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=MessageResponse, status_code=201)
async def create_message(data: MessageCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Добавить сообщение в чат (используется агентами и системой)."""
    message = Message(**data.model_dump())
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.post("/user-input", response_model=dict)
async def user_input(data: UserInput, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Пользователь-дирижер вмешивается в процесс.

    - command → прямое указание ("Добавьте раздел про риски")
    - edit → изменить существующую задачу
    - idea → предложение для обсуждения
    """
    # Check goal exists
    result = await db.execute(select(Goal).where(Goal.id == data.goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    # Save user message
    message = Message(
        goal_id=data.goal_id,
        sender_type="user",
        sender_name="User",
        content=data.content,
        message_type="user_command",
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)

    # TODO: trigger Supervisor to process user input
    # supervisor.process_user_input(goal_id=data.goal_id, input_text=data.content, input_type=data.input_type)

    return {
        "status": "received",
        "message_id": str(message.id),
        "input_type": data.input_type,
        "detail": "User input received. Supervisor will process it.",
    }
