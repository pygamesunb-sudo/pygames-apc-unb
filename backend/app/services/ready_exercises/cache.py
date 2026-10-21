"""Cache de metadados em ready_exercises_cache/{source}_{external_id}."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from app.models.ready_exercises import ReadyExercise
from app.services.ready_exercises.mapper import parse_exercise_id, safe_external_url

logger = logging.getLogger(__name__)

COLLECTION = "ready_exercises_cache"
BATCH_EXTERNAL_ID = "batch"


def cache_document_id(source: str, external_id: str) -> str:
    parsed_source, parsed_id = parse_exercise_id(f"{source}_{external_id}")
    if parsed_source != source:
        raise ValueError("fonte invalida para o cache")
    return f"{parsed_source}_{parsed_id}"


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


def is_fresh(expires_at, now: datetime | None = None) -> bool:
    expires = _parse_time(expires_at)
    if expires is None:
        return False
    current = _as_utc(now or datetime.now(timezone.utc))
    return expires > current


def document_from_exercise(exercise: ReadyExercise, *, now: datetime, ttl_seconds: int) -> dict:
    cached_at = _as_utc(now)
    expires_at = cached_at + timedelta(seconds=max(60, ttl_seconds))
    return {
        "source": exercise.source,
        "external_id": exercise.external_id,
        "title": exercise.title,
        "topic": exercise.topic,
        "topics": list(exercise.topics),
        "difficulty": exercise.difficulty,
        "level": exercise.level,
        "external_url": exercise.external_url,
        "cached_at": cached_at.isoformat(),
        "expires_at": expires_at.isoformat(),
    }


def batch_document(source: str, *, now: datetime, ttl_seconds: int) -> dict:
    cached_at = _as_utc(now)
    expires_at = cached_at + timedelta(seconds=max(60, ttl_seconds))
    return {
        "kind": "catalog_batch",
        "source": source,
        "external_id": BATCH_EXTERNAL_ID,
        "cached_at": cached_at.isoformat(),
        "expires_at": expires_at.isoformat(),
    }


def exercise_from_document(data: dict) -> ReadyExercise:
    source = str(data.get("source") or "")
    external_id = str(data.get("external_id") or "")
    cache_document_id(source, external_id)
    difficulty = data.get("difficulty") or "beginner"
    if difficulty not in {"beginner", "intermediate", "challenge"}:
        difficulty = "beginner"
    level = int(data.get("level") or 1)
    level = min(3, max(1, level))
    topics = [str(item) for item in (data.get("topics") or []) if str(item).strip()]
    return ReadyExercise(
        id=f"{source}_{external_id}",
        external_id=external_id,
        source="beecrowd",
        title=str(data.get("title") or "").strip(),
        topic=str(data.get("topic") or "entrada_saida"),
        topics=topics,
        difficulty=difficulty,
        level=level,
        external_url=safe_external_url(str(data.get("external_url") or "")),
    )


class MemoryReadyCache:
    def __init__(self, ttl_seconds: int = 86400):
        self.ttl_seconds = ttl_seconds
        self.documents: dict[str, dict] = {}

    def clear(self) -> None:
        self.documents.clear()

    async def get(self, source: str, external_id: str, now: datetime | None = None) -> ReadyExercise | None:
        document = self.documents.get(cache_document_id(source, external_id))
        if not document or document.get("kind") == "catalog_batch" or not is_fresh(document.get("expires_at"), now):
            return None
        return exercise_from_document(document)

    async def put(self, exercise: ReadyExercise, now: datetime | None = None) -> dict:
        document_id = cache_document_id(exercise.source, exercise.external_id)
        document = document_from_exercise(
            exercise,
            now=now or datetime.now(timezone.utc),
            ttl_seconds=self.ttl_seconds,
        )
        self.documents[document_id] = document
        return document

    async def put_many(self, exercises: list[ReadyExercise], now: datetime | None = None) -> None:
        current = now or datetime.now(timezone.utc)
        for exercise in exercises:
            await self.put(exercise, now=current)
        if exercises:
            document_id = cache_document_id(exercises[0].source, BATCH_EXTERNAL_ID)
            self.documents[document_id] = batch_document(exercises[0].source, now=current, ttl_seconds=self.ttl_seconds)

    async def has_fresh_catalog(self, source: str, now: datetime | None = None) -> bool:
        document = self.documents.get(cache_document_id(source, BATCH_EXTERNAL_ID))
        return bool(document and document.get("kind") == "catalog_batch" and is_fresh(document.get("expires_at"), now))

    async def list_fresh(self, source: str, now: datetime | None = None) -> list[ReadyExercise]:
        fresh = []
        for document in self.documents.values():
            if document.get("kind") == "catalog_batch":
                continue
            if document.get("source") != source or not is_fresh(document.get("expires_at"), now):
                continue
            fresh.append(exercise_from_document(document))
        fresh.sort(key=lambda item: item.external_id)
        return fresh


class FirestoreReadyCache:
    def __init__(self, ttl_seconds: int = 86400):
        self.ttl_seconds = ttl_seconds

    def _db(self):
        from app.services.firebase_service import get_db

        return get_db()

    async def get(self, source: str, external_id: str, now: datetime | None = None) -> ReadyExercise | None:
        db = self._db()
        if db is None:
            return None
        try:
            snapshot = db.collection(COLLECTION).document(cache_document_id(source, external_id)).get(timeout=5.0)
        except Exception:
            logger.warning("Cache de exercicios prontos indisponivel na leitura.", exc_info=True)
            return None
        if not getattr(snapshot, "exists", False):
            return None
        document = snapshot.to_dict() or {}
        if document.get("kind") == "catalog_batch" or not is_fresh(document.get("expires_at"), now):
            return None
        try:
            return exercise_from_document(document)
        except (ValueError, TypeError):
            return None

    async def put(self, exercise: ReadyExercise, now: datetime | None = None) -> dict:
        document = document_from_exercise(
            exercise,
            now=now or datetime.now(timezone.utc),
            ttl_seconds=self.ttl_seconds,
        )
        db = self._db()
        if db is None:
            return document
        db.collection(COLLECTION).document(cache_document_id(exercise.source, exercise.external_id)).set(document, timeout=5.0)
        return document

    async def put_many(self, exercises: list[ReadyExercise], now: datetime | None = None) -> None:
        current = now or datetime.now(timezone.utc)
        for exercise in exercises:
            try:
                await self.put(exercise, now=current)
            except Exception:
                logger.warning("Cache de exercicios prontos indisponivel na gravacao.", exc_info=True)
                return
        if not exercises:
            return
        db = self._db()
        if db is None:
            return
        try:
            document_id = cache_document_id(exercises[0].source, BATCH_EXTERNAL_ID)
            db.collection(COLLECTION).document(document_id).set(
                batch_document(exercises[0].source, now=current, ttl_seconds=self.ttl_seconds),
                timeout=5.0,
            )
        except Exception:
            logger.warning("Cache de exercicios prontos indisponivel na gravacao.", exc_info=True)

    async def has_fresh_catalog(self, source: str, now: datetime | None = None) -> bool:
        db = self._db()
        if db is None:
            return False
        try:
            snapshot = db.collection(COLLECTION).document(cache_document_id(source, BATCH_EXTERNAL_ID)).get(timeout=5.0)
        except Exception:
            logger.warning("Cache de exercicios prontos indisponivel na leitura.", exc_info=True)
            return False
        if not getattr(snapshot, "exists", False):
            return False
        document = snapshot.to_dict() or {}
        return document.get("kind") == "catalog_batch" and is_fresh(document.get("expires_at"), now)

    async def list_fresh(self, source: str, now: datetime | None = None) -> list[ReadyExercise]:
        db = self._db()
        if db is None:
            return []
        try:
            snapshots = db.collection(COLLECTION).where("source", "==", source).stream(timeout=5.0)
        except Exception:
            logger.warning("Cache de exercicios prontos indisponivel na listagem.", exc_info=True)
            return []
        fresh = []
        for snapshot in snapshots:
            document = snapshot.to_dict() or {}
            if document.get("kind") == "catalog_batch" or not is_fresh(document.get("expires_at"), now):
                continue
            try:
                fresh.append(exercise_from_document(document))
            except (ValueError, TypeError):
                continue
        fresh.sort(key=lambda item: item.external_id)
        return fresh
