from __future__ import annotations

import os

from pydantic import model_validator
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

    # API ключи провайдеров (платформенные)
    groq_api_key: str | None = None
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    openrouter_api_key: str | None = None
    sambanova_api_key: str | None = None
    cerebras_api_key: str | None = None
    together_api_key: str | None = None
    stability_api_key: str | None = None
    apiyi_api_key: str | None = None
    openrouter_fallback_enabled: bool = True
    invite_code: str | None = None  # Бета-тест инвайт код (из .env)

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def validate_secret(self):
        if not self.secret_key or self.secret_key == "change-me-in-production":
            key = os.environ.get("SECRET_KEY")
            if not key:
                raise ValueError(
                    "FATAL: SECRET_KEY must be set in .env. "
                    'Run: python -c "import secrets; print(secrets.token_urlsafe(64))"'
                )
            self.secret_key = key
        return self


settings = Settings()
