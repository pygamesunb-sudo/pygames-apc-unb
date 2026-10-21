"""Sessao da aplicacao BeeCrowd.

O token fica no processo e, quando o Firestore existe, tambem em
beecrowd_session/application. Email e senha nao sao gravados.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

COLLECTION = "beecrowd_session"
DOCUMENT_ID = "application"
TOKEN_TTL_SECONDS = 6 * 24 * 60 * 60


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _parse_time(value) -> datetime | None:
    if isinstance(value, datetime):
        return _as_utc(value)
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return _as_utc(datetime.fromisoformat(value.replace("Z", "+00:00")))
    except ValueError:
        return None


class MemoryTokenCache:
    def __init__(self):
        self.token = ""
        self.expires_at: datetime | None = None

    async def read(self, now: datetime | None = None) -> str:
        current = _as_utc(now or datetime.now(timezone.utc))
        if self.token and self.expires_at and self.expires_at > current:
            return self.token
        return ""

    async def write(self, token: str, expires_at: datetime) -> None:
        self.token = token
        self.expires_at = _as_utc(expires_at)

    async def clear(self) -> None:
        self.token = ""
        self.expires_at = None


class FirestoreTokenCache:
    """Guarda somente o bearer ja emitido. A falha de cache nao quebra a leitura."""

    async def read(self, now: datetime | None = None) -> str:
        db = _db()
        if db is None:
            return ""
        try:
            snapshot = db.collection(COLLECTION).document(DOCUMENT_ID).get(timeout=5.0)
        except Exception:
            logger.warning("Sessao da fonte indisponivel na leitura.")
            return ""
        if not getattr(snapshot, "exists", False):
            return ""
        data = snapshot.to_dict() or {}
        expires_at = _parse_time(data.get("expires_at"))
        token = data.get("token")
        current = _as_utc(now or datetime.now(timezone.utc))
        if not expires_at or expires_at <= current or not isinstance(token, str):
            return ""
        return token.strip()

    async def write(self, token: str, expires_at: datetime) -> None:
        db = _db()
        if db is None:
            return
        try:
            db.collection(COLLECTION).document(DOCUMENT_ID).set(
                {
                    "token": token,
                    "expires_at": _as_utc(expires_at).isoformat(),
                },
                timeout=5.0,
            )
        except Exception:
            logger.warning("Sessao da fonte indisponivel na gravacao.")

    async def clear(self) -> None:
        db = _db()
        if db is None:
            return
        try:
            db.collection(COLLECTION).document(DOCUMENT_ID).delete(timeout=5.0)
        except Exception:
            logger.warning("Sessao da fonte indisponivel ao renovar.")


def _db():
    from app.services.firebase_service import get_db

    return get_db()


def expiry_from_now(now: datetime | None = None, ttl_seconds: int = TOKEN_TTL_SECONDS) -> datetime:
    current = _as_utc(now or datetime.now(timezone.utc))
    return current + timedelta(seconds=max(300, ttl_seconds))
