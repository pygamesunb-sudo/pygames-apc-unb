"""Catalogo, progresso e fontes dos Exercicios Prontos.

O restante do Pygames fala com este service. A fonte BeeCrowd fica atras dele.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from app.config import settings
from app.models.ready_exercises import (
    ReadyExercise,
    ReadyExerciseList,
    ReadyExercisesStatus,
    ReadyTopic,
    ProviderState,
)
from app.services.ready_exercises.cache import FirestoreReadyCache, MemoryReadyCache
from app.services.ready_exercises.errors import (
    ReadyExerciseNotFound,
    ReadyExercisesSourceError,
    ReadyExercisesUnavailable,
    ReadyProgressError,
)
from app.services.ready_exercises.mapper import filter_exercises, parse_exercise_id
from app.services.ready_exercises.providers import BeeCrowdProvider, LocalExerciseProvider
from app.services.ready_exercises.recommendations import recommend

logger = logging.getLogger(__name__)

TOPICS = (
    ReadyTopic(id="todos", label="Todos"),
    ReadyTopic(id="entrada_saida", label="Entrada e Saída"),
    ReadyTopic(id="variaveis", label="Variáveis"),
    ReadyTopic(id="condicionais", label="Condicionais"),
    ReadyTopic(id="while", label="While"),
    ReadyTopic(id="for", label="For"),
    ReadyTopic(id="strings", label="Strings"),
    ReadyTopic(id="listas", label="Listas"),
    ReadyTopic(id="funcoes", label="Funções"),
)
TOPIC_IDS = {topic.id for topic in TOPICS}
DIFFICULTIES = {"beginner", "intermediate", "challenge"}
PROGRESS_COLLECTION = "ready_exercise_progress"

_memory_cache = MemoryReadyCache(ttl_seconds=settings.beecrowd_cache_ttl)
_memory_progress: dict[str, dict] = {}


def cloud_runtime() -> bool:
    return bool(os.getenv("K_SERVICE") or os.getenv("FUNCTION_TARGET") or os.getenv("FUNCTION_NAME"))


def clear_local_state() -> None:
    _memory_cache.clear()
    _memory_progress.clear()


class MemoryProgressStore:
    def __init__(self, documents: dict[str, dict] | None = None):
        self.documents = _memory_progress if documents is None else documents

    async def get(self, uid: str) -> dict:
        return dict(self.documents.get(uid) or {})

    async def set_status(self, uid: str, exercise_id: str, status: str) -> str:
        _reject_uid(uid)
        items = self.documents.setdefault(uid, {})
        current = (items.get(exercise_id) or {}).get("status")
        if current == "completed" and status == "started":
            status = "completed"
        items[exercise_id] = {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        return status


class FirestoreProgressStore:
    async def get(self, uid: str) -> dict:
        _reject_uid(uid)
        db = _firestore()
        if db is None:
            return {}
        try:
            snapshot = db.collection(PROGRESS_COLLECTION).document(uid).get(timeout=5.0)
        except Exception:
            logger.warning("Progresso de exercicios prontos indisponivel na leitura.", exc_info=True)
            return {}
        if not getattr(snapshot, "exists", False):
            return {}
        items = (snapshot.to_dict() or {}).get("items") or {}
        return dict(items) if isinstance(items, dict) else {}

    async def set_status(self, uid: str, exercise_id: str, status: str) -> str:
        _reject_uid(uid)
        db = _firestore()
        if db is None:
            raise ReadyProgressError("Progresso indisponivel.")
        try:
            document = db.collection(PROGRESS_COLLECTION).document(uid)
            snapshot = document.get(timeout=5.0)
            items = {}
            if getattr(snapshot, "exists", False):
                stored = (snapshot.to_dict() or {}).get("items") or {}
                if isinstance(stored, dict):
                    items = dict(stored)
            current = (items.get(exercise_id) or {}).get("status")
            if current == "completed" and status == "started":
                status = "completed"
            items[exercise_id] = {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            document.set({"uid": uid, "items": items}, timeout=5.0)
        except ReadyProgressError:
            raise
        except Exception as exc:
            logger.warning("Progresso de exercicios prontos indisponivel na gravacao.", exc_info=True)
            raise ReadyProgressError("Progresso indisponivel.") from exc
        return status


def _reject_uid(uid: str) -> None:
    if not uid or "/" in uid or len(uid) > 128:
        raise ReadyProgressError("Usuario invalido.")


def _firestore():
    from app.services.firebase_service import get_db

    return get_db()


class ReadyExercisesService:
    def __init__(self, providers=None, cache=None, progress=None):
        self.providers = list(providers) if providers is not None else [
            LocalExerciseProvider(),
            BeeCrowdProvider(),
        ]
        self.cache = cache or MemoryReadyCache()
        self.progress = progress or MemoryProgressStore()

    def status(self) -> ReadyExercisesStatus:
        states = {
            provider.source: ProviderState(configured=provider.is_active())
            for provider in self.providers
        }
        states.setdefault("pygames", ProviderState(configured=True))
        states.setdefault("beecrowd", ProviderState(configured=False))
        available = any(provider.is_active() for provider in self.providers)
        return ReadyExercisesStatus(
            available=available,
            mode="catalog" if available else "unavailable",
            providers=states,
        )

    def topics(self) -> list[ReadyTopic]:
        return list(TOPICS)

    async def list_exercises(
        self,
        *,
        uid: str,
        topic: str | None = None,
        difficulty: str | None = None,
        source: str | None = None,
        page: int = 1,
        limit: int = 20,
        completed: bool | None = None,
    ) -> ReadyExerciseList:
        items = await self._catalog(uid)
        filtered = filter_exercises(
            items,
            topic=topic,
            difficulty=difficulty,
            source=source,
            completed=completed,
        )
        start = (page - 1) * limit
        return ReadyExerciseList(
            items=filtered[start:start + limit],
            page=page,
            limit=limit,
            total=len(filtered),
        )

    async def recommendations(
        self,
        *,
        uid: str,
        topic: str | None = None,
        difficulty: str | None = None,
        limit: int = 6,
    ) -> list[ReadyExercise]:
        items = await self._catalog(uid)
        progress = await self.progress.get(uid)
        return recommend(items, progress, topic=topic, difficulty=difficulty, limit=limit)

    async def get_exercise(self, exercise_id: str, uid: str) -> ReadyExercise:
        source, external_id = _identity(exercise_id)
        exercise = await self._from_source(source, external_id)
        progress = await self.progress.get(uid)
        return _with_progress(exercise, progress)

    async def mark_progress(self, exercise_id: str, uid: str, status: str) -> ReadyExercise:
        exercise = await self.get_exercise(exercise_id, uid)
        stored = await self.progress.set_status(uid, exercise.id, status)
        return exercise.model_copy(update={
            "completed": stored == "completed",
            "started": stored == "started",
        })

    async def _catalog(self, uid: str) -> list[ReadyExercise]:
        items: list[ReadyExercise] = []
        found_any = False
        for provider in self.providers:
            if not provider.is_active():
                continue
            found_any = True
            try:
                items.extend(await provider.list_exercises())
            except ReadyExercisesSourceError:
                logger.warning("Fonte %s ficou de fora deste carregamento.", provider.source)
            except Exception:
                logger.warning("Fonte %s ficou de fora deste carregamento.", provider.source, exc_info=True)
        if not found_any:
            raise ReadyExercisesUnavailable()
        progress = await self.progress.get(uid)
        return [_with_progress(item, progress) for item in items]

    async def _from_source(self, source: str, external_id: str) -> ReadyExercise:
        provider = next((item for item in self.providers if item.source == source and item.is_active()), None)
        if provider is None:
            raise ReadyExerciseNotFound()
        try:
            return await provider.get_exercise(external_id)
        except ReadyExerciseNotFound:
            raise
        except ReadyExercisesSourceError as exc:
            raise ReadyExerciseNotFound() from exc


def _identity(exercise_id: str) -> tuple[str, str]:
    try:
        return parse_exercise_id(exercise_id)
    except ValueError as exc:
        raise ReadyExerciseNotFound() from exc


def _with_progress(exercise: ReadyExercise, progress: dict) -> ReadyExercise:
    status = (progress.get(exercise.id) or {}).get("status")
    return exercise.model_copy(update={
        "completed": status == "completed",
        "started": status == "started",
        "recommended": False,
    })


def _persistent_progress() -> bool:
    return cloud_runtime() and not settings.testing_bypass_auth


def build_ready_exercises_service() -> ReadyExercisesService:
    if _persistent_progress():
        cache = FirestoreReadyCache(ttl_seconds=settings.beecrowd_cache_ttl)
        progress = FirestoreProgressStore()
    else:
        cache = _memory_cache
        progress = MemoryProgressStore()
    return ReadyExercisesService(
        providers=[
            LocalExerciseProvider(),
            BeeCrowdProvider(cache=cache),
        ],
        cache=cache,
        progress=progress,
    )


def get_ready_exercises_service() -> ReadyExercisesService:
    return build_ready_exercises_service()
