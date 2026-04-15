"""Prometheus metrics — exposed at /metrics for scraping."""
from __future__ import annotations

from prometheus_client import Counter, Histogram, Gauge

# Request-level
http_requests_total = Counter(
    "xc_http_requests_total",
    "HTTP requests by method+path+status",
    ["method", "path", "status"],
)
http_request_duration_seconds = Histogram(
    "xc_http_request_duration_seconds",
    "HTTP request duration",
    ["method", "path"],
    buckets=(0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0),
)

# DAG / orchestration
dag_runs_total = Counter(
    "xc_dag_runs_total",
    "DAG orchestration runs by mode and status",
    ["mode", "status"],
)
dag_duration_seconds = Histogram(
    "xc_dag_duration_seconds",
    "DAG run duration by mode",
    ["mode"],
    buckets=(1, 5, 10, 30, 60, 120, 240),
)
dag_tokens_total = Counter(
    "xc_dag_tokens_total",
    "Total tokens consumed by DAG runs",
    ["mode"],
)
dag_cost_usd_total = Counter(
    "xc_dag_cost_usd_total",
    "Total USD cost of DAG runs",
    ["mode"],
)

# AI calls
ai_call_total = Counter(
    "xc_ai_call_total",
    "AI provider calls by provider+source(byok|platform)+status",
    ["provider", "source", "status"],
)

# Auth
auth_login_total = Counter(
    "xc_auth_login_total",
    "Login attempts by method (password/oauth) + status",
    ["method", "status"],
)

# Push
push_sent_total = Counter(
    "xc_push_sent_total",
    "Push notifications sent",
    ["status"],
)

# In-flight
active_dag_runs = Gauge(
    "xc_active_dag_runs",
    "Currently running DAG orchestrations",
)
active_websockets = Gauge(
    "xc_active_websockets",
    "Currently connected WebSocket clients",
)
