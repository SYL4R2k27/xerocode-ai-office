"""Deep Research API — iterative multi-model research engine."""
from __future__ import annotations

import asyncio
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.research import ResearchSession, ResearchSource

router = APIRouter(prefix="/research", tags=["research"])


class StartResearchRequest(BaseModel):
    query: str
    depth: str = "standard"  # quick, standard, deep
    language: str = "ru"
    use_council: bool = True


class ResearchSessionResponse(BaseModel):
    id: str
    query: str
    status: str
    progress: float
    progress_message: str
    result_summary: Optional[str] = None
    sources_count: int = 0
    sections_count: int = 0
    iterations_count: float = 0
    total_tokens: float = 0
    total_cost_usd: float = 0
    model_council_votes: Optional[list] = None
    created_at: str
    completed_at: Optional[str] = None


@router.post("/start")
async def start_research(
    req: StartResearchRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new deep research session."""
    session = ResearchSession(
        id=uuid.uuid4(),
        user_id=str(user.id),
        query=req.query,
        params={
            "depth": req.depth,
            "language": req.language,
            "use_council": req.use_council,
        },
        status="pending",
        progress=0.0,
        progress_message="Запуск исследования...",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Run research in background
    from app.services.deep_research import run_deep_research

    async def _run():
        from app.core.database import async_session
        async with async_session() as bg_db:
            await run_deep_research(
                db=bg_db,
                session_id=session.id,
                query=req.query,
                params=session.params or {},
            )

    asyncio.create_task(_run())

    return {
        "id": str(session.id),
        "status": "pending",
        "message": "Research started",
    }


@router.get("/sessions")
async def list_sessions(
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    """List user's research sessions."""
    result = await db.execute(
        select(ResearchSession)
        .where(ResearchSession.user_id == str(user.id))
        .order_by(desc(ResearchSession.created_at))
        .limit(limit)
    )
    sessions = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "query": s.query,
            "status": s.status,
            "progress": s.progress,
            "progress_message": s.progress_message or "",
            "result_summary": (s.result_summary or "")[:200],
            "sources_count": len(s.sources) if s.sources else 0,
            "sections_count": len(s.result_sections) if s.result_sections else 0,
            "iterations_count": s.iterations_count or 0,
            "total_tokens": s.total_tokens or 0,
            "total_cost_usd": s.total_cost_usd or 0,
            "created_at": str(s.created_at) if s.created_at else "",
            "completed_at": str(s.completed_at) if s.completed_at else None,
        }
        for s in sessions
    ]


@router.get("/{session_id}/status")
async def get_status(
    session_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get research session status (poll for progress)."""
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == str(user.id),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": str(session.id),
        "status": session.status,
        "progress": session.progress,
        "progress_message": session.progress_message or "",
    }


@router.get("/{session_id}/result")
async def get_result(
    session_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full research result."""
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == str(user.id),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": str(session.id),
        "query": session.query,
        "status": session.status,
        "summary": session.result_summary,
        "sections": session.result_sections,
        "sources": session.sources,
        "model_council_votes": session.model_council_votes,
        "iterations_count": session.iterations_count,
        "total_tokens": session.total_tokens,
        "total_cost_usd": session.total_cost_usd,
        "created_at": str(session.created_at) if session.created_at else "",
        "completed_at": str(session.completed_at) if session.completed_at else None,
    }


@router.get("/{session_id}/sparkpage", response_class=HTMLResponse)
async def get_sparkpage(
    session_id: str,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get Sparkpage HTML report."""
    result = await db.execute(
        select(ResearchSession).where(
            ResearchSession.id == session_id,
            ResearchSession.user_id == str(user.id),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.sparkpage_html:
        raise HTTPException(status_code=404, detail="Report not ready yet")

    return HTMLResponse(content=session.sparkpage_html)
