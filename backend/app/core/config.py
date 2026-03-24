from __future__ import annotations

import secrets
import warnings
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "AI Office"
    debug: bool = False
    host: str = "0.0.0.0"
    port: int = 8000

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_office"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Security
    secret_key: str = "change-me-in-production"
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"

    # API Proxy (for routing API calls through EU)
    api_proxy: str | None = None  # socks5://127.0.0.1:10808

    # Groq (для autoprompt)
    groq_api_key: str | None = None

    # OpenRouter
    openrouter_api_key: str | None = None
    openrouter_fallback_enabled: bool = True

    model_config = {"env_file": ".env", "extra": "ignore"}


def _ensure_persistent_secret_key(s: Settings) -> None:
    """If SECRET_KEY is the default placeholder, generate a secure one and
    persist it to .env so encrypted data survives restarts."""
    if s.secret_key != "change-me-in-production":
        return

    generated = secrets.token_urlsafe(32)
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"

    # Append to .env so it loads automatically next time
    try:
        existing = env_path.read_text() if env_path.exists() else ""
        if "SECRET_KEY" not in existing:
            with env_path.open("a") as f:
                f.write(f"\nSECRET_KEY={generated}\n")
        s.secret_key = generated
        warnings.warn(
            "SECRET_KEY was not set. Generated and saved to .env. "
            "Keep .env safe — it protects all encrypted API keys.",
            stacklevel=2,
        )
    except OSError:
        s.secret_key = generated
        warnings.warn(
            "SECRET_KEY is not set and .env is not writable! "
            "Using auto-generated key — encrypted data will be LOST on restart. "
            "Set SECRET_KEY in your environment for production.",
            stacklevel=2,
        )


settings = Settings()
_ensure_persistent_secret_key(settings)
