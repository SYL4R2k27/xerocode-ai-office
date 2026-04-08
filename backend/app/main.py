from __future__ import annotations

from contextlib import asynccontextmanager

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import admin, agents, analytics, arena, audit, auth, autoprompt, calendar_api, channels, connectors, crm, custom_pools, doc_registry, documents, files, goals, hr, knowledge, messages, orchestration, organization, payments, research, tasks, telegram, templates, voice, workflow
from app.api.websocket import setup_websocket
from app.core.config import settings
from app.core.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables (dev only, use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
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
