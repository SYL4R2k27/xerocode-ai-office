"""API для 5 режимов оркестрации (Manager/Team/Swarm/Auction/XeroCode AI).

POST /api/modes/run       — запустить DAG для запроса, SSE-стрим прогресса и результата
POST /api/modes/cancel    — отменить текущий запуск (через task_id)
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_key_resolver import resolve_key
from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.subscription import check_subscription_limits
from app.services.dag_orchestrator import (
    DAGContext,
    NodeStatus,
    build_auction_dag,
    build_manager_dag,
    build_swarm_dag,
    build_team_dag,
    build_xerocode_dag,
    get_hook_for_mode,
    run_dag,
    MAX_TOKENS_PER_TASK,
    TASK_TIMEOUT_SEC,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/modes", tags=["modes"])

# In-memory task registry for cancellation (prod → Redis)
_active_tasks: dict[str, DAGContext] = {}

VALID_MODES = {"manager", "team", "swarm", "auction", "xerocode_ai"}


def _provider_from_model(model: str) -> str:
    """Infer provider from model name for the key resolver."""
    m = (model or "").lower()
    if "claude" in m:
        return "anthropic"
    if m.startswith("gpt") or "openai" in m:
        return "openai"
    if "gemini" in m or "google" in m:
        return "google"
    if "llama" in m or "groq" in m:
        return "groq"
    return "openrouter"


async def make_ai_caller(db: AsyncSession, user):
    """Closure: AI-вызов с BYOK/plan gates через resolver."""
    proxy = getattr(settings, "api_proxy", None)

    async def _call(system_prompt: str, user_prompt: str, model: str | None, max_tokens: int = 4000):
        target_model = model or "llama-3.3-70b-versatile"
        provider = _provider_from_model(target_model)
        try:
            resolved = await resolve_key(db, user, provider, target_model)
        except HTTPException as e:
            # No key → empty response, DAG treats as failure
            return (f"[{provider} недоступен: {e.detail}]", 0, 0.0)

        url = "https://openrouter.ai/api/v1/chat/completions"
        model_for_api = target_model
        if resolved.source == "byok" and provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"
        elif resolved.source == "platform" and provider != "groq" and provider != "openrouter":
            model_for_api = f"{provider}/{target_model}"
        elif provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"

        transport = httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None
        async with httpx.AsyncClient(transport=transport, timeout=60) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {resolved.key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://xerocode.ru",
                },
                json={
                    "model": model_for_api,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.5,
                },
            )
            if resp.status_code != 200:
                return (f"[HTTP {resp.status_code}]", 0, 0.0)
            data = resp.json()
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            tokens = data.get("usage", {}).get("total_tokens", 0)
            return (content, tokens, 0.0)

    return _call


def _build_dag(body: dict):
    """Factory — строит DAG для выбранного режима."""
    mode = body.get("mode", "xerocode_ai")
    query = body["query"]
    if mode == "manager":
        return mode, build_manager_dag(query, body.get("main_model", "anthropic/claude-sonnet-4"))
    elif mode == "team":
        return mode, build_team_dag(query, body.get("roles", [
            {"role": "architect", "model": "anthropic/claude-sonnet-4"},
            {"role": "executor", "model": "deepseek/deepseek-chat"},
            {"role": "reviewer", "model": "anthropic/claude-sonnet-4"},
        ]))
    elif mode == "swarm":
        return mode, build_swarm_dag(
            query,
            body.get("pool", ["anthropic/claude-sonnet-4", "openai/gpt-4o", "google/gemini-2.5-pro"]),
            body.get("judge_model", "anthropic/claude-sonnet-4"),
        )
    elif mode == "auction":
        return mode, build_auction_dag(
            query,
            body.get("pool", ["anthropic/claude-sonnet-4", "openai/gpt-4o", "deepseek/deepseek-chat"]),
            body.get("judge_model", "anthropic/claude-sonnet-4"),
        )
    elif mode == "xerocode_ai":
        return mode, build_xerocode_dag(query)
    else:
        raise HTTPException(400, f"Unknown mode: {mode}. Valid: {VALID_MODES}")


@router.post("/run")
async def run_mode(
    body: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Запустить один из 5 режимов. Стримит прогресс + финал через SSE.

    Body: {mode, query, main_model?, roles?, pool?, judge_model?}
    """
    check_subscription_limits(user, "create_task")

    query = (body.get("query") or "").strip()
    if not query:
        raise HTTPException(400, "query required")

    mode, nodes = _build_dag(body)

    task_id = str(uuid.uuid4())
    context = DAGContext(
        task_id=task_id,
        user_id=str(user.id),
        mode=mode,
        user_query=query,
    )
    _active_tasks[task_id] = context

    from app.core.metrics import active_dag_runs, dag_runs_total, dag_duration_seconds, dag_tokens_total, dag_cost_usd_total
    active_dag_runs.inc()

    async def event_stream():
        # Handshake
        yield f"data: {json.dumps({'type': 'start', 'task_id': task_id, 'mode': mode, 'nodes': [n.id for n in nodes]})}\n\n"

        try:
            ai_call = await make_ai_caller(db, user)

            async def on_progress(node_id: str, status: NodeStatus):
                # (Нельзя yield напрямую из callback — складываем в очередь.)
                await queue.put({"type": "node_status", "node_id": node_id, "status": status.value})

            queue: asyncio.Queue = asyncio.Queue()

            # Run DAG в фоне, стримим прогресс через queue
            hook = get_hook_for_mode(mode)

            async def runner():
                try:
                    await run_dag(context, nodes, ai_call, on_progress=on_progress, on_hook=hook)
                finally:
                    await queue.put(None)  # sentinel

            task = asyncio.create_task(runner())

            while True:
                item = await queue.get()
                if item is None:
                    break
                yield f"data: {json.dumps(item)}\n\n"

            await task  # propagate exceptions if any

            # Final aggregation — зависит от режима
            final = _extract_final_result(context, mode, nodes)

            # Log to training dataset (for XeroCode AI Phase 2 fine-tune)
            try:
                from app.models.training_log import TrainingLog
                from app.api.routes.training import user_hash
                dag_nodes_meta = [
                    {
                        "id": nid,
                        "model": r.model_used,
                        "tokens": r.tokens_used,
                        "duration": r.duration_sec,
                        "status": r.status.value,
                    }
                    for nid, r in context.results.items()
                ]
                router_decision = None
                if mode == "xerocode_ai" and "xc_router" in context.results:
                    rout = context.results["xc_router"].output or ""
                    router_decision = {"raw": rout[:200]}
                log = TrainingLog(
                    id=uuid.uuid4(),
                    user_hash=user_hash(str(user.id)),
                    mode=mode,
                    user_query=query[:5000],
                    final_response=(final or "")[:10000],
                    dag_nodes=dag_nodes_meta,
                    chosen_models=[r.model_used for r in context.results.values() if r.model_used],
                    router_decision=router_decision,
                    total_tokens=context.total_tokens,
                    total_cost_usd=context.total_cost,
                    duration_sec=context.elapsed_sec(),
                    success=bool(final and not final.startswith("(")),
                )
                db.add(log)
                await db.commit()
                log_id = str(log.id)
            except Exception as log_err:
                logger.warning(f"[Training log] {log_err}")
                log_id = None

            # Push notification if task took >15s (юзер мог отойти)
            if context.elapsed_sec() > 15:
                try:
                    from app.services.push_service import send_push_to_user
                    preview = (final or "").strip()[:120].replace("\n", " ")
                    await send_push_to_user(
                        db, str(user.id),
                        title="XeroCode AI готов",
                        body=preview or "Задача выполнена",
                        url="/",
                        tag=f"task-{task_id[:8]}",
                    )
                except Exception as push_err:
                    logger.warning(f"[Push] {push_err}")

            yield f"data: {json.dumps({'type': 'done', 'task_id': task_id, 'result': final, 'total_tokens': context.total_tokens, 'duration_sec': context.elapsed_sec(), 'log_id': log_id})}\n\n"

        except Exception as e:
            logger.error(f"[Modes] Error: {e}", exc_info=True)
            dag_runs_total.labels(mode=mode, status="error").inc()
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)[:200]})}\n\n"
        else:
            dag_runs_total.labels(mode=mode, status="success").inc()
            dag_duration_seconds.labels(mode=mode).observe(context.elapsed_sec())
            dag_tokens_total.labels(mode=mode).inc(context.total_tokens)
            dag_cost_usd_total.labels(mode=mode).inc(context.total_cost)
        finally:
            active_dag_runs.dec()
            _active_tasks.pop(task_id, None)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _extract_final_result(context: DAGContext, mode: str, nodes) -> str:
    """Вытащить финальный результат по режиму."""
    if mode == "manager":
        r = context.results.get("manager")
        return r.output if r and r.output else "(нет ответа)"
    elif mode == "team":
        # Финальный reviewer — либо team_reviewer_final_*, либо последний team_reviewer_*
        final_reviewers = [n for n in nodes if n.id.startswith("team_reviewer_final_")]
        if final_reviewers:
            r = context.results.get(final_reviewers[-1].id)
        else:
            reviewers = [n for n in nodes if "reviewer" in n.id]
            r = context.results.get(reviewers[-1].id) if reviewers else context.results.get(nodes[-1].id)
        if not r or not r.output:
            return "(нет ответа)"
        # Если ревьюер вернул APPROVE: <текст> — обрезаем префикс
        out = r.output.strip()
        if out.upper().startswith("APPROVE:"):
            return out.split(":", 1)[1].strip()
        return out
    elif mode == "swarm":
        r = context.results.get("swarm_judge")
        return r.output if r and r.output else "(судья не ответил)"
    elif mode == "auction":
        r = context.results.get("auction_winner")
        return r.output if r and r.output else "(победитель аукциона не ответил)"
    elif mode == "xerocode_ai":
        r = context.results.get("xc_voice")
        return r.output if r and r.output else "(голос не сработал)"
    return "(?)"


@router.post("/cancel")
async def cancel_mode(body: dict, user=Depends(get_current_user)):
    task_id = body.get("task_id")
    ctx = _active_tasks.get(task_id)
    if not ctx:
        return {"cancelled": False, "reason": "not found"}
    if ctx.user_id != str(user.id):
        raise HTTPException(403, "not your task")
    ctx.cancelled = True
    return {"cancelled": True}


@router.post("/override")
async def override_mode(body: dict, user=Depends(get_current_user)):
    """User override — текущий запуск получает подсказку/перенаправление."""
    task_id = body.get("task_id")
    message = (body.get("message") or "").strip()
    ctx = _active_tasks.get(task_id)
    if not ctx:
        return {"ok": False, "reason": "not found"}
    if ctx.user_id != str(user.id):
        raise HTTPException(403, "not your task")
    ctx.user_override = message
    return {"ok": True}
