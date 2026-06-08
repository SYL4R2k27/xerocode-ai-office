"""Add allowed_image_hosts column to service_accounts (SSRF defense per-SA).

Revision ID: c003_sa_allowed_image_hosts
Revises: c002_external_service_accounts
Create Date: 2026-05-11 00:00:00.000000

Per-service-account allowlist хостов для image_url в /api/v1/external/analyze-image.
Default — пустой список (explicit-only). Существующий belsi-prod SA получает
bucket.api.belsi.ru через backfill.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

import app.core.db_types


# revision identifiers, used by Alembic.
revision: str = "c003_sa_allowed_image_hosts"
down_revision: Union[str, Sequence[str], None] = "c002_external_service_accounts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    is_postgres = op.get_context().dialect.name == "postgresql"
    # Default — empty list (explicit-only). server_default используется на ENUM/типы;
    # для StringArray (PG ARRAY / SQLite JSON) задаём пустой контейнер.
    empty_default = sa.text("'{}'") if is_postgres else sa.text("'[]'")

    op.add_column(
        "service_accounts",
        sa.Column(
            "allowed_image_hosts",
            app.core.db_types.StringArray(),
            nullable=False,
            server_default=empty_default,
        ),
    )

    # Backfill: существующий belsi-prod SA должен сохранить работоспособность —
    # ему добавляем bucket.api.belsi.ru. Прочие SA (если есть) остаются с пустым
    # списком — explicit-only поведение (image_url отвергнется до фикса админом).
    if is_postgres:
        op.execute(
            "UPDATE service_accounts "
            "SET allowed_image_hosts = ARRAY['bucket.api.belsi.ru']::text[] "
            "WHERE name = 'belsi-prod'"
        )
    else:
        # SQLite: StringArray хранит JSON-строку.
        op.execute(
            "UPDATE service_accounts "
            "SET allowed_image_hosts = '[\"bucket.api.belsi.ru\"]' "
            "WHERE name = 'belsi-prod'"
        )


def downgrade() -> None:
    op.drop_column("service_accounts", "allowed_image_hosts")
