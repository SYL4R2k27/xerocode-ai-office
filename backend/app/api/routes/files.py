from __future__ import annotations

import io
import os
import uuid
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse

from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/files", tags=["Files"])

BASE_DIR = Path("/tmp/ai-office")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    ".py", ".js", ".ts", ".html", ".css", ".json",
    ".txt", ".md", ".pdf", ".png", ".jpg", ".svg",
}


def _workspace(goal_id: uuid.UUID) -> Path:
    return BASE_DIR / str(goal_id) / "uploads"


def _validate_extension(filename: str) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )


@router.post("/upload")
async def upload_file(
    goal_id: uuid.UUID,
    file: UploadFile,
    _user: User = Depends(get_current_user),
):
    """Upload a file to a goal workspace."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    _validate_extension(file.filename)

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )

    workspace = _workspace(goal_id)
    workspace.mkdir(parents=True, exist_ok=True)

    # Sanitise filename — keep only the basename
    safe_name = Path(file.filename).name
    dest = workspace / safe_name

    dest.write_bytes(content)

    return {
        "filename": safe_name,
        "size": len(content),
        "goal_id": str(goal_id),
        "path": str(dest),
    }


@router.get("/{goal_id}")
async def list_files(
    goal_id: uuid.UUID,
    _user: User = Depends(get_current_user),
):
    """List all files in a goal workspace."""
    workspace = _workspace(goal_id)
    if not workspace.exists():
        return {"files": []}

    files = []
    for f in sorted(workspace.iterdir()):
        if f.is_file():
            files.append({
                "name": f.name,
                "size": f.stat().st_size,
                "modified": f.stat().st_mtime,
            })

    return {"files": files, "goal_id": str(goal_id)}


@router.get("/{goal_id}/zip")
async def download_zip(
    goal_id: uuid.UUID,
    _user: User = Depends(get_current_user),
):
    """Download all files in a goal workspace as a ZIP archive."""
    workspace = _workspace(goal_id)
    if not workspace.exists() or not any(workspace.iterdir()):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No files found for this goal",
        )

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in workspace.iterdir():
            if f.is_file():
                zf.write(f, arcname=f.name)

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={goal_id}.zip"},
    )


@router.get("/{goal_id}/{path:path}")
async def download_file(
    goal_id: uuid.UUID,
    path: str,
    _user: User = Depends(get_current_user),
):
    """Download a specific file from a goal workspace."""
    workspace = _workspace(goal_id)
    file_path = (workspace / path).resolve()

    # Prevent directory traversal
    if not str(file_path).startswith(str(workspace.resolve())):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid path",
        )

    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found",
        )

    return FileResponse(
        file_path,
        filename=file_path.name,
        headers={"Content-Disposition": f'attachment; filename="{file_path.name}"'},
    )
