"""Cache Firestore da colecao beecrowd_cache.

O id do documento e o external_id, entao um novo fetch substitui o registro.
O enunciado nao e gravado.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Callable, Protocol

from app.models.beecrowd import BeeCrowdProblem
from app.services.beecrowd.exceptions import BeeCrowdCacheError, IntegrationNotConfigured, InvalidExternalId

COLLECTION = "beecrowd_cache"


def cache_document_id(external_id: str) -> str:
    cleaned = (external_id or "").strip()
    if (
        not cleaned
        or len(cleaned) > 64
        or any(char not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-" for char in cleaned)
    ):
        raise InvalidExternalId("external_id invalido para o cache BeeCrowd.")
    return cleaned


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


def is_fresh(document: dict, now: datetime, ttl_seconds: int | None = None) -> bool:
    expires_at = _parse_time(document.get("expires_at"))
    if expires_at is None and ttl_seconds is not None:
        cached_at = _parse_time(document.get("cached_at"))
        if cached_at is None:
            return False
        expires_at = cached_at + timedelta(seconds=ttl_seconds)
    if expires_at is None:
        return False
    return expires_at > _as_utc(now)


def document_from_problem(problem: BeeCrowdProblem, now: datetime, ttl_seconds: int) -> dict:
    cached_at = _as_utc(problem.cached_at or now)
    return {
        "external_id": cache_document_id(problem.external_id),
        "title": problem.title,
        "category": problem.category,
        "difficulty": problem.difficulty,
        "topics": list(problem.topics),
        "source": "beecrowd",
        "external_url": problem.external_url,
        "available": problem.available,
        "cached_at": cached_at.isoformat(),
        "expires_at": (cached_at + timedelta(seconds=ttl_seconds)).isoformat(),
    }


def problem_from_document(document: dict) -> BeeCrowdProblem:
    return BeeCrowdProblem(
        external_id=cache_document_id(str(document.get("external_id") or "")),
        title=str(document.get("title") or ""),
        category=document.get("category"),
        difficulty=document.get("difficulty"),
        topics=[str(topic) for topic in (document.get("topics") or []) if str(topic).strip()],
        source="beecrowd",
        external_url=str(document.get("external_url") or ""),
        available=bool(document.get("available", True)),
        cached_at=_parse_time(document.get("cached_at")),
    )


class BeeCrowdCache(Protocol):
    async def get(self, external_id: str) -> BeeCrowdProblem | None:
        """Retorna o metadado ainda valido, ou None."""

    async def put(self, problem: BeeCrowdProblem) -> None:
        """Grava ou substitui o documento daquele external_id."""


class UnconfiguredBeeCrowdCache:
    async def get(self, external_id: str) -> BeeCrowdProblem | None:
        raise IntegrationNotConfigured(
            "Cache BeeCrowd nao configurado. Nenhuma leitura externa foi feita."
        )

    async def put(self, problem: BeeCrowdProblem) -> None:
        raise IntegrationNotConfigured(
            "Cache BeeCrowd nao configurado. Nenhuma gravacao foi feita."
        )


class MemoryBeeCrowdCache:
    """Cache em memoria usado pelos testes e como referencia do TTL."""

    def __init__(self, ttl_seconds: int, now: Callable[[], datetime] | None = None):
        self.ttl_seconds = ttl_seconds
        self._now = now or (lambda: datetime.now(timezone.utc))
        self.documents: dict[str, dict] = {}

    async def get(self, external_id: str) -> BeeCrowdProblem | None:
        doc_id = cache_document_id(external_id)
        document = self.documents.get(doc_id)
        if not document or not is_fresh(document, self._now(), self.ttl_seconds):
            return None
        return problem_from_document(document)

    async def put(self, problem: BeeCrowdProblem) -> None:
        document = document_from_problem(problem, self._now(), self.ttl_seconds)
        self.documents[document["external_id"]] = document


class FirestoreBeeCrowdCache:
    def __init__(self, ttl_seconds: int, now: Callable[[], datetime] | None = None, db_getter=None):
        self.ttl_seconds = ttl_seconds
        self._now = now or (lambda: datetime.now(timezone.utc))
        self._db_getter = db_getter

    def _db(self):
        if self._db_getter is not None:
            return self._db_getter()
        from app.services import firebase_service
        return firebase_service.get_db()

    async def get(self, external_id: str) -> BeeCrowdProblem | None:
        doc_id = cache_document_id(external_id)
        db = self._db()
        if db is None:
            return None
        try:
            snapshot = db.collection(COLLECTION).document(doc_id).get(timeout=5.0)
        except Exception as exc:
            raise BeeCrowdCacheError("Falha ao ler o cache BeeCrowd.") from exc
        if not getattr(snapshot, "exists", False):
            return None
        document = snapshot.to_dict() or {}
        if not is_fresh(document, self._now(), self.ttl_seconds):
            return None
        return problem_from_document(document)

    async def put(self, problem: BeeCrowdProblem) -> None:
        document = document_from_problem(problem, self._now(), self.ttl_seconds)
        db = self._db()
        if db is None:
            raise BeeCrowdCacheError("Firestore indisponivel para o cache BeeCrowd.")
        try:
            db.collection(COLLECTION).document(document["external_id"]).set(document, timeout=5.0)
        except Exception as exc:
            raise BeeCrowdCacheError("Falha ao gravar o cache BeeCrowd.") from exc
