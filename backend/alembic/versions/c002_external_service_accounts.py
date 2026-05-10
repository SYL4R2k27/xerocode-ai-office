"""Add service_accounts and service_account_usage tables for external API gateway.

Revision ID: c002_external_service_accounts
Revises: c001_ai_usage_log
Create Date: 2026-05-10 12:00:00.000000

Изолированный модуль для внешних service-клиентов (BELSI и т.п.).
НЕ связан с supervisor/orchestration/messages — только thin layer
'image-in → JSON-out' через основные AI-провайдеры.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import app.core.db_types


# revision identifiers, used by Alembic.
revision: str = "c002_external_service_accounts"
down_revision: Union[str, Sequence[str], None] = "c001_ai_usage_log"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Detect dialect via Alembic context (works also in --sql/offline mode).
    is_postgres = op.get_context().dialect.name == "postgresql"
    array_default = sa.text("'{}'") if is_postgres else sa.text("'[]'")

    # ── service_accounts ──────────────────────────────────────────
    op.create_table(
        "service_accounts",
        sa.Column("id", app.core.db_types.GUID(), nullable=False),
        sa.Column("organization_id", app.core.db_types.GUID(), nullable=True),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("service_token_hash", sa.Text(), nullable=False),
        sa.Column("token_prefix", sa.Text(), nullable=False),
        sa.Column(
            "allowed_endpoints",
            app.core.db_types.StringArray(),
            nullable=False,
            server_default=array_default,
        ),
        sa.Column(
            "allowed_models",
            app.core.db_types.StringArray(),
            nullable=False,
            server_default=array_default,
        ),
        sa.Column("rate_limit_per_minute", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("rate_limit_per_day", sa.Integer(), nullable=False, server_default="5000"),
        sa.Column(
            "monthly_budget_usd",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
            server_default="0",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", app.core.db_types.GUID(), nullable=True),
        sa.ForeignKeyConstraint(
            ["organization_id"], ["organizations.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_service_accounts_name"),
        sa.UniqueConstraint("token_prefix", name="uq_service_accounts_token_prefix"),
    )
    op.create_index(
        "idx_sa_token_prefix", "service_accounts", ["token_prefix"], unique=False
    )
    op.create_index(
        "idx_sa_org", "service_accounts", ["organization_id"], unique=False
    )

    # ── service_account_usage ─────────────────────────────────────
    op.create_table(
        "service_account_usage",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("service_account_id", app.core.db_types.GUID(), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("provider", sa.Text(), nullable=False),
        sa.Column("model", sa.Text(), nullable=False),
        sa.Column("tokens_input", sa.Integer(), nullable=True, server_default="0"),
        sa.Column("tokens_output", sa.Integer(), nullable=True, server_default="0"),
        sa.Column(
            "cost_usd",
            sa.Numeric(precision=10, scale=6),
            nullable=True,
            server_default="0",
        ),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("error_code", sa.Text(), nullable=True),
        sa.Column("request_id", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        # Cached envelope JSON for idempotent replay
        sa.Column("response_cache", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(
            ["service_account_id"], ["service_accounts.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_sa_usage_account_date",
        "service_account_usage",
        ["service_account_id", sa.text("created_at DESC")],
        unique=False,
    )
    # Partial unique index for idempotency (PG only). On SQLite — без partial.
    if is_postgres:
        op.create_index(
            "idx_sa_usage_request_id",
            "service_account_usage",
            ["service_account_id", "request_id"],
            unique=True,
            postgresql_where=sa.text("request_id IS NOT NULL"),
        )
    else:
        # SQLite: обычный non-unique индекс — идемпотентность проверяется в коде
        op.create_index(
            "idx_sa_usage_request_id",
            "service_account_usage",
            ["service_account_id", "request_id"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index("idx_sa_usage_request_id", table_name="service_account_usage")
    op.drop_index("idx_sa_usage_account_date", table_name="service_account_usage")
    op.drop_table("service_account_usage")
    op.drop_index("idx_sa_org", table_name="service_accounts")
    op.drop_index("idx_sa_token_prefix", table_name="service_accounts")
    op.drop_table("service_accounts")
