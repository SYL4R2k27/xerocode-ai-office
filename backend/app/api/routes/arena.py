from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.arena import ArenaBattle, ArenaLeaderboard
from app.models.user import User

router = APIRouter(prefix="/arena", tags=["Arena"])

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BattleCreate(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=10000, examples=["Напиши функцию сортировки на Python"])
    model_a: str = Field(..., max_length=100, examples=["gpt-4o"])
    model_b: str = Field(..., max_length=100, examples=["claude-sonnet-4-20250514"])
    mode: str = Field(default="duel", pattern="^(duel|evolution|tournament|blind)$")


class BattleResponse(BaseModel):
    id: uuid.UUID
    mode: str
    prompt: str
    model_a: str
    model_b: str
    response_a: str | None
    response_b: str | None
    evolution_rounds: dict | None
    tournament_data: dict | None
    status: str
    winner: str | None
    time_a_ms: int | None
    time_b_ms: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BlindBattleResponse(BaseModel):
    """Same as BattleResponse but hides model names until voted."""
    id: uuid.UUID
    mode: str
    prompt: str
    model_a: str  # Will be "Модель 1" before vote
    model_b: str  # Will be "Модель 2" before vote
    response_a: str | None
    response_b: str | None
    evolution_rounds: dict | None
    tournament_data: dict | None
    status: str
    winner: str | None
    time_a_ms: int | None
    time_b_ms: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class VoteRequest(BaseModel):
    winner: str = Field(..., pattern="^(model_a|model_b|draw)$")


class LeaderboardEntry(BaseModel):
    model_name: str
    wins: int
    losses: int
    draws: int
    elo_rating: float
    win_rate: float

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Elo helpers
# ---------------------------------------------------------------------------

def _expected_score(rating_a: float, rating_b: float) -> float:
    return 1.0 / (1.0 + 10 ** ((rating_b - rating_a) / 400.0))


def _update_elo(rating: float, expected: float, actual: float, k: float = 32.0) -> float:
    return rating + k * (actual - expected)


async def _get_or_create_entry(db: AsyncSession, model_name: str) -> ArenaLeaderboard:
    result = await db.execute(
        select(ArenaLeaderboard).where(ArenaLeaderboard.model_name == model_name)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        entry = ArenaLeaderboard(model_name=model_name)
        db.add(entry)
        await db.flush()
    return entry


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/battle", response_model=BattleResponse, status_code=201)
async def create_battle(
    data: BattleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new Arena battle between two models."""
    battle = ArenaBattle(
        prompt=data.prompt,
        model_a=data.model_a,
        model_b=data.model_b,
        mode=data.mode,
        user_id=str(current_user.id),
        status="pending",
    )
    db.add(battle)
    await db.commit()
    await db.refresh(battle)
    return battle


@router.get("/battle/{battle_id}")
async def get_battle(
    battle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get battle status and results. Hides model names for blind mode until voted."""
    result = await db.execute(
        select(ArenaBattle).where(
            ArenaBattle.id == battle_id,
            ArenaBattle.user_id == str(current_user.id),
        )
    )
    battle = result.scalar_one_or_none()
    if battle is None:
        raise HTTPException(status_code=404, detail="Battle not found")

    # For blind mode, hide model names until vote is cast
    if battle.mode == "blind" and battle.status != "voted":
        resp = BlindBattleResponse.model_validate(battle)
        resp.model_a = "Модель 1"
        resp.model_b = "Модель 2"
        return resp

    return BattleResponse.model_validate(battle)


@router.post("/battle/{battle_id}/vote", response_model=BattleResponse)
async def vote_battle(
    battle_id: uuid.UUID,
    vote: VoteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Vote for the winner of a battle. Updates Elo ratings."""
    result = await db.execute(
        select(ArenaBattle).where(
            ArenaBattle.id == battle_id,
            ArenaBattle.user_id == str(current_user.id),
        )
    )
    battle = result.scalar_one_or_none()
    if battle is None:
        raise HTTPException(status_code=404, detail="Battle not found")
    if battle.status == "voted":
        raise HTTPException(status_code=400, detail="Already voted on this battle")

    battle.winner = vote.winner
    battle.status = "voted"

    # Update leaderboard
    entry_a = await _get_or_create_entry(db, battle.model_a)
    entry_b = await _get_or_create_entry(db, battle.model_b)

    expected_a = _expected_score(entry_a.elo_rating, entry_b.elo_rating)
    expected_b = _expected_score(entry_b.elo_rating, entry_a.elo_rating)

    if vote.winner == "model_a":
        entry_a.wins += 1
        entry_b.losses += 1
        entry_a.elo_rating = _update_elo(entry_a.elo_rating, expected_a, 1.0)
        entry_b.elo_rating = _update_elo(entry_b.elo_rating, expected_b, 0.0)
    elif vote.winner == "model_b":
        entry_b.wins += 1
        entry_a.losses += 1
        entry_a.elo_rating = _update_elo(entry_a.elo_rating, expected_a, 0.0)
        entry_b.elo_rating = _update_elo(entry_b.elo_rating, expected_b, 1.0)
    else:  # draw
        entry_a.draws += 1
        entry_b.draws += 1
        entry_a.elo_rating = _update_elo(entry_a.elo_rating, expected_a, 0.5)
        entry_b.elo_rating = _update_elo(entry_b.elo_rating, expected_b, 0.5)

    await db.commit()
    await db.refresh(battle)
    return battle


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def get_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Model rankings sorted by Elo rating."""
    result = await db.execute(
        select(ArenaLeaderboard).order_by(ArenaLeaderboard.elo_rating.desc())
    )
    entries = result.scalars().all()
    out = []
    for e in entries:
        total = e.wins + e.losses + e.draws
        win_rate = (e.wins / total * 100) if total > 0 else 0.0
        out.append(LeaderboardEntry(
            model_name=e.model_name,
            wins=e.wins,
            losses=e.losses,
            draws=e.draws,
            elo_rating=round(e.elo_rating, 1),
            win_rate=round(win_rate, 1),
        ))
    return out


@router.get("/leaderboard/public", response_model=list[LeaderboardEntry])
async def get_public_leaderboard(
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Public leaderboard — no auth required."""
    result = await db.execute(
        select(ArenaLeaderboard).order_by(ArenaLeaderboard.elo_rating.desc()).limit(limit)
    )
    entries = result.scalars().all()
    out = []
    for e in entries:
        total = e.wins + e.losses + e.draws
        win_rate = (e.wins / total * 100) if total > 0 else 0.0
        out.append(LeaderboardEntry(
            model_name=e.model_name,
            wins=e.wins,
            losses=e.losses,
            draws=e.draws,
            elo_rating=round(e.elo_rating, 1),
            win_rate=round(win_rate, 1),
        ))
    return out


@router.get("/recommend")
async def recommend_model(
    task_type: str = Query(default="general"),
    db: AsyncSession = Depends(get_db),
):
    """Recommend best model based on Elo and win rate."""
    result = await db.execute(
        select(ArenaLeaderboard).order_by(ArenaLeaderboard.elo_rating.desc()).limit(5)
    )
    entries = result.scalars().all()
    recommendations = []
    for e in entries:
        total = e.wins + e.losses + e.draws
        win_rate = (e.wins / total * 100) if total > 0 else 0.0
        recommendations.append({
            "model_name": e.model_name,
            "elo_rating": round(e.elo_rating, 1),
            "win_rate": round(win_rate, 1),
            "total_battles": total,
            "reason": f"Elo {round(e.elo_rating)}, {round(win_rate)}% побед в {total} битвах",
        })
    return {"task_type": task_type, "recommendations": recommendations}


@router.get("/history", response_model=list[BattleResponse])
async def get_history(
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User's battle history, newest first."""
    result = await db.execute(
        select(ArenaBattle)
        .where(ArenaBattle.user_id == str(current_user.id))
        .order_by(ArenaBattle.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
