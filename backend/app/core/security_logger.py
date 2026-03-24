from __future__ import annotations

import logging
import os
import sys

LOG_DIR = "/var/log/ai-office"
LOG_FILE = os.path.join(LOG_DIR, "security.log")

security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

if not security_logger.handlers:
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        file_handler = logging.FileHandler(LOG_FILE)
        file_handler.setFormatter(formatter)
        security_logger.addHandler(file_handler)
    except OSError:
        # Fallback to stdout if log directory is not writable
        stream_handler = logging.StreamHandler(sys.stdout)
        stream_handler.setFormatter(formatter)
        security_logger.addHandler(stream_handler)


def log_auth_success(email: str, ip: str) -> None:
    security_logger.info("AUTH_SUCCESS | email=%s | ip=%s", email, ip)


def log_auth_failure(email: str, ip: str, reason: str) -> None:
    security_logger.warning("AUTH_FAILURE | email=%s | ip=%s | reason=%s", email, ip, reason)


def log_suspicious_activity(ip: str, details: str) -> None:
    security_logger.warning("SUSPICIOUS | ip=%s | details=%s", ip, details)


def log_rate_limit(ip: str, endpoint: str) -> None:
    security_logger.warning("RATE_LIMIT | ip=%s | endpoint=%s", ip, endpoint)
