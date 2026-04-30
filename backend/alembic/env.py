import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base
from app.models.user import User
from app.models.goal import Goal
from app.models.task import Task
from app.models.agent import Agent
from app.models.message import Message
from app.models.memory import Memory
from app.models.organization import Organization
from app.models.custom_pool import CustomPool
from app.models.task_template import TaskTemplate
from app.models.audit_log import AuditLog

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

# ALWAYS override URL from settings (alembic.ini may hardcode SQLite default).
# Convert +asyncpg → sync (psycopg2 / pymysql / etc.) — Alembic uses sync drivers.
from app.core.config import settings  # noqa: E402

_db_url = settings.database_url
if "+asyncpg" in _db_url:
    _db_url = _db_url.replace("+asyncpg", "")
elif "+aiosqlite" in _db_url:
    _db_url = _db_url.replace("+aiosqlite", "")
elif "+aiomysql" in _db_url:
    _db_url = _db_url.replace("+aiomysql", "+pymysql")
config.set_main_option("sqlalchemy.url", _db_url)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
