"""Streaming AI responses via Server-Sent Events (SSE)."""
from __future__ import annotations

import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.goal import Goal
from app.models.message import Message
from app.models.user import User

router = APIRouter(prefix="/stream", tags=["streaming"])


@router.post("/chat")
async def stream_chat(
    data: dict,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream AI response as Server-Sent Events (SSE).

    Body: {goal_id, prompt, model (optional), provider (optional)}

    Instead of waiting for full response, sends chunks as they arrive.
    Frontend receives: data: {"type": "chunk", "content": "word "}
    Final: data: {"type": "done", "message_id": "..."}
    """
    import httpx

    goal_id = data.get("goal_id")
    prompt = data.get("prompt", "").strip()
    model = data.get("model")
    provider = data.get("provider")

    if not prompt:
        raise HTTPException(400, "Prompt required")

    # Verify goal ownership
    if goal_id:
        goal = (await db.execute(
            select(Goal).where(Goal.id == goal_id, Goal.user_id == str(user.id))
        )).scalar_one_or_none()
        if not goal:
            raise HTTPException(404, "Goal not found")

    # Determine model/provider
    if not model:
        model = "llama-3.3-70b-versatile"
        provider = "groq"

    # Security: check task quota + resolve key via BYOK/plan policy.
    # Resolver raises 403 if user lacks BYOK AND plan doesn't cover the provider/premium model.
    from app.core.subscription import check_subscription_limits
    from app.core.ai_key_resolver import resolve_key
    check_subscription_limits(user, "create_task")

    resolved = await resolve_key(db, user, provider or "groq", model)

    # Build provider config — primary uses resolved key (BYOK or platform).
    # Fallback chain is ONLY appended if the primary was platform-sourced (never when BYOK).
    proxy = getattr(settings, "api_proxy", None)
    providers = []

    primary_provider = provider or "groq"
    if primary_provider == "groq":
        providers.append({
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "key": resolved.key,
            "model": model,
            "source": resolved.source,
        })
    else:
        # Non-groq: if BYOK, hit provider direct; if platform, route through OpenRouter.
        if resolved.source == "byok":
            direct_map = {
                "openai": "https://api.openai.com/v1/chat/completions",
                "anthropic": "https://api.anthropic.com/v1/messages",  # different schema; kept as fallback
                "openrouter": "https://openrouter.ai/api/v1/chat/completions",
            }
            providers.append({
                "url": direct_map.get(primary_provider, "https://openrouter.ai/api/v1/chat/completions"),
                "key": resolved.key,
                "model": model,
                "source": "byok",
            })
        else:
            or_model = f"{primary_provider}/{model}" if primary_provider != "openrouter" else model
            providers.append({
                "url": "https://openrouter.ai/api/v1/chat/completions",
                "key": resolved.key,
                "model": or_model,
                "source": "platform",
            })

    if not providers:
        raise HTTPException(503, "No AI providers configured")

    async def event_stream():
        full_content = ""
        success = False

        for prov in providers:
            try:
                use_proxy = bool(proxy)
                transport = httpx.AsyncHTTPTransport(proxy=proxy) if use_proxy else None

                async with httpx.AsyncClient(transport=transport, timeout=120) as client:
                    async with client.stream(
                        "POST",
                        prov["url"],
                        headers={
                            "Authorization": f"Bearer {prov['key']}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://xerocode.space",
                        },
                        json={
                            "model": prov["model"],
                            "messages": [{"role": "user", "content": prompt}],
                            "stream": True,
                            "temperature": 0.7,
                            "max_tokens": 4000,
                        },
                    ) as response:
                        if response.status_code != 200:
                            continue

                        async for line in response.aiter_lines():
                            if not line.startswith("data: "):
                                continue
                            chunk_data = line[6:]
                            if chunk_data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(chunk_data)
                                delta = chunk.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    full_content += content
                                    yield f"data: {json.dumps({'type': 'chunk', 'content': content})}\n\n"
                            except json.JSONDecodeError:
                                continue

                        success = True
                        break  # Success — don't try next provider

            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Provider error: {str(e)[:100]}'})}\n\n"
                continue

        # Save message to DB
        if full_content and goal_id:
            msg = Message(
                goal_id=goal_id,
                sender_type="agent",
                sender_name=model or "AI",
                content=full_content,
                message_type="chat",
            )
            db.add(msg)
            await db.commit()
            await db.refresh(msg)
            yield f"data: {json.dumps({'type': 'done', 'message_id': str(msg.id)})}\n\n"
        else:
            yield f"data: {json.dumps({'type': 'done', 'message_id': None})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
