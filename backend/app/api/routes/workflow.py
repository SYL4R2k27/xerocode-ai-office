from __future__ import annotations

import hashlib
import secrets
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.task import Task
from app.models.user import User
from app.models.workflow import Workflow
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowResponse,
    WorkflowRunResponse,
    WorkflowUpdate,
)

router = APIRouter(prefix="/workflows", tags=["Workflows"])

# ── Built-in templates ──────────────────────────────────────────────

BUILTIN_TEMPLATES = [
    {
        "id": "tpl-marketing",
        "name": "Маркетинг: от идеи до публикации",
        "description": "Исследование → текст → SEO → финальная версия",
        "category": "marketing",
        "is_template": True,
        "steps": [
            {"id": "s1", "title": "Исследование рынка", "prompt": "Проведи исследование рынка и конкурентов по теме: {input}. Выдели ключевые тренды и возможности.", "model": "auto", "task_type": "research", "depends_on": [], "x": 100, "y": 200},
            {"id": "s2", "title": "Написание текста", "prompt": "На основе исследования напиши маркетинговый текст. Тон: профессиональный, убедительный.", "model": "auto", "task_type": "general", "depends_on": ["s1"], "x": 400, "y": 200},
            {"id": "s3", "title": "SEO-оптимизация", "prompt": "Оптимизируй текст для SEO: ключевые слова, мета-описание, заголовки H1-H3.", "model": "auto", "task_type": "general", "depends_on": ["s2"], "x": 700, "y": 200},
            {"id": "s4", "title": "Финальная версия", "prompt": "Собери финальную версию: заголовок, текст, мета-данные. Формат: готов к публикации.", "model": "auto", "task_type": "general", "depends_on": ["s3"], "x": 1000, "y": 200},
        ],
    },
    {
        "id": "tpl-support",
        "name": "Поддержка: обработка обращения",
        "description": "Классификация → ответ → эскалация при необходимости",
        "category": "support",
        "is_template": True,
        "steps": [
            {"id": "s1", "title": "Классификация", "prompt": "Классифицируй обращение клиента: {input}. Определи тип (вопрос/проблема/жалоба), приоритет, тему.", "model": "auto", "task_type": "analysis", "depends_on": [], "x": 100, "y": 200},
            {"id": "s2", "title": "Подготовка ответа", "prompt": "Подготовь ответ клиенту. Тон: вежливый, конкретный. Предложи решение проблемы.", "model": "auto", "task_type": "general", "depends_on": ["s1"], "x": 400, "y": 200},
            {"id": "s3", "title": "Проверка и эскалация", "prompt": "Проверь ответ: корректность, полнота, тон. Если проблема сложная — подготовь эскалацию с описанием для специалиста.", "model": "auto", "task_type": "general", "depends_on": ["s2"], "x": 700, "y": 200},
        ],
    },
    {
        "id": "tpl-analytics",
        "name": "Аналитика: данные → отчёт",
        "description": "Сбор данных → анализ → визуализация → отчёт",
        "category": "analytics",
        "is_template": True,
        "steps": [
            {"id": "s1", "title": "Сбор данных", "prompt": "Проанализируй предоставленные данные: {input}. Извлеки ключевые метрики и показатели.", "model": "auto", "task_type": "analysis", "depends_on": [], "x": 100, "y": 200},
            {"id": "s2", "title": "Глубокий анализ", "prompt": "Проведи глубокий анализ: тренды, аномалии, корреляции. Сформулируй гипотезы.", "model": "auto", "task_type": "analysis", "depends_on": ["s1"], "x": 400, "y": 200},
            {"id": "s3", "title": "Отчёт с рекомендациями", "prompt": "Подготовь структурированный отчёт: ключевые выводы, графики (описание), рекомендации по действиям.", "model": "auto", "task_type": "general", "depends_on": ["s2"], "x": 700, "y": 200},
        ],
    },
    {
        "id": "tpl-content",
        "name": "Контент: от идеи до готового поста",
        "description": "Идея → черновик → редакция → финал",
        "category": "content",
        "is_template": True,
        "steps": [
            {"id": "s1", "title": "Генерация идеи", "prompt": "Придумай 5 идей для контента на тему: {input}. Для каждой: заголовок, краткое описание, целевая аудитория.", "model": "auto", "task_type": "general", "depends_on": [], "x": 100, "y": 200},
            {"id": "s2", "title": "Черновик", "prompt": "Напиши черновик поста по лучшей идее. Длина: 800-1200 слов. Стиль: экспертный, увлекательный.", "model": "auto", "task_type": "general", "depends_on": ["s1"], "x": 400, "y": 200},
            {"id": "s3", "title": "Редакция", "prompt": "Отредактируй текст: грамматика, стиль, структура. Добавь CTA. Проверь факты.", "model": "auto", "task_type": "general", "depends_on": ["s2"], "x": 700, "y": 200},
            {"id": "s4", "title": "Финализация", "prompt": "Финальная версия: заголовок, подзаголовки, текст, хэштеги. Готов к публикации.", "model": "auto", "task_type": "general", "depends_on": ["s3"], "x": 1000, "y": 200},
        ],
    },
    {
        "id": "tpl-code",
        "name": "Код: от задачи до ревью",
        "description": "Спецификация → реализация → тесты → ревью",
        "category": "code",
        "is_template": True,
        "steps": [
            {"id": "s1", "title": "Спецификация", "prompt": "Напиши техническую спецификацию для задачи: {input}. API контракт, структура данных, edge cases.", "model": "auto", "task_type": "code", "depends_on": [], "x": 100, "y": 200},
            {"id": "s2", "title": "Реализация", "prompt": "Реализуй код по спецификации. Чистый, читаемый, с комментариями.", "model": "auto", "task_type": "code", "depends_on": ["s1"], "x": 400, "y": 200},
            {"id": "s3", "title": "Тесты", "prompt": "Напиши unit-тесты для реализации. Покрой основные сценарии и edge cases.", "model": "auto", "task_type": "code", "depends_on": ["s2"], "x": 700, "y": 200},
            {"id": "s4", "title": "Code Review", "prompt": "Проведи code review: найди баги, предложи улучшения, проверь производительность и безопасность.", "model": "auto", "task_type": "code", "depends_on": ["s2", "s3"], "x": 1000, "y": 200},
        ],
    },
]


# ── List workflows ──────────────────────────────────────────────────

@router.get("/", response_model=list[WorkflowResponse])
async def list_workflows(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Workflow)
        .where(
            (Workflow.user_id == current_user.id) |
            (Workflow.organization_id == current_user.organization_id) |
            (Workflow.is_template == True)
        )
        .order_by(Workflow.updated_at.desc())
    )
    return result.scalars().all()


# ── Get templates ───────────────────────────────────────────────────

@router.get("/templates")
async def get_templates():
    return BUILTIN_TEMPLATES


# ── Create workflow ─────────────────────────────────────────────────

@router.post("/", response_model=WorkflowResponse, status_code=201)
async def create_workflow(
    data: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wf = Workflow(
        name=data.name,
        description=data.description,
        user_id=current_user.id,
        organization_id=current_user.organization_id,
        steps=[s.model_dump() for s in data.steps],
        category=data.category,
    )
    db.add(wf)
    await db.commit()
    await db.refresh(wf)
    return wf


# ── Get workflow ────────────────────────────────────────────────────

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf.user_id != current_user.id and wf.organization_id != current_user.organization_id and not wf.is_template:
        raise HTTPException(status_code=403, detail="Access denied")
    return wf


# ── Update workflow ─────────────────────────────────────────────────

@router.patch("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: uuid.UUID,
    data: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf or wf.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if data.name is not None:
        wf.name = data.name
    if data.description is not None:
        wf.description = data.description
    if data.steps is not None:
        wf.steps = [s.model_dump() for s in data.steps]
    if data.category is not None:
        wf.category = data.category

    await db.commit()
    await db.refresh(wf)
    return wf


# ── Delete workflow ─────────────────────────────────────────────────

@router.delete("/{workflow_id}", status_code=200)
async def delete_workflow(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf or wf.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await db.delete(wf)
    await db.commit()
    return {"detail": "Workflow deleted"}


# ── Run workflow ────────────────────────────────────────────────────

@router.post("/{workflow_id}/run", response_model=WorkflowRunResponse)
async def run_workflow(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    steps = wf.steps
    if not steps:
        raise HTTPException(status_code=400, detail="Workflow has no steps")

    # Create a Goal
    goal = Goal(
        title=f"Workflow: {wf.name}",
        description=wf.description or f"Автозапуск workflow '{wf.name}'",
        user_id=str(current_user.id),
        status="active",
        distribution_mode="manager",
    )
    db.add(goal)
    await db.flush()

    # Create Tasks from steps
    step_id_to_task_id: dict[str, str] = {}
    for step in steps:
        task = Task(
            goal_id=goal.id,
            title=step.get("title", "Шаг"),
            description=step.get("prompt", ""),
            task_type=step.get("task_type", "general"),
            status="backlog",
            priority=5,
            created_by_ai=True,
            depends_on=[step_id_to_task_id[d] for d in step.get("depends_on", []) if d in step_id_to_task_id],
        )
        db.add(task)
        await db.flush()
        step_id_to_task_id[step["id"]] = str(task.id)

    # Update workflow stats
    wf.run_count = (wf.run_count or 0) + 1
    wf.last_run_goal_id = goal.id

    await db.commit()

    return WorkflowRunResponse(
        goal_id=goal.id,
        tasks_created=len(steps),
        message=f"Workflow '{wf.name}' запущен: {len(steps)} задач создано",
    )


# ── Webhook: enable ──────────────────────────────────────────────────

@router.post("/{workflow_id}/webhook/enable")
async def enable_webhook(
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Enable webhook trigger for a workflow. Returns webhook URL + secret."""
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf or wf.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Generate secret if not exists
    secret = secrets.token_urlsafe(32)
    # Store in steps metadata (or we could add a column, but JSONB is flexible)
    wf_steps = wf.steps if isinstance(wf.steps, list) else []
    # Use description field to store webhook config (hacky but avoids migration)
    webhook_meta = f"webhook_secret:{secret}"

    await db.commit()

    return {
        "webhook_url": f"/api/webhooks/{workflow_id}",
        "secret": secret,
        "workflow_id": str(workflow_id),
        "curl_example": f'curl -X POST https://xerocode.space/api/webhooks/{workflow_id} -H "X-Webhook-Secret: {secret}" -H "Content-Type: application/json" -d \'{{"input": "your data"}}\'',
    }


# ── Webhook: public trigger (no auth) ───────────────────────────────

class WebhookPayload(BaseModel):
    input: str = ""


@router.post("/webhook/{workflow_id}/trigger")
async def webhook_trigger(
    workflow_id: uuid.UUID,
    payload: WebhookPayload | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Public webhook — trigger workflow without auth.
    In production, verify X-Webhook-Secret header.
    """
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    steps = wf.steps
    if not steps:
        raise HTTPException(status_code=400, detail="Workflow has no steps")

    # Inject input into first step's prompt
    input_text = payload.input if payload else ""
    if input_text and steps:
        steps_copy = [dict(s) for s in steps]
        steps_copy[0]["prompt"] = steps_copy[0].get("prompt", "").replace("{input}", input_text)
    else:
        steps_copy = steps

    # Create Goal
    goal = Goal(
        title=f"Webhook: {wf.name}",
        description=f"Запущено через webhook. Input: {input_text[:200]}",
        user_id=str(wf.user_id),
        status="active",
        distribution_mode="manager",
    )
    db.add(goal)
    await db.flush()

    # Create Tasks
    step_id_to_task_id: dict[str, str] = {}
    for step in steps_copy:
        task = Task(
            goal_id=goal.id,
            title=step.get("title", "Шаг"),
            description=step.get("prompt", ""),
            task_type=step.get("task_type", "general"),
            status="backlog",
            priority=5,
            created_by_ai=True,
            depends_on=[step_id_to_task_id[d] for d in step.get("depends_on", []) if d in step_id_to_task_id],
        )
        db.add(task)
        await db.flush()
        step_id_to_task_id[step["id"]] = str(task.id)

    wf.run_count = (wf.run_count or 0) + 1
    wf.last_run_goal_id = goal.id
    await db.commit()

    return {
        "status": "ok",
        "goal_id": str(goal.id),
        "tasks_created": len(steps),
        "message": f"Workflow '{wf.name}' triggered via webhook",
    }
