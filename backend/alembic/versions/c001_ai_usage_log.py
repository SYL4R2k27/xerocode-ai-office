"""Add ai_usage_log table for cost-tier quota tracking.

Revision ID: c001_ai_usage_log
Revises: b0a11b8e62b2
Create Date: 2026-04-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import app.core.db_types


# revision identifiers, used by Alembic.
revision: str = "c001_ai_usage_log"
down_revision: Union[str, Sequence[str], None] = "b0a11b8e62b2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_usage_log",
        sa.Column("id", app.core.db_types.GUID(length=36), nullable=False),
        sa.Column("user_id", app.core.db_types.GUID(length=36), nullable=False),
        sa.Column("org_id", app.core.db_types.GUID(length=36), nullable=True),
        sa.Column("model_id", sa.String(length=80), nullable=False),
        sa.Column("cost_tier", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=30), nullable=False),
        sa.Column("kind", sa.String(length=20), nullable=False, server_default="text"),
        sa.Column("tokens_in", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tokens_out", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("units", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("cost_micro_usd", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("via_byok", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("success", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("error_msg", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["org_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_usage_log_user_id"), "ai_usage_log", ["user_id"])
    op.create_index(op.f("ix_ai_usage_log_org_id"), "ai_usage_log", ["org_id"])
    op.create_index("ix_ai_usage_user_tier_created", "ai_usage_log", ["user_id", "cost_tier", "created_at"])
    op.create_index("ix_ai_usage_org_tier_created", "ai_usage_log", ["org_id", "cost_tier", "created_at"])
    op.create_index("ix_ai_usage_created_at", "ai_usage_log", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_ai_usage_created_at", table_name="ai_usage_log")
    op.drop_index("ix_ai_usage_org_tier_created", table_name="ai_usage_log")
    op.drop_index("ix_ai_usage_user_tier_created", table_name="ai_usage_log")
    op.drop_index(op.f("ix_ai_usage_log_org_id"), table_name="ai_usage_log")
    op.drop_index(op.f("ix_ai_usage_log_user_id"), table_name="ai_usage_log")
    op.drop_table("ai_usage_log")
