"""AI Analytics — AI-powered insights from org data."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.task import Task
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.post("/generate")
async def generate_ai_analytics(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate AI-powered analytics report from org data."""
    org_id = user.organization_id
    if not org_id:
        raise HTTPException(400, "Not in organization")

    query_text = data.get("query", "Общий обзор")

    # Collect org data
    members_count = (await db.execute(
        select(func.count()).select_from(User).where(User.organization_id == org_id)
    )).scalar() or 0

    goals_count = (await db.execute(
        select(func.count()).select_from(Goal).join(User, Goal.user_id == User.id).where(User.organization_id == org_id)
    )).scalar() or 0

    tasks_done = (await db.execute(
        select(func.count()).select_from(Task).join(Goal, Task.goal_id == Goal.id).join(User, Goal.user_id == User.id).where(User.organization_id == org_id, Task.status == "done")
    )).scalar() or 0

    tasks_total = (await db.execute(
        select(func.count()).select_from(Task).join(Goal, Task.goal_id == Goal.id).join(User, Goal.user_id == User.id).where(User.organization_id == org_id)
    )).scalar() or 0

    # Build data summary
    data_summary = f"""
Organization: {members_count} members, {goals_count} goals, {tasks_total} tasks ({tasks_done} completed).
Completion rate: {(tasks_done / max(tasks_total, 1) * 100):.0f}%
"""

    # Call AI for insights
    from app.api.routes.documents import _call_ai
    ai_prompt = f"""Based on this organizational data, provide analytics insights in JSON format.

Data:
{data_summary}

User's question: {query_text}

Return JSON:
{{
  "title": "report title",
  "insights": ["insight1", "insight2", ...],
  "metrics": [{{"label": "Metric Name", "value": "42", "trend": "up|down|stable"}}],
  "recommendations": ["rec1", "rec2"]
}}"""

    result = await _call_ai("You are a business analytics expert. Return only valid JSON.", ai_prompt)
    if not result:
        return {"insights": ["Недостаточно данных для анализа"], "metrics": [], "recommendations": []}

    from app.api.routes.documents import _parse_ai_json
    parsed = _parse_ai_json(result)
    if parsed:
        return parsed
    return {"insights": [result[:500]], "metrics": [], "recommendations": []}


@router.post("/copilot")
async def ai_copilot_hint(
    data: dict,
    user=Depends(get_current_user),
):
    """Get contextual AI hint for current page."""
    page = data.get("page", "dashboard")
    context = data.get("context", "")

    from app.api.routes.documents import _call_ai
    prompt = f"""You are an AI assistant for a business platform. The user is on the "{page}" page.
Context: {context[:200]}
Give ONE concise, actionable tip (1-2 sentences) in Russian that would help them be more productive on this page.
Return plain text, not JSON."""

    result = await _call_ai("You are a helpful productivity assistant. Be concise.", prompt)
    return {"hint": result or "Используйте AI для автоматизации рутинных задач."}
