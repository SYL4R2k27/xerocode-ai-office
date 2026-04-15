"""Structured JSON logging with correlation IDs.

Set LOG_FORMAT=json in env to enable JSON output (production).
Default text formatter for dev.

Usage in routes:
    logger = logging.getLogger(__name__)
    logger.info("user action", extra={"user_id": "...", "action": "login"})
"""
from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from contextvars import ContextVar
from datetime import datetime, timezone

# Per-request correlation ID
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        cid = correlation_id_var.get()
        if cid:
            payload["correlation_id"] = cid
        # Extra fields passed via extra={} kwarg
        for key, value in record.__dict__.items():
            if key in ("name", "msg", "args", "levelname", "levelno", "pathname", "filename",
                       "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
                       "created", "msecs", "relativeCreated", "thread", "threadName",
                       "processName", "process", "getMessage", "message", "asctime"):
                continue
            try:
                json.dumps(value)
                payload[key] = value
            except (TypeError, ValueError):
                payload[key] = str(value)
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


def setup_logging() -> None:
    """Configure root logger based on LOG_FORMAT env var."""
    fmt = os.environ.get("LOG_FORMAT", "text").lower()
    handler = logging.StreamHandler(sys.stdout)
    if fmt == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        ))
    root = logging.getLogger()
    # Remove any pre-existing handlers (e.g. uvicorn's defaults)
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(os.environ.get("LOG_LEVEL", "INFO").upper())


def gen_correlation_id() -> str:
    """Short hex correlation ID for tracing requests across logs."""
    return uuid.uuid4().hex[:12]
