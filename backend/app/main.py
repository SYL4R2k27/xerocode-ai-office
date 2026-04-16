from __future__ import annotations

from contextlib import asynccontextmanager

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, agents, ai_slides, analytics, arena, audit, auth, autoprompt, byok, cli_auth, demo, modes, oauth, push, training, calendar_api, channels, companies, connectors, crm, custom_pools, doc_registry, documents, edo, files, goals, google_integration, hr, i18n, knowledge, messages, orchestration, organization, payments, research, slack, stream, tasks, task_templates_api, telegram, templates, voice, workflow
from app.api.websocket import setup_websocket
from app.core.config import settings
from app.core.database import Base, engine, async_session
from app.core.logging_config import setup_logging, gen_correlation_id, correlation_id_var

# Initialize structured logging at import time (before any logger is acquired)
setup_logging()


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

# Sentry (optional) — initialised only if SENTRY_DSN is set
if getattr(settings, "sentry_dsn", None):
    try:
        import sentry_sdk  # type: ignore
        from sentry_sdk.integrations.fastapi import FastApiIntegration  # type: ignore
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration  # type: ignore
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            environment=getattr(settings, "sentry_environment", "production"),
            traces_sample_rate=0.1,
            profiles_sample_rate=0.1,
            integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        )
        logging.getLogger("uvicorn.error").info("[Sentry] Initialized")
    except ImportError:
        logging.getLogger("uvicorn.error").warning("[Sentry] sentry-sdk not installed; skipping")


from app.core.idempotency import IdempotencyMiddleware
app.add_middleware(IdempotencyMiddleware)


@app.get("/metrics", include_in_schema=False)
async def metrics():
    """Prometheus scrape endpoint."""
    from fastapi.responses import Response
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# Metrics middleware — count + time every request
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    import time as _time
    from app.core.metrics import http_requests_total, http_request_duration_seconds
    started = _time.time()
    # Normalize path (strip dynamic IDs to keep cardinality bounded)
    raw_path = request.url.path
    path = raw_path
    # Truncate dynamic segments after /api/<resource>/
    parts = raw_path.split("/")
    if len(parts) >= 4 and parts[1] == "api":
        path = f"/api/{parts[2]}"
        if len(parts) > 3 and not parts[3].startswith("{"):
            # if next looks like UUID/numeric, replace
            seg = parts[3]
            if seg and (len(seg) > 30 or seg.isdigit()):
                path = f"/api/{parts[2]}/<id>"
            else:
                path = f"/api/{parts[2]}/{seg}"
    response = await call_next(request)
    dur = _time.time() - started
    try:
        http_requests_total.labels(method=request.method, path=path, status=str(response.status_code)).inc()
        http_request_duration_seconds.labels(method=request.method, path=path).observe(dur)
    except Exception:
        pass
    return response


# Correlation ID middleware — every request gets a short ID propagated through logs
@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    cid = request.headers.get("x-correlation-id") or gen_correlation_id()
    token = correlation_id_var.set(cid)
    try:
        response = await call_next(request)
        response.headers["X-Correlation-Id"] = cid
        return response
    finally:
        correlation_id_var.reset(token)


# Security headers middleware
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(self), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


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
app.include_router(oauth.router, prefix="/api")
app.include_router(modes.router, prefix="/api")
app.include_router(training.router, prefix="/api")
app.include_router(push.router, prefix="/api")
app.include_router(companies.router, prefix="/api")
app.include_router(edo.router, prefix="/api")
app.include_router(task_templates_api.router, prefix="/api")
app.include_router(ai_slides.router, prefix="/api")
app.include_router(i18n.router, prefix="/api")
app.include_router(slack.router, prefix="/api")
app.include_router(google_integration.router, prefix="/api")
app.include_router(demo.router, prefix="/api")
app.include_router(cli_auth.router, prefix="/api")

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
