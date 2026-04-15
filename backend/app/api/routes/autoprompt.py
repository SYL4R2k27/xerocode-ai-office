from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db

router = APIRouter(prefix="/autoprompt", tags=["Autoprompt"])


class EnhanceRequest(BaseModel):
    text: str
    category: str = "general"


class EnhanceResponse(BaseModel):
    enhanced: str


@router.post("/enhance", response_model=EnhanceResponse)
async def enhance_prompt(
    data: EnhanceRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Улучшает пользовательский промпт с помощью ИИ."""
    import httpx
    from app.core.config import settings
    from app.core.ai_key_resolver import resolve_key

    # Gate: any accessible provider
    has_any = False
    for prov in ("groq", "openrouter"):
        try:
            await resolve_key(db, user, prov)
            has_any = True
            break
        except Exception:
            continue
    if not has_any:
        raise HTTPException(403, "Auto-prompt недоступен: добавьте BYOK или повысьте подписку.")

    system = f"""You are a prompt engineer for an AI team orchestration platform.
The user wants to give a task to a team of AI agents. Category: {data.category}.
Improve their prompt to be:
- More specific and actionable
- Include success criteria
- Break down into clear requirements
- Keep the same language (Russian if input is Russian)
- Add structure (numbered items or sections)
- Max 300 words

Return ONLY the improved prompt, no explanations."""

    try:
        proxy = getattr(settings, "api_proxy", None)
        async with httpx.AsyncClient(timeout=10.0, proxy=proxy) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": data.text},
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            result = resp.json()
            enhanced = result["choices"][0]["message"]["content"]
            return EnhanceResponse(enhanced=enhanced)
    except Exception:
        # Фолбэк: возвращаем оригинал
        return EnhanceResponse(enhanced=data.text)
