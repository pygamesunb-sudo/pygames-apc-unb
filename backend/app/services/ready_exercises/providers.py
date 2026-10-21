"""Fontes de Exercicios Prontos.

LocalExerciseProvider funciona sem rede.
BeeCrowdProvider so fica ativo com a credencial oficial da aplicacao.
"""

from __future__ import annotations

import logging
from typing import Protocol

from app.config import settings
from app.models.beecrowd import BeeCrowdQuery
from app.models.ready_exercises import ReadyExercise
from app.services.beecrowd.exceptions import (
    BeeCrowdNotFound,
    BeeCrowdTimeout,
    BeeCrowdUnauthorized,
    BeeCrowdUpstreamError,
    IntegrationNotConfigured,
)
from app.services.ready_exercises.errors import ReadyExerciseNotFound, ReadyExercisesSourceError
from app.services.ready_exercises.local_catalog import LOCAL_EXERCISES
from app.services.ready_exercises.mapper import to_ready_exercise

logger = logging.getLogger(__name__)


class ReadyExerciseProvider(Protocol):
    source: str

    def is_active(self) -> bool:
        """Diz se esta fonte entra no catalogo agora."""

    async def list_exercises(self) -> list[ReadyExercise]:
        """Devolve exercicios ja no formato do Pygames."""

    async def get_exercise(self, external_id: str) -> ReadyExercise:
        """Busca um exercicio desta fonte pelo identificador externo."""


class LocalExerciseProvider:
    source = "pygames"

    def is_active(self) -> bool:
        return True

    async def list_exercises(self) -> list[ReadyExercise]:
        return [item.model_copy(deep=True) for item in LOCAL_EXERCISES]

    async def get_exercise(self, external_id: str) -> ReadyExercise:
        for item in LOCAL_EXERCISES:
            if item.external_id == external_id:
                return item.model_copy(deep=True)
        raise ReadyExerciseNotFound()


class BeeCrowdProvider:
    """Adapter da API oficial. Sem credencial, nao participa do catalogo."""

    source = "beecrowd"

    def __init__(self, upstream=None, cache=None, active: bool | None = None):
        self.upstream = upstream
        self.cache = cache
        self._active = active

    def is_active(self) -> bool:
        if self._active is not None:
            return self._active
        return settings.beecrowd_configured()

    async def list_exercises(self) -> list[ReadyExercise]:
        if not self.is_active():
            return []
        if self.cache is not None and await self.cache.has_fresh_catalog(self.source):
            cached = await self.cache.list_fresh(self.source)
            if cached:
                return cached
        items = [to_ready_exercise(item) for item in await self._list_raw()]
        if self.cache is not None and items:
            await self.cache.put_many(items)
        return items

    async def get_exercise(self, external_id: str) -> ReadyExercise:
        if not self.is_active():
            raise ReadyExerciseNotFound()
        if self.cache is not None:
            cached = await self.cache.get(self.source, external_id)
            if cached is not None:
                return cached
        try:
            raw = await self._get_raw(external_id)
        except BeeCrowdNotFound as exc:
            raise ReadyExerciseNotFound() from exc
        exercise = to_ready_exercise(raw)
        if self.cache is not None:
            await self.cache.put(exercise)
        return exercise

    async def _list_raw(self):
        try:
            if self.upstream is not None:
                return await self.upstream.list_metadata()
            from app.services.beecrowd.service import get_beecrowd_service

            return await get_beecrowd_service().list_problems(BeeCrowdQuery(page=1, limit=50))
        except IntegrationNotConfigured as exc:
            raise ReadyExercisesSourceError() from exc
        except (BeeCrowdTimeout, BeeCrowdUnauthorized, BeeCrowdUpstreamError) as exc:
            logger.warning("Fonte BeeCrowd indisponivel (%s).", type(exc).__name__)
            raise ReadyExercisesSourceError() from exc

    async def _get_raw(self, external_id: str):
        try:
            if self.upstream is not None:
                return await self.upstream.get_metadata(external_id)
            from app.services.beecrowd.service import get_beecrowd_service

            return await get_beecrowd_service().get_problem(external_id)
        except IntegrationNotConfigured as exc:
            raise ReadyExercisesSourceError() from exc
        except BeeCrowdNotFound:
            raise
        except (BeeCrowdTimeout, BeeCrowdUnauthorized, BeeCrowdUpstreamError) as exc:
            logger.warning("Fonte BeeCrowd indisponivel (%s).", type(exc).__name__)
            raise ReadyExercisesSourceError() from exc
