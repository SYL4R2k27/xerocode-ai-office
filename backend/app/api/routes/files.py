from __future__ import annotations

import io
import uuid as uuid_mod
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse, StreamingResponse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.goal import Goal
from app.models.user import User

router = APIRouter(prefix="/files", tags=["Files"])


async def _verify_goal_owner(goal_id: uuid_mod.UUID, user: User, db: AsyncSession) -> None:
    """Verify goal belongs to current user or their organization."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    # Check: goal belongs to user, or user is in same org
    if str(goal.user_id) != str(user.id):
        if not user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Check if goal owner is in same org
        owner_result = await db.execute(select(User).where(User.id == uuid_mod.UUID(str(goal.user_id))))
        owner = owner_result.scalar_one_or_none()
        if not owner or owner.organization_id != user.organization_id:
            raise HTTPException(status_code=403, detail="Access denied")

BASE_DIR = Path("/tmp/ai-office")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
ALLOWED_EXTENSIONS = {
    ".txt", ".md", ".py", ".js", ".ts", ".html", ".css", ".json",
    ".csv", ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".zip", ".tar", ".gz",
}
PUBLIC_UPLOAD_DIR = Path("/var/www/ai-office/uploads")


def _workspace(goal_id: uuid_mod.UUID) -> Path:
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
    goal_id: uuid_mod.UUID,
    file: UploadFile,
    _user: User = Depends(get_current_user),
):
    """Upload a file to a goal workspace."""
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    # Validate extension
    safe_ext = Path(file.filename).suffix.lower()
    if safe_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Тип файла не разрешён: {safe_ext}",
        )

    # Read and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл слишком большой (макс 50МБ)",
        )

    # Validate magic bytes for images
    if safe_ext in (".png",) and content[:4] != b"\x89PNG":
        raise HTTPException(status_code=400, detail="Файл не является PNG")
    if safe_ext in (".jpg", ".jpeg") and content[:2] != b"\xff\xd8":
        raise HTTPException(status_code=400, detail="Файл не является JPEG")
    if safe_ext in (".gif",) and content[:4] not in (b"GIF8", b"GIF9"):
        raise HTTPException(status_code=400, detail="Файл не является GIF")

    # Sanitize filename — UUID + original extension
    safe_name = f"{uuid_mod.uuid4().hex}{safe_ext}"

    workspace = _workspace(goal_id)
    workspace.mkdir(parents=True, exist_ok=True)
    dest = workspace / safe_name
    dest.write_bytes(content)

    # Также сохранить в публичную папку для доступа через nginx
    PUBLIC_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    public_dest = PUBLIC_UPLOAD_DIR / safe_name
    public_dest.write_bytes(content)

    return {
        "filename": safe_name,
        "original_name": file.filename,
        "size": len(content),
        "goal_id": str(goal_id),
        "path": str(dest),
        "url": f"/uploads/{safe_name}",
    }


@router.get("/{goal_id}")
async def list_files(
    goal_id: uuid_mod.UUID,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all files in a goal workspace."""
    await _verify_goal_owner(goal_id, _user, db)
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
    goal_id: uuid_mod.UUID,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download all files in a goal workspace as a ZIP archive."""
    await _verify_goal_owner(goal_id, _user, db)
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
    goal_id: uuid_mod.UUID,
    path: str,
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Download a specific file from a goal workspace."""
    await _verify_goal_owner(goal_id, _user, db)
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
