"""
Sparkpage — beautiful self-contained HTML research reports.
No external dependencies, inline CSS, print-friendly.
"""
from __future__ import annotations

import html
from datetime import datetime


def generate_sparkpage(
    query: str,
    report: dict,
    sources: list[dict],
    council_votes: list[dict],
    language: str = "ru",
) -> str:
    """Generate a self-contained HTML report."""

    summary = html.escape(report.get("summary", ""))
    conclusions = html.escape(report.get("conclusions", ""))
    sections = report.get("sections", [])
    confidence = report.get("confidence_score", 0)
    date_str = datetime.now().strftime("%d.%m.%Y %H:%M")

    # Build sections HTML
    sections_html = ""
    for i, section in enumerate(sections):
        title = html.escape(section.get("title", f"Section {i + 1}"))
        content = html.escape(section.get("content", ""))
        # Convert [1] references to links
        for j, src in enumerate(sources):
            ref = f"[{j + 1}]"
            if ref in content:
                url = src.get("url", "#")
                content = content.replace(ref, f'<a href="{html.escape(url)}" class="cite" target="_blank">[{j + 1}]</a>')
        # Convert newlines to paragraphs
        paragraphs = content.split("\n")
        content_html = "".join(f"<p>{p}</p>" for p in paragraphs if p.strip())
        sections_html += f"""
        <section class="report-section">
            <h2>{i + 1}. {title}</h2>
            {content_html}
        </section>"""

    # Build sources list
    sources_html = ""
    for i, src in enumerate(sources):
        title = html.escape(src.get("title", f"Source {i + 1}"))
        url = src.get("url", "")
        snippet = html.escape(src.get("snippet", "")[:150])
        url_display = html.escape(url[:60]) if url else ""
        sources_html += f"""
        <li>
            <strong>[{i + 1}]</strong> {title}
            {f'<br><a href="{html.escape(url)}" target="_blank">{url_display}</a>' if url else ''}
            {f'<br><small>{snippet}</small>' if snippet else ''}
        </li>"""

    # Council votes
    council_html = ""
    if council_votes:
        avg_score = sum(v.get("overall", 0) for v in council_votes) / len(council_votes)
        votes_items = ""
        for v in council_votes:
            model = html.escape(v.get("model", "Unknown"))
            score = v.get("overall", 0)
            reasoning = html.escape(v.get("reasoning", "")[:100])
            votes_items += f"""
            <div class="council-vote">
                <div class="vote-model">{model}</div>
                <div class="vote-score">{score}/10</div>
                <div class="vote-reason">{reasoning}</div>
            </div>"""
        council_html = f"""
        <section class="council-section">
            <h2>Model Council</h2>
            <div class="council-avg">Средняя оценка: <strong>{avg_score:.1f}/10</strong></div>
            <div class="council-votes">{votes_items}</div>
        </section>"""

    return f"""<!DOCTYPE html>
<html lang="{language}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>XeroCode Research: {html.escape(query[:80])}</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0f; color: #e4e4e7; line-height: 1.7; }}
.container {{ max-width: 800px; margin: 0 auto; padding: 40px 24px; }}
.header {{ margin-bottom: 48px; }}
.header .badge {{ display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); margin-bottom: 16px; }}
.header h1 {{ font-size: 28px; font-weight: 700; color: #fafafa; line-height: 1.3; margin-bottom: 12px; }}
.header .meta {{ font-size: 13px; color: #71717a; }}
.header .meta span {{ margin-right: 16px; }}
.summary {{ padding: 24px; border-radius: 12px; background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.12); margin-bottom: 40px; font-size: 15px; line-height: 1.8; color: #d4d4d8; }}
.report-section {{ margin-bottom: 36px; }}
.report-section h2 {{ font-size: 20px; font-weight: 600; color: #fafafa; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.06); }}
.report-section p {{ margin-bottom: 12px; font-size: 15px; color: #d4d4d8; }}
.cite {{ color: #60a5fa; text-decoration: none; font-weight: 500; }}
.cite:hover {{ text-decoration: underline; }}
.conclusions {{ padding: 24px; border-radius: 12px; background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.12); margin-bottom: 40px; font-size: 15px; color: #d4d4d8; }}
.conclusions h2 {{ font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 12px; }}
.sources {{ margin-bottom: 40px; }}
.sources h2 {{ font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 16px; }}
.sources ul {{ list-style: none; }}
.sources li {{ padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; }}
.sources li a {{ color: #60a5fa; text-decoration: none; }}
.sources li a:hover {{ text-decoration: underline; }}
.sources li small {{ color: #71717a; }}
.council-section {{ margin-bottom: 40px; }}
.council-section h2 {{ font-size: 18px; font-weight: 600; color: #fafafa; margin-bottom: 16px; }}
.council-avg {{ font-size: 16px; color: #d4d4d8; margin-bottom: 16px; }}
.council-votes {{ display: grid; gap: 12px; }}
.council-vote {{ padding: 16px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); }}
.vote-model {{ font-size: 12px; font-weight: 600; color: #a1a1aa; margin-bottom: 4px; }}
.vote-score {{ font-size: 20px; font-weight: 700; color: #60a5fa; }}
.vote-reason {{ font-size: 13px; color: #71717a; margin-top: 4px; }}
.footer {{ padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: #52525b; text-align: center; }}
.footer a {{ color: #60a5fa; text-decoration: none; }}
@media print {{ body {{ background: #fff; color: #111; }} .header h1 {{ color: #111; }} .report-section h2, .conclusions h2, .sources h2, .council-section h2 {{ color: #111; }} .report-section p, .summary, .conclusions {{ color: #333; }} }}
</style>
</head>
<body>
<div class="container">
    <header class="header">
        <div class="badge">XeroCode Deep Research</div>
        <h1>{html.escape(query)}</h1>
        <div class="meta">
            <span>{date_str}</span>
            <span>{len(sources)} источников</span>
            <span>{len(sections)} разделов</span>
        </div>
    </header>

    <div class="summary">{summary}</div>

    {sections_html}

    {'<div class="conclusions"><h2>Выводы</h2><p>' + conclusions + '</p></div>' if conclusions else ''}

    {council_html}

    <div class="sources">
        <h2>Источники</h2>
        <ul>{sources_html}</ul>
    </div>

    <footer class="footer">
        Создано с помощью <a href="https://xerocode.space" target="_blank">XeroCode AI</a> · Deep Research Engine
    </footer>
</div>
</body>
</html>"""
