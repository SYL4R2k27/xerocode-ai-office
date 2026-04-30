"""AI Slides — generate presentations with AI + images via Pollinations."""
from __future__ import annotations

import io
import json
import urllib.parse

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db

router = APIRouter(prefix="/slides", tags=["ai-slides"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class SlidesGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=2000)
    slides_count: int = Field(default=8, ge=6, le=20)
    theme: str = Field(default="business")  # business | startup | education | minimal
    language: str = Field(default="ru")  # ru | en
    include_images: bool = Field(default=True)


class SlideOutlineRequest(BaseModel):
    topic: str = Field(..., min_length=3, max_length=2000)
    slides_count: int = Field(default=8, ge=6, le=20)
    language: str = Field(default="ru")


# ---------------------------------------------------------------------------
# Theme configs
# ---------------------------------------------------------------------------

THEME_CONFIGS = {
    "business": {
        "bg_color": "1A1A2E",
        "title_color": "FFFFFF",
        "text_color": "E0E0E0",
        "accent_color": "0F3460",
    },
    "startup": {
        "bg_color": "0D1117",
        "title_color": "58A6FF",
        "text_color": "C9D1D9",
        "accent_color": "1F6FEB",
    },
    "education": {
        "bg_color": "FFFFFF",
        "title_color": "1A237E",
        "text_color": "333333",
        "accent_color": "3F51B5",
    },
    "minimal": {
        "bg_color": "FAFAFA",
        "title_color": "212121",
        "text_color": "616161",
        "accent_color": "9E9E9E",
    },
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hex_to_rgbstr(hex_color: str) -> str:
    """Convert hex color string to RGBColor args."""
    return hex_color


def _pollinations_url(prompt: str) -> str:
    """Build Pollinations image URL for a slide."""
    encoded = urllib.parse.quote(prompt, safe="")
    return f"https://image.pollinations.ai/prompt/{encoded}?width=1024&height=576&nologo=true"


async def _generate_slide_structure(topic: str, count: int, language: str, include_images: bool) -> list[dict]:
    """Call AI to generate slide structure as JSON."""
    from app.api.routes.documents import _call_ai, _parse_ai_json

    lang_instruction = "Пиши на русском языке." if language == "ru" else "Write in English."
    image_field = ', "image_prompt": "short English prompt for a relevant photo/illustration (max 15 words)"' if include_images else ""

    system_prompt = f"""You are an expert presentation designer. Generate a JSON array of exactly {count} slides.
Each slide object: {{"title": "slide title", "subtitle": "subtitle or empty string", "bullets": ["point 1", "point 2", "point 3"], "notes": "speaker notes"{image_field}}}
The first slide is the title slide (no bullets, just title and subtitle).
The last slide is a CTA / contacts slide.
{lang_instruction}
Be specific, use numbers and facts where possible.
Respond with ONLY a valid JSON array, no extra text."""

    content = await _call_ai(system_prompt, topic, prefer_premium=True)
    if not content:
        raise HTTPException(status_code=502, detail="AI service unavailable")

    try:
        slides = _parse_ai_json(content)
        if not isinstance(slides, list):
            raise ValueError("Expected list")
        return slides
    except (json.JSONDecodeError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {e}")


def _build_pptx(slides: list[dict], theme: str, include_images: bool, images: dict[int, bytes] | None = None) -> io.BytesIO:
    """Delegate to the premium PPTX builder in documents.py."""
    from app.api.routes.documents import _generate_pptx_from_structure
    # Map ai_slides theme names to documents.py theme names
    theme_map = {"startup": "business", "business": "business", "education": "education", "minimal": "minimal"}
    return _generate_pptx_from_structure(slides, theme_map.get(theme, "business"), images)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate")
async def generate_slides(
    body: SlidesGenerateRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a presentation (PPTX) with AI content and optional images."""
    from app.api.routes.documents import _check_gen_limit
    _check_gen_limit(user)
    slides = await _generate_slide_structure(
        topic=body.topic,
        count=body.slides_count,
        language=body.language,
        include_images=body.include_images,
    )

    # Download images in parallel
    import asyncio
    import httpx
    from app.core.config import settings

    images: dict[int, bytes] = {}
    if body.include_images:
        last_idx = len(slides) - 1

        async def _dl(idx: int, prompt: str):
            proxy = getattr(settings, "api_proxy", None)
            transport = httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None
            encoded = urllib.parse.quote(prompt, safe="")
            url = f"https://image.pollinations.ai/prompt/{encoded}?width=800&height=800&nologo=true&seed={idx}"
            try:
                async with httpx.AsyncClient(transport=transport, timeout=40) as client:
                    resp = await client.get(url)
                    if resp.status_code == 200 and len(resp.content) > 2000:
                        images[idx] = resp.content
            except Exception:
                pass

        tasks = []
        for i, s in enumerate(slides):
            p = s.get("image_prompt", "")
            if p and 0 < i < last_idx:
                tasks.append(_dl(i, p))
        if tasks:
            await asyncio.gather(*tasks)

    buf = _build_pptx(slides, body.theme, body.include_images, images if images else None)

    filename = f"presentation_{body.topic[:30].replace(' ', '_')}.pptx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/outline")
async def generate_outline(
    body: SlideOutlineRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate slide outline only (no PPTX file)."""
    from app.api.routes.documents import _check_gen_limit
    _check_gen_limit(user)
    slides = await _generate_slide_structure(
        topic=body.topic,
        count=body.slides_count,
        language=body.language,
        include_images=False,
    )
    return {"slides": slides, "count": len(slides)}
