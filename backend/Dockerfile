FROM python:3.12-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY pyproject.toml ./
RUN pip install --no-cache-dir pip setuptools wheel \
    && pip install --no-cache-dir \
    fastapi[standard] uvicorn[standard] gunicorn \
    sqlalchemy[asyncio] asyncpg psycopg2-binary \
    python-jose[cryptography] passlib[bcrypt] \
    httpx pydantic python-multipart \
    alembic aiofiles python-pptx python-docx openpyxl \
    sentry-sdk[fastapi] redis celery \
    fast-bitrix24 aiosmtplib

# App code
COPY app/ ./app/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", \
     "-w", "4", \
     "--timeout", "120", \
     "--access-logfile", "-"]
