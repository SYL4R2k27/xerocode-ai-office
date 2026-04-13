"""
Deep Research Service — iterative multi-model search engine.

Flow: query expansion → iterative search via Perplexity/OpenRouter → analysis → refine → Model Council → Sparkpage
"""
from __future__ import annotations

import asyncio
import json
import logging
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.research import ResearchSession, ResearchSource

logger = logging.getLogger(__name__)


async def _call_ai(system_prompt: str, user_prompt: str, model: str | None = None, max_tokens: int = 4000, temperature: float = 0.7) -> tuple[str | None, int, float]:
    """Call AI model with fallback chain. Returns (content, tokens, cost_usd)."""
    import httpx

    proxy = getattr(settings, "api_proxy", None)
    providers = []

    # Perplexity via OpenRouter (best for search)
    if model and "sonar" in model and getattr(settings, "openrouter_api_key", None):
        providers.append({
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "key": settings.openrouter_api_key,
            "model": f"perplexity/{model}",
            "name": f"Perplexity/{model}",
        })

    # OpenRouter Claude (for analysis/synthesis)
    if getattr(settings, "openrouter_api_key", None):
        providers.append({
            "url": "https://openrouter.ai/api/v1/chat/completions",
            "key": settings.openrouter_api_key,
            "model": model or "anthropic/claude-sonnet-4-20250514",
            "name": "OpenRouter",
        })

    # Groq fallback (free)
    if getattr(settings, "groq_api_key", None):
        providers.append({
            "url": "https://api.groq.com/openai/v1/chat/completions",
            "key": settings.groq_api_key,
            "model": "llama-3.3-70b-versatile",
            "name": "Groq/Llama",
        })

    for provider in providers:
        try:
            use_proxy = bool(proxy)
            transport = httpx.AsyncHTTPTransport(proxy=proxy) if use_proxy else None
            async with httpx.AsyncClient(transport=transport, timeout=60) as client:
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
                        "temperature": temperature,
                        "max_tokens": max_tokens,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    usage = data.get("usage", {})
                    tokens = usage.get("total_tokens", 0)
                    cost = 0.0
                    logger.info(f"[Research] AI call via {provider['name']}: {tokens} tokens")
                    return content, tokens, cost
                logger.warning(f"[Research] {provider['name']} failed: {resp.status_code}")
        except Exception as e:
            logger.error(f"[Research] {provider['name']} error: {e}")

    return None, 0, 0.0


def _parse_json(text: str) -> Any:
    """Parse JSON from AI response, handling markdown fences."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON in text
        for start in ("{", "["):
            idx = text.find(start)
            if idx >= 0:
                try:
                    return json.loads(text[idx:])
                except json.JSONDecodeError:
                    continue
    return None


async def _update_progress(db: AsyncSession, session_id, status: str, progress: float, message: str):
    """Update session progress in DB."""
    await db.execute(
        update(ResearchSession)
        .where(ResearchSession.id == session_id)
        .values(status=status, progress=progress, progress_message=message)
    )
    await db.commit()


async def run_deep_research(
    db: AsyncSession,
    session_id: str,
    query: str,
    params: dict,
    ws_callback=None,
) -> dict:
    """
    Run iterative deep research.

    Params:
      depth: quick (1 iter) | standard (2 iter) | deep (3-4 iter)
      sources_count: 5 | 10 | 25 | 50
      language: ru | en | multilingual
      use_council: bool (default true for deep)
    """
    depth = params.get("depth", "standard")
    language = params.get("language", "ru")
    use_council = params.get("use_council", depth == "deep")
    max_iterations = {"quick": 1, "standard": 2, "deep": 4}.get(depth, 2)

    total_tokens = 0
    total_cost = 0.0
    all_sources = []
    iteration_results = []

    async def notify(status, progress, message):
        await _update_progress(db, session_id, status, progress, message)
        if ws_callback:
            await ws_callback({
                "event": "research_progress",
                "data": {"session_id": str(session_id), "status": status, "progress": progress, "message": message},
            })

    try:
        # Phase 1: Query Expansion
        await notify("searching", 0.05, "Анализирую запрос...")

        expand_prompt = f"""You are a research query expander. Given a research question, generate 3-5 specific sub-queries
that would help comprehensively answer the main question. Each sub-query should explore a different angle.

Main question: {query}
Language for sub-queries: {language}

Return JSON: {{"sub_queries": ["query1", "query2", ...]}}"""

        expansion, tokens, cost = await _call_ai(
            "You are a research assistant. Return only valid JSON.",
            expand_prompt,
            temperature=0.3,
        )
        total_tokens += tokens
        total_cost += cost

        sub_queries = [query]
        if expansion:
            parsed = _parse_json(expansion)
            if parsed and "sub_queries" in parsed:
                sub_queries = [query] + parsed["sub_queries"][:4]

        # Phase 2: Iterative Search
        for iteration in range(max_iterations):
            progress_base = 0.1 + (iteration / max_iterations) * 0.5
            await notify("searching", progress_base, f"Итерация {iteration + 1}/{max_iterations}: поиск...")

            # Search via Perplexity sonar
            search_query = sub_queries[iteration % len(sub_queries)] if iteration < len(sub_queries) else query
            if iteration > 0 and iteration_results:
                # Refine query based on gaps
                search_query = f"{search_query}. Additionally investigate: {iteration_results[-1].get('gaps', '')}"

            search_prompt = f"""Research this topic thoroughly and provide detailed findings with sources.
Topic: {search_query}
Language: {language}
Provide specific facts, statistics, expert opinions, and cite your sources with URLs."""

            search_result, tokens, cost = await _call_ai(
                "You are a thorough research analyst. Provide detailed, factual information with source citations.",
                search_prompt,
                model="sonar-pro",
                max_tokens=4000,
                temperature=0.3,
            )
            total_tokens += tokens
            total_cost += cost

            if not search_result:
                continue

            # Analyze findings & extract sources
            await notify("analyzing", progress_base + 0.03, f"Итерация {iteration + 1}: анализ...")

            analysis_prompt = f"""Analyze these research findings and extract:
1. Key facts and insights (bullet points)
2. Sources mentioned (extract URLs if any)
3. Knowledge gaps that need further investigation

Findings:
{search_result[:3000]}

Return JSON:
{{
  "key_findings": ["finding1", "finding2", ...],
  "sources": [{{"title": "...", "url": "...", "snippet": "..."}}],
  "gaps": "what else needs to be researched",
  "confidence": 0.0-1.0
}}"""

            analysis, tokens, cost = await _call_ai(
                "You are a research analyst. Return only valid JSON.",
                analysis_prompt,
                temperature=0.2,
            )
            total_tokens += tokens
            total_cost += cost

            iter_data = {"raw": search_result[:2000], "findings": [], "sources": [], "gaps": ""}
            if analysis:
                parsed = _parse_json(analysis)
                if parsed:
                    iter_data["findings"] = parsed.get("key_findings", [])
                    iter_data["gaps"] = parsed.get("gaps", "")
                    for src in parsed.get("sources", []):
                        if isinstance(src, dict) and src.get("title"):
                            all_sources.append(src)

            iteration_results.append(iter_data)

        # Phase 3: Synthesis
        await notify("analyzing", 0.65, "Синтезирую результаты...")

        all_findings = []
        for ir in iteration_results:
            all_findings.extend(ir.get("findings", []))
            if ir.get("raw"):
                all_findings.append(ir["raw"][:500])

        synthesis_prompt = f"""Based on extensive research, create a comprehensive report.

Original question: {query}
Language: {language}

Research findings:
{json.dumps(all_findings[:30], ensure_ascii=False)[:6000]}

Sources found: {len(all_sources)}

Create a structured report with:
1. Executive Summary (2-3 paragraphs)
2. 3-6 main sections with detailed analysis
3. Each section should reference sources by index [1], [2], etc.
4. Conclusions and recommendations

Return JSON:
{{
  "summary": "executive summary text",
  "sections": [
    {{"title": "Section Title", "content": "detailed content with [1] citations", "source_indices": [0, 1]}}
  ],
  "conclusions": "key conclusions",
  "confidence_score": 0.0-1.0
}}"""

        synthesis, tokens, cost = await _call_ai(
            "You are an expert research report writer. Create comprehensive, well-structured reports. Return only valid JSON.",
            synthesis_prompt,
            max_tokens=6000,
            temperature=0.4,
        )
        total_tokens += tokens
        total_cost += cost

        report = {"summary": "Research completed", "sections": [], "conclusions": "", "confidence_score": 0.5}
        if synthesis:
            parsed = _parse_json(synthesis)
            if parsed:
                report = parsed

        # Phase 4: Model Council (optional)
        council_votes = []
        if use_council and report.get("sections"):
            await notify("council", 0.75, "Model Council голосует...")

            council_prompt = f"""Rate this research report on a scale of 1-10 for:
- Accuracy (are facts correct?)
- Completeness (are all aspects covered?)
- Clarity (is it well-written?)
- Usefulness (is it actionable?)

Report summary: {report['summary'][:500]}
Sections: {len(report.get('sections', []))}
Sources: {len(all_sources)}

Return JSON: {{"accuracy": 8, "completeness": 7, "clarity": 9, "usefulness": 8, "overall": 8, "reasoning": "brief explanation"}}"""

            # Call 3 models in parallel
            council_models = [
                ("groq/llama-3.3-70b-versatile", "Llama 3.3 70B"),
                ("anthropic/claude-sonnet-4-20250514", "Claude Sonnet"),
                (None, "Default Model"),
            ]

            async def council_vote(model_id, model_name):
                result, t, c = await _call_ai(
                    "You are an expert reviewer. Rate research quality. Return only valid JSON.",
                    council_prompt,
                    model=model_id,
                    temperature=0.3,
                )
                if result:
                    parsed = _parse_json(result)
                    if parsed:
                        parsed["model"] = model_name
                        return parsed, t, c
                return None, t, c

            tasks = [council_vote(mid, mname) for mid, mname in council_models]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for r in results:
                if isinstance(r, tuple) and r[0]:
                    council_votes.append(r[0])
                    total_tokens += r[1]
                    total_cost += r[2]

        # Phase 5: Generate Sparkpage HTML
        await notify("generating", 0.85, "Генерирую отчёт...")

        from app.services.sparkpage import generate_sparkpage
        sparkpage_html = generate_sparkpage(query, report, all_sources, council_votes, language)

        # Save results
        now = datetime.utcnow()
        deduplicated_sources = []
        seen_urls = set()
        for s in all_sources:
            url = s.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                deduplicated_sources.append(s)
            elif not url:
                deduplicated_sources.append(s)

        await db.execute(
            update(ResearchSession)
            .where(ResearchSession.id == session_id)
            .values(
                status="completed",
                progress=1.0,
                progress_message="Исследование завершено",
                result_summary=report.get("summary", ""),
                result_sections=report.get("sections", []),
                sources=deduplicated_sources,
                sparkpage_html=sparkpage_html,
                model_council_votes=council_votes,
                iterations_count=len(iteration_results),
                total_tokens=total_tokens,
                total_cost_usd=total_cost,
                completed_at=now,
            )
        )

        # Save individual sources
        for i, src in enumerate(deduplicated_sources):
            source_obj = ResearchSource(
                session_id=session_id,
                url=src.get("url", ""),
                title=src.get("title", f"Source {i + 1}"),
                snippet=src.get("snippet", ""),
                relevance_score=src.get("relevance", 0.5),
            )
            db.add(source_obj)

        await db.commit()

        await notify("completed", 1.0, "Исследование завершено")

        return {
            "status": "completed",
            "summary": report.get("summary", ""),
            "sections_count": len(report.get("sections", [])),
            "sources_count": len(deduplicated_sources),
            "council_votes": council_votes,
            "tokens": total_tokens,
            "cost_usd": total_cost,
        }

    except Exception as e:
        logger.error(f"[Research] Error: {e}", exc_info=True)
        await db.execute(
            update(ResearchSession)
            .where(ResearchSession.id == session_id)
            .values(status="failed", progress_message=str(e)[:200])
        )
        await db.commit()
        if ws_callback:
            await ws_callback({
                "event": "research_progress",
                "data": {"session_id": str(session_id), "status": "failed", "message": str(e)[:200]},
            })
        return {"status": "failed", "error": str(e)}
