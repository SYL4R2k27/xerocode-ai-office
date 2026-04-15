from __future__ import annotations

from contextlib import asynccontextmanager

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, agents, ai_slides, analytics, arena, audit, auth, autoprompt, byok, calendar_api, channels, companies, connectors, crm, custom_pools, doc_registry, documents, edo, files, goals, google_integration, hr, i18n, knowledge, messages, orchestration, organization, payments, research, slack, stream, tasks, task_templates_api, telegram, templates, voice, workflow
from app.api.websocket import setup_websocket
from app.core.config import settings
from app.core.database import Base, engine, async_session


async def _monthly_usage_reset():
    """Reset monthly usage counters on 1st of each month."""
    import asyncio
    from datetime import datetime, timezone
    from sqlalchemy import update, text

    while True:
        now = datetime.now(timezone.utc)
        if now.day == 1 and now.hour == 0:
            try:
                async with async_session() as db:
                    await db.execute(text("UPDATE users SET tasks_used_this_month = 0"))
                    await db.commit()
                    logging.getLogger("uvicorn.error").info("[Cron] Monthly usage reset completed")
            except Exception as e:
                logging.getLogger("uvicorn.error").error(f"[Cron] Reset failed: {e}")
        await asyncio.sleep(3600)  # check every hour


@asynccontextmanager
async def lifespan(app: FastAPI):
    import asyncio
    # Startup: create tables (dev only, use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Start monthly reset cron
    reset_task = asyncio.create_task(_monthly_usage_reset())

    # Init Sentry if configured
    try:
        from app.core.config import settings
        sentry_dsn = getattr(settings, "sentry_dsn", None)
        if sentry_dsn:
            import sentry_sdk
            sentry_sdk.init(dsn=sentry_dsn, traces_sample_rate=0.2, environment="production")
            logging.getLogger("uvicorn.error").info("[Sentry] Initialized")
    except Exception:
        pass

    yield
    # Shutdown
    reset_task.cancel()
    await engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="AI Office — multi-model orchestration platform. "
    "Connect your AI models, give a task, watch them collaborate.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.allowed_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Webhook-Secret"],
)

# Global error handler — hide stack traces
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logging.getLogger("uvicorn.error").error(f"Unhandled: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# REST Routes
app.include_router(auth.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(agents.router, prefix="/api")
app.include_router(messages.router, prefix="/api")
app.include_router(orchestration.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(payments.router, prefix="/api")
app.include_router(custom_pools.router, prefix="/api")
app.include_router(organization.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(workflow.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(crm.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(autoprompt.router, prefix="/api")
app.include_router(arena.router, prefix="/api")
app.include_router(research.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(telegram.router, prefix="/api")
app.include_router(doc_registry.router, prefix="/api")
app.include_router(channels.router, prefix="/api")
app.include_router(calendar_api.router, prefix="/api")
app.include_router(hr.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(connectors.router, prefix="/api")
app.include_router(stream.router, prefix="/api")
app.include_router(byok.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(edo.router, prefix="/api")
app.include_router(task_templates_api.router, prefix="/api")
app.include_router(ai_slides.router, prefix="/api")
app.include_router(i18n.router, prefix="/api")
app.include_router(slack.router, prefix="/api")
app.include_router(google_integration.router, prefix="/api")

# WebSocket
setup_websocket(app)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
