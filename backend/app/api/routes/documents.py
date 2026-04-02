"""
AI Document Generation — PPTX, DOCX, XLSX, PDF
Принимает промпт → AI генерирует структуру → библиотека собирает файл.
"""
from __future__ import annotations

import io
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])


# ── Schemas ─────────────────────────────────────────────────────────

class SlideRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000)
    slides_count: int = Field(default=6, ge=2, le=20)
    template: str = Field(default="business")  # business | marketing | education | minimal
    language: str = Field(default="ru")


class DocRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000)
    template: str = Field(default="report")  # report | contract | proposal | brief
    language: str = Field(default="ru")


class SpreadsheetRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000)
    language: str = Field(default="ru")


# ── Color themes ────────────────────────────────────────────────────

THEMES = {
    "business": {
        "bg": "1A1A2E",
        "title_color": "FFFFFF",
        "text_color": "B0B0C8",
        "accent": "818CF8",
        "accent2": "5EEAD4",
    },
    "marketing": {
        "bg": "0F0F11",
        "title_color": "FFFFFF",
        "text_color": "A1A1AA",
        "accent": "F43F5E",
        "accent2": "FBBF24",
    },
    "education": {
        "bg": "0C1222",
        "title_color": "FFFFFF",
        "text_color": "94A3B8",
        "accent": "10B981",
        "accent2": "06B6D4",
    },
    "minimal": {
        "bg": "FFFFFF",
        "title_color": "111111",
        "text_color": "555555",
        "accent": "2563EB",
        "accent2": "7C3AED",
    },
}


# ── PPTX Generation ─────────────────────────────────────────────────

def _generate_pptx_from_structure(slides_data: list[dict], theme_name: str = "business") -> io.BytesIO:
    """Build a PPTX file from structured slide data."""
    from pptx import Presentation
    from pptx.util import Inches, Pt, Emu
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN

    theme = THEMES.get(theme_name, THEMES["business"])
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    for slide_info in slides_data:
        slide_layout = prs.slide_layouts[6]  # Blank layout
        slide = prs.slides.add_slide(slide_layout)

        # Background
        bg = slide.background
        fill = bg.fill
        fill.solid()
        fill.fore_color.rgb = RGBColor.from_string(theme["bg"])

        # Title
        title = slide_info.get("title", "")
        if title:
            txBox = slide.shapes.add_textbox(Inches(0.8), Inches(0.6), Inches(11.5), Inches(1.2))
            tf = txBox.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = title
            p.font.size = Pt(36)
            p.font.bold = True
            p.font.color.rgb = RGBColor.from_string(theme["title_color"])

        # Subtitle
        subtitle = slide_info.get("subtitle", "")
        if subtitle:
            txBox = slide.shapes.add_textbox(Inches(0.8), Inches(1.8), Inches(11.5), Inches(0.8))
            tf = txBox.text_frame
            tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = subtitle
            p.font.size = Pt(18)
            p.font.color.rgb = RGBColor.from_string(theme["accent"])

        # Bullets
        bullets = slide_info.get("bullets", [])
        if bullets:
            y_start = 2.8 if subtitle else 2.2
            txBox = slide.shapes.add_textbox(Inches(1.0), Inches(y_start), Inches(11.0), Inches(4.0))
            tf = txBox.text_frame
            tf.word_wrap = True
            for i, bullet in enumerate(bullets):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                p.text = f"  {bullet}"
                p.font.size = Pt(18)
                p.font.color.rgb = RGBColor.from_string(theme["text_color"])
                p.space_after = Pt(12)

        # Notes
        notes = slide_info.get("notes", "")
        if notes:
            slide.notes_slide.notes_text_frame.text = notes

        # Accent bar at bottom
        from pptx.util import Emu
        shape = slide.shapes.add_shape(
            1,  # Rectangle
            Inches(0), Inches(7.2),
            prs.slide_width, Inches(0.3)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = RGBColor.from_string(theme["accent"])
        shape.line.fill.background()

    buf = io.BytesIO()
    prs.save(buf)
    buf.seek(0)
    return buf


async def _call_ai(system_prompt: str, user_prompt: str, prefer_premium: bool = False) -> str | None:
    """Call AI model with fallback chain: OpenRouter (Claude/GPT) → Groq (Llama)."""
    import httpx
    from app.core.config import settings

    proxy = getattr(settings, "api_proxy", None)

    # Provider chain: direct keys first → OpenRouter → Groq fallback
    providers = []

    # 1. Anthropic direct (Claude Sonnet — лучший для структурированного JSON)
    if prefer_premium and getattr(settings, "anthropic_api_key", None):
        providers.append({
            "url": "https://api.anthropic.com/v1/messages",
            "key": settings.anthropic_api_key,
            "model": "claude-sonnet-4-20250514",
            "name": "Anthropic/Claude",
            "is_anthropic": True,
        })

    # 2. OpenAI direct (GPT-4.1)
    if prefer_premium and getattr(settings, "openai_api_key", None):
        providers.append({
            "url": "https://api.openai.com/v1/chat/completions",
            "key": settings.openai_api_key,
            "model": "gpt-5.4",
            "name": "OpenAI/GPT-5.4",
        })

    # 3. OpenRouter (fallback premium)
    if getattr(settings, "openrouter_api_key", None):
        providers.append({
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "key": settings.openrouter_api_key,
            "model": "anthropic/claude-sonnet-4-20250514",
            "name": "OpenRouter/Claude",
        })

    # 4. Groq (free fallback)
    if getattr(settings, "groq_api_key", None):
        providers.append({
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "key": settings.groq_api_key,
            "model": "llama-3.3-70b-versatile",
            "name": "Groq/Llama",
        })

    for provider in providers:
        try:
            use_proxy = proxy and "groq" not in provider["url"]
            transport = httpx.AsyncHTTPTransport(proxy=proxy) if use_proxy else None
            async with httpx.AsyncClient(transport=transport, timeout=45) as client:

                # Anthropic has a different API format
                if provider.get("is_anthropic"):
                    resp = await client.post(
                        provider["url"],
                        headers={
                            "x-api-key": provider["key"],
                            "anthropic-version": "2023-06-01",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": provider["model"],
                            "max_tokens": 4000,
                            "system": system_prompt,
                            "messages": [{"role": "user", "content": user_prompt}],
                        },
                    )
                    if resp.status_code == 200:
                        content = resp.json()["content"][0]["text"]
                        print(f"[Documents] Generated via {provider['name']}")
                        return content
                else:
                    # OpenAI-compatible (OpenAI, OpenRouter, Groq)
                    resp = await client.post(
                        provider["url"],
                        headers={
                            "Authorization": f"Bearer {provider['key']}",
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://xerocode.space",
                        },
                        json={
                            "model": provider["model"],
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            "temperature": 0.7,
                            "max_tokens": 4000,
                        },
                    )
                    if resp.status_code == 200:
                        content = resp.json()["choices"][0]["message"]["content"]
                        print(f"[Documents] Generated via {provider['name']}")
                        return content

                print(f"[Documents] {provider['name']} failed: {resp.status_code}")
        except Exception as e:
            print(f"[Documents] {provider['name']} error: {e}")

    return None


def _parse_ai_json(content: str) -> any:
    """Parse JSON from AI response, handling markdown fences."""
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)


async def _ai_generate_slides(prompt: str, count: int) -> list[dict]:
    """Generate presentation slides via AI (Claude/GPT preferred)."""
    system_prompt = f"""Ты — эксперт по созданию презентаций. Создай JSON-массив из ровно {count} слайдов.
Каждый слайд: {{"title": "заголовок", "subtitle": "подзаголовок или пусто", "bullets": ["пункт 1", "пункт 2", "пункт 3"], "notes": "заметки для спикера"}}
Первый слайд — титульный. Последний — контакты/CTA.
Текст на русском. Пиши конкретно, с цифрами и фактами где возможно.
Отвечай ТОЛЬКО JSON-массивом."""

    content = await _call_ai(system_prompt, prompt, prefer_premium=True)
    if content:
        try:
            slides = _parse_ai_json(content)
            if isinstance(slides, list) and len(slides) > 0:
                return slides[:count]
        except Exception as e:
            print(f"[Documents] JSON parse error for slides: {e}")

    return _generate_default_slides(prompt, count)


async def _ai_generate_doc(prompt: str) -> tuple[str, list[dict]]:
    """Generate document structure via AI (Claude/GPT preferred)."""
    system_prompt = """Ты — эксперт по созданию документов. Создай JSON:
{"title": "Название документа", "sections": [{"title": "Раздел", "content": "Подробный текст раздела...", "bullets": ["пункт если нужен"]}]}
Минимум 4 раздела. Текст на русском, профессиональный тон.
Отвечай ТОЛЬКО JSON."""

    content = await _call_ai(system_prompt, prompt, prefer_premium=True)
    if content:
        try:
            data = _parse_ai_json(content)
            if isinstance(data, dict) and "sections" in data:
                return data.get("title", prompt[:100]), data["sections"]
        except Exception as e:
            print(f"[Documents] JSON parse error for doc: {e}")

    return _generate_default_doc(prompt)


def _generate_default_slides(prompt: str, count: int) -> list[dict]:
    """Generate slide structure without AI (fallback)."""
    slides = [
        {"title": "XeroCode AI", "subtitle": prompt[:100], "bullets": ["Сгенерировано AI", f"Промпт: {prompt[:60]}..."], "notes": "Титульный слайд"},
    ]
    # Fill remaining slides
    sections = ["Проблема", "Решение", "Как это работает", "Преимущества", "Результаты", "Следующие шаги", "Контакты"]
    for i in range(1, count):
        idx = (i - 1) % len(sections)
        slides.append({
            "title": sections[idx],
            "subtitle": "",
            "bullets": [
                f"Пункт 1 для раздела «{sections[idx]}»",
                f"Пункт 2 — детали и метрики",
                f"Пункт 3 — выводы и действия",
            ],
            "notes": f"Слайд {i + 1}: {sections[idx]}",
        })
    return slides[:count]


# ── DOCX Generation ──────────────────────────────────────────────────

def _generate_docx(title: str, sections: list[dict]) -> io.BytesIO:
    """Build a DOCX from structured sections."""
    from docx import Document
    from docx.shared import Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = Document()

    # Title
    heading = doc.add_heading(title, level=0)
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER

    doc.add_paragraph(f"Дата: {datetime.now().strftime('%d.%m.%Y')}")
    doc.add_paragraph("")

    for section in sections:
        doc.add_heading(section.get("title", ""), level=1)
        content = section.get("content", "")
        if content:
            doc.add_paragraph(content)
        bullets = section.get("bullets", [])
        for b in bullets:
            doc.add_paragraph(b, style="List Bullet")

    # Footer
    doc.add_paragraph("")
    footer = doc.add_paragraph("Сгенерировано XeroCode AI · xerocode.space")
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER

    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf


def _generate_default_doc(prompt: str) -> tuple[str, list[dict]]:
    """Default document structure."""
    return prompt[:100], [
        {"title": "Введение", "content": f"Документ создан по запросу: {prompt}", "bullets": []},
        {"title": "Основная часть", "content": "", "bullets": ["Пункт 1", "Пункт 2", "Пункт 3"]},
        {"title": "Заключение", "content": "Выводы и рекомендации.", "bullets": []},
    ]


# ── XLSX Generation ──────────────────────────────────────────────────

def _generate_xlsx(title: str, headers: list[str], rows: list[list]) -> io.BytesIO:
    """Build an XLSX from data."""
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment

    wb = Workbook()
    ws = wb.active
    ws.title = title[:31]  # max 31 chars

    # Header row
    header_fill = PatternFill(start_color="818CF8", end_color="818CF8", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        ws.column_dimensions[cell.column_letter].width = max(15, len(h) + 5)

    # Data rows
    for r, row_data in enumerate(rows, 2):
        for c, val in enumerate(row_data, 1):
            ws.cell(row=r, column=c, value=val)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return buf


# ── API Endpoints ────────────────────────────────────────────────────

@router.post("/pptx")
async def generate_pptx(
    data: SlideRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a PPTX presentation from a prompt."""
    slides_data = await _ai_generate_slides(data.prompt, data.slides_count)
    buf = _generate_pptx_from_structure(slides_data, data.template)

    filename = f"XeroCode_Slides_{datetime.now().strftime('%Y%m%d_%H%M')}.pptx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/docx")
async def generate_docx(
    data: DocRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate a DOCX document from a prompt."""
    title, sections = await _ai_generate_doc(data.prompt)
    buf = _generate_docx(title, sections)

    filename = f"XeroCode_Doc_{datetime.now().strftime('%Y%m%d_%H%M')}.docx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/xlsx")
async def generate_xlsx(
    data: SpreadsheetRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate an XLSX spreadsheet from a prompt."""
    # Try AI generation
    system_prompt = """Ты — эксперт по таблицам. Создай JSON:
{"title": "Название", "headers": ["Колонка1", "Колонка2"], "rows": [["значение1", "значение2"], ...]}
Минимум 5 строк данных. Числовые значения — числами, не строками.
Отвечай ТОЛЬКО JSON."""

    headers = ["#", "Задача", "Статус", "Приоритет", "Ответственный"]
    rows = [
        [1, "Исследование рынка", "Готово", "Высокий", "AI Agent"],
        [2, "Анализ конкурентов", "В работе", "Средний", "AI Agent"],
        [3, "Подготовка отчёта", "Бэклог", "Высокий", "Оператор"],
    ]
    title = data.prompt[:31]

    content = await _call_ai(system_prompt, data.prompt, prefer_premium=True)
    if content:
        try:
            table_data = _parse_ai_json(content)
            if isinstance(table_data, dict) and "headers" in table_data and "rows" in table_data:
                headers = table_data["headers"]
                rows = table_data["rows"]
                title = table_data.get("title", title)[:31]
        except Exception as e:
            print(f"[Documents] XLSX JSON parse error: {e}")

    buf = _generate_xlsx(title, headers, rows)

    filename = f"XeroCode_Data_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/templates")
async def document_templates():
    """List available document templates."""
    return {
        "pptx": [
            {"id": "business", "name": "Бизнес", "description": "Тёмная тема, фиолетовый акцент"},
            {"id": "marketing", "name": "Маркетинг", "description": "Тёмная тема, розовый акцент"},
            {"id": "education", "name": "Образование", "description": "Тёмная тема, зелёный акцент"},
            {"id": "minimal", "name": "Минимал", "description": "Светлая тема, синий акцент"},
        ],
        "docx": [
            {"id": "report", "name": "Отчёт"},
            {"id": "contract", "name": "Договор"},
            {"id": "proposal", "name": "КП"},
            {"id": "brief", "name": "ТЗ"},
        ],
    }
