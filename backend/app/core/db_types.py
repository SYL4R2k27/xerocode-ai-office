"""
Универсальные типы колонок — работают и с PostgreSQL, и с SQLite.
PostgreSQL: используем нативные ARRAY, UUID, JSONB
SQLite: используем String/Text/JSON заменители
"""
from __future__ import annotations

import json
import uuid

from sqlalchemy import String, Text, TypeDecorator, types
from sqlalchemy.dialects import postgresql

from app.core.config import settings

_is_postgres = "postgresql" in settings.database_url


# UUID type — works for both PG and SQLite
if _is_postgres:
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID

    class GUID(PG_UUID):
        def __init__(self):
            super().__init__(as_uuid=True)
else:
    class GUID(TypeDecorator):
        impl = String(36)
        cache_ok = True

        def process_bind_param(self, value, dialect):
            if value is not None:
                return str(value)
            return value

        def process_result_value(self, value, dialect):
            if value is not None:
                return uuid.UUID(value)
            return value


# ARRAY type — PG uses native, SQLite uses JSON-encoded string
if _is_postgres:
    from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY

    def StringArray():
        return PG_ARRAY(String)
else:
    class StringArray(TypeDecorator):
        impl = Text
        cache_ok = True

        def process_bind_param(self, value, dialect):
            if value is not None:
                return json.dumps(value)
            return value

        def process_result_value(self, value, dialect):
            if value is not None:
                return json.loads(value)
            return value

    # Make it callable like PG_ARRAY
    _StringArrayClass = StringArray

    def StringArray():
        return _StringArrayClass()


# JSONB type — PG uses native, SQLite uses JSON text
if _is_postgres:
    from sqlalchemy.dialects.postgresql import JSONB
else:
    class JSONB(TypeDecorator):
        impl = Text
        cache_ok = True

        def process_bind_param(self, value, dialect):
            if value is not None:
                return json.dumps(value)
            return value

        def process_result_value(self, value, dialect):
            if value is not None:
                return json.loads(value)
            return value
