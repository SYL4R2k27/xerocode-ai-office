"""Voice transcription via OpenAI Whisper API."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.core.auth import get_current_user
from app.core.config import settings

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = "ru",
    user=Depends(get_current_user),
):
    """Transcribe audio file using OpenAI Whisper API."""
    import httpx

    api_key = getattr(settings, "openai_api_key", None)
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")

    # Read audio data
    audio_data = await file.read()
    if len(audio_data) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=400, detail="Audio file too large (max 25MB)")

    filename = file.filename or "audio.webm"
    content_type = file.content_type or "audio/webm"

    proxy = getattr(settings, "api_proxy", None)
    transport = httpx.AsyncHTTPTransport(proxy=proxy) if proxy else None

    async with httpx.AsyncClient(transport=transport, timeout=30) as client:
        try:
            resp = await client.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {api_key}"},
                files={"file": (filename, audio_data, content_type)},
                data={"model": "whisper-1", "language": language, "response_format": "json"},
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Whisper API error: {resp.status_code}")

            result = resp.json()
            return {"text": result.get("text", ""), "language": language}

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Transcription timed out")
