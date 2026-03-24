from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken


def _get_fernet() -> Fernet:
    """Derive a Fernet key from settings.secret_key."""
    from app.core.config import settings

    # Fernet requires a 32-byte url-safe base64-encoded key.
    # Derive it deterministically from the secret_key.
    raw = hashlib.sha256(settings.secret_key.encode()).digest()
    key = base64.urlsafe_b64encode(raw)
    return Fernet(key)


def encrypt_api_key(plain_key: str) -> str:
    """Encrypt an API key and return a base64 token string."""
    if not plain_key:
        return plain_key
    f = _get_fernet()
    return f.encrypt(plain_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """Decrypt an API key token back to plaintext.

    If the value doesn't look encrypted (legacy plain-text keys),
    return it as-is so old data keeps working.
    """
    if not encrypted_key:
        return encrypted_key
    f = _get_fernet()
    try:
        return f.decrypt(encrypted_key.encode()).decode()
    except (InvalidToken, Exception):
        # Likely a legacy plain-text key that was stored before encryption
        # was enabled. Return as-is.
        return encrypted_key
