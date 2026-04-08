"""Organization file storage model."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func

from app.core.database import Base
from app.core.db_types import GUID, JSONB


class StoredFile(Base):
    __tablename__ = "stored_files"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    organization_id = Column(GUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_path = Column(String(500), default="/")
    filename = Column(String(300), nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String(100))
    uploaded_by = Column(GUID(), nullable=False)
    storage_backend = Column(String(20), default="local")  # local, s3
    storage_key = Column(String(500))  # path or S3 key
    is_public = Column(Boolean, default=False)
    tags = Column(JSONB, default=list)
    created_at = Column(DateTime, default=func.now())
