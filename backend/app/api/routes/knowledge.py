"""
Knowledge Base — загрузка документов, парсинг, embedding, RAG-поиск.
"""
from __future__ import annotations

import io
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])


# ── Schemas ─────────────────────────────────────────────────────────

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int
    chunks_count: int
    status: str
    created_at: str


class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    content: str
    similarity: float
    chunk_index: int


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total: int


# ── Helpers ─────────────────────────────────────────────────────────

def _parse_pdf(content: bytes) -> str:
    """Extract text from PDF."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(content))
        texts = []
        for page in reader.pages:
            t = page.extract_text()
            if t:
                texts.append(t)
        return "\n\n".join(texts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {e}")


def _parse_docx(content: bytes) -> str:
    """Extract text from DOCX."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse DOCX: {e}")


def _parse_txt(content: bytes) -> str:
    """Extract text from TXT/CSV."""
    return content.decode("utf-8", errors="ignore")


def _chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks by words."""
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk.strip())
        i += chunk_size - overlap
    return chunks if chunks else [text[:2000]]  # fallback


# ── Upload Document ──────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and index a document (PDF, DOCX, TXT, CSV)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ("pdf", "docx", "txt", "csv", "md"):
        raise HTTPException(status_code=400, detail=f"Unsupported file type: .{ext}. Supported: pdf, docx, txt, csv, md")

    content = await file.read()
    file_size = len(content)
    if file_size > 20 * 1024 * 1024:  # 20MB limit
        raise HTTPException(status_code=400, detail="File too large (max 20MB)")

    # Parse text
    if ext == "pdf":
        raw_text = _parse_pdf(content)
    elif ext == "docx":
        raw_text = _parse_docx(content)
    else:
        raw_text = _parse_txt(content)

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="No text extracted from file")

    # Chunk
    chunks = _chunk_text(raw_text)

    # Create document record
    doc_id = uuid.uuid4()
    await db.execute(text("""
        INSERT INTO kb_documents (id, user_id, organization_id, filename, file_type, file_size, chunks_count, status)
        VALUES (:id, :user_id, :org_id, :filename, :file_type, :file_size, :chunks_count, 'ready')
    """), {
        "id": str(doc_id),
        "user_id": str(current_user.id),
        "org_id": str(current_user.organization_id) if current_user.organization_id else None,
        "filename": file.filename,
        "file_type": ext,
        "file_size": file_size,
        "chunks_count": len(chunks),
    })

    # Insert chunks (without embeddings for now — embedding requires API call)
    for i, chunk in enumerate(chunks):
        chunk_id = uuid.uuid4()
        await db.execute(text("""
            INSERT INTO kb_chunks (id, document_id, content, chunk_index, metadata)
            VALUES (:id, :doc_id, :content, :idx, :meta)
        """), {
            "id": str(chunk_id),
            "doc_id": str(doc_id),
            "content": chunk,
            "idx": i,
            "meta": f'{{"filename": "{file.filename}", "chunk": {i}}}',
        })

    await db.commit()

    return DocumentResponse(
        id=str(doc_id),
        filename=file.filename,
        file_type=ext,
        file_size=file_size,
        chunks_count=len(chunks),
        status="ready",
        created_at=datetime.utcnow().isoformat(),
    )


# ── List Documents ───────────────────────────────────────────────────

@router.get("/documents", response_model=list[DocumentResponse])
async def list_documents(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List user's uploaded documents."""
    result = await db.execute(text("""
        SELECT id, filename, file_type, file_size, chunks_count, status, created_at
        FROM kb_documents
        WHERE user_id = :uid
        ORDER BY created_at DESC
    """), {"uid": str(current_user.id)})
    rows = result.fetchall()
    return [
        DocumentResponse(
            id=str(r[0]), filename=r[1], file_type=r[2], file_size=r[3],
            chunks_count=r[4], status=r[5], created_at=r[6].isoformat() if r[6] else "",
        )
        for r in rows
    ]


# ── Delete Document ──────────────────────────────────────────────────

@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and its chunks."""
    result = await db.execute(text("""
        DELETE FROM kb_documents WHERE id = :id AND user_id = :uid
    """), {"id": str(doc_id), "uid": str(current_user.id)})
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"detail": "Document deleted"}


# ── Search (text-based, no embedding yet) ────────────────────────────

@router.get("/search", response_model=SearchResponse)
async def search_knowledge(
    q: str = Query(..., min_length=1, max_length=500),
    limit: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search knowledge base using text similarity (full-text search)."""
    # For now: ILIKE search (when embeddings are added, switch to vector similarity)
    search_term = f"%{q}%"
    result = await db.execute(text("""
        SELECT c.id, c.document_id, d.filename, c.content, c.chunk_index,
               similarity(c.content, :query) as sim
        FROM kb_chunks c
        JOIN kb_documents d ON c.document_id = d.id
        WHERE d.user_id = :uid AND c.content ILIKE :search
        ORDER BY length(c.content) ASC
        LIMIT :lim
    """), {
        "uid": str(current_user.id),
        "query": q,
        "search": search_term,
        "lim": limit,
    })
    rows = result.fetchall()

    # Fallback if similarity() function not available
    results = []
    for r in rows:
        results.append(SearchResult(
            chunk_id=str(r[0]),
            document_id=str(r[1]),
            filename=r[2],
            content=r[3][:500],
            similarity=float(r[5]) if r[5] else 0.0,
            chunk_index=r[4],
        ))

    return SearchResponse(query=q, results=results, total=len(results))


# ── Get document context for RAG ─────────────────────────────────────

@router.get("/context")
async def get_rag_context(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get relevant chunks for RAG (to inject into AI prompt)."""
    search_term = f"%{q}%"
    result = await db.execute(text("""
        SELECT c.content, d.filename, c.chunk_index
        FROM kb_chunks c
        JOIN kb_documents d ON c.document_id = d.id
        WHERE d.user_id = :uid AND c.content ILIKE :search
        LIMIT :lim
    """), {"uid": str(current_user.id), "search": search_term, "lim": limit})
    rows = result.fetchall()

    context_parts = []
    for r in rows:
        context_parts.append({
            "content": r[0],
            "source": f"{r[1]} (часть {r[2] + 1})",
        })

    return {
        "query": q,
        "context": context_parts,
        "context_text": "\n\n---\n\n".join(
            f"[Источник: {p['source']}]\n{p['content']}" for p in context_parts
        ),
    }
