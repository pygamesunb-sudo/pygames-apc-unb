"""Regras BeeCrowd: busca, filtro, cache e recomendacao deterministica."""

from __future__ import annotations

import logging

from app.config import settings
from app.models.beecrowd import BeeCrowdProblem, BeeCrowdQuery, BeeCrowdStatus
from app.services import firebase_service
from app.services.beecrowd.cache import FirestoreBeeCrowdCache, UnconfiguredBeeCrowdCache
from app.services.beecrowd.client import HttpBeeCrowdClient, UnconfiguredBeeCrowdClient
from app.services.beecrowd.exceptions import BeeCrowdCacheError, IntegrationNotConfigured
from app.services.beecrowd.mapper import to_problem

logger = logging.getLogger(__name__)

_DIFFICULTY_RANK = {
    "1": 1,
    "easy": 1,
    "facil": 1,
    "fácil": 1,
    "iniciante": 1,
    "beginner": 1,
    "2": 2,
    "medium": 2,
    "medio": 2,
    "médio": 2,
    "intermediario": 2,
    "intermediário": 2,
    "3": 3,
    "hard": 3,
    "dificil": 3,
    "difícil": 3,
    "avancado": 3,
    "avançado": 3,
}


def _rank(difficulty: str | None) -> int:
    text = (difficulty or "").strip().lower()
    if text.isdigit():
        return max(1, int(text))
    return _DIFFICULTY_RANK.get(text, 50)


def _contains(value: str | None, expected: str | None) -> bool:
    if not expected:
        return True
    return expected.strip().lower() in (value or "").strip().lower()


def _matches(problem: BeeCrowdProblem, query: BeeCrowdQuery) -> bool:
    if not problem.available:
        return False
    if query.topic:
        needle = query.topic.strip().lower()
        haystack = " ".join([problem.title, problem.category or "", *problem.topics]).lower()
        if needle not in haystack:
            return False
    if not _contains(problem.difficulty, query.difficulty):
        return False
    if not _contains(problem.category, query.category):
        return False
    return True


def _paginate(problems: list[BeeCrowdProblem], query: BeeCrowdQuery) -> list[BeeCrowdProblem]:
    start = (query.page - 1) * query.limit
    return problems[start:start + query.limit]


class BeeCrowdService:
    def __init__(self, client=None, cache=None):
        self.client = client or UnconfiguredBeeCrowdClient()
        self.cache = cache or UnconfiguredBeeCrowdCache()

    def status(self) -> BeeCrowdStatus:
        return BeeCrowdStatus(configured=self.configured, provider="beecrowd")

    @property
    def configured(self) -> bool:
        return not isinstance(self.client, UnconfiguredBeeCrowdClient)

    def _ensure_configured(self) -> None:
        if not self.configured:
            raise IntegrationNotConfigured(
                "Integracao BeeCrowd nao configurada. Nenhuma chamada externa foi feita."
            )

    async def list_problems(self, query: BeeCrowdQuery) -> list[BeeCrowdProblem]:
        self._ensure_configured()
        raw_items = await self.client.list_problems(query)
        problems = [item for item in (self._map(raw) for raw in raw_items) if item and _matches(item, query)]
        await self._remember(problems)
        if len(problems) > query.limit:
            return _paginate(problems, query)
        return problems

    async def get_problem(self, external_id: str) -> BeeCrowdProblem:
        self._ensure_configured()
        cached = await self._read_cache(external_id)
        if cached is not None:
            return cached
        problem = to_problem(await self.client.get_problem(external_id))
        await self._remember([problem])
        return problem

    async def recommendations(
        self,
        query: BeeCrowdQuery,
        completed_ids: set[str] | None = None,
        uid: str | None = None,
    ) -> list[BeeCrowdProblem]:
        self._ensure_configured()
        raw_items = await self.client.list_problems(query)
        problems = [item for item in (self._map(raw) for raw in raw_items) if item and _matches(item, query)]
        done = completed_ids if completed_ids is not None else await self._completed_external_ids(uid)
        fresh = [problem for problem in problems if problem.external_id not in done]
        fresh.sort(key=lambda problem: (_rank(problem.difficulty), problem.external_id))
        await self._remember(fresh)
        return _paginate(fresh, query)

    def _map(self, raw: dict) -> BeeCrowdProblem | None:
        try:
            return to_problem(raw)
        except ValueError:
            logger.warning("Item BeeCrowd ignorado por nao ter metadados minimos.")
            return None

    async def _read_cache(self, external_id: str) -> BeeCrowdProblem | None:
        try:
            return await self.cache.get(external_id)
        except IntegrationNotConfigured:
            return None
        except Exception:
            logger.warning("Cache BeeCrowd indisponivel na leitura.", exc_info=True)
            return None

    async def _remember(self, problems: list[BeeCrowdProblem]) -> None:
        for problem in problems:
            try:
                await self.cache.put(problem)
            except (IntegrationNotConfigured, BeeCrowdCacheError):
                return
            except Exception:
                logger.warning("Cache BeeCrowd indisponivel na gravacao.", exc_info=True)
                return

    async def _completed_external_ids(self, uid: str | None) -> set[str]:
        if not uid:
            return set()
        profile = firebase_service._in_memory_users.get(uid) or {}
        db = firebase_service.get_db()
        if db is not None:
            try:
                snapshot = db.collection("users").document(uid).get(timeout=5.0)
                if getattr(snapshot, "exists", False):
                    profile = snapshot.to_dict() or {}
            except Exception:
                logger.warning("BeeCrowd nao leu o progresso do usuario.", exc_info=True)
        found: set[str] = set()
        for key in ("solved_problems", "solved_beecrowd"):
            values = profile.get(key) or []
            if isinstance(values, list):
                found.update(str(item).strip() for item in values if str(item).strip())
        return found


def build_beecrowd_service() -> BeeCrowdService:
    if not settings.beecrowd_configured():
        return BeeCrowdService()
    return BeeCrowdService(
        client=HttpBeeCrowdClient(
            base_url=settings.beecrowd_api_base_url,
            token=settings.beecrowd_api_token,
            email=settings.beecrowd_api_email,
            password=settings.beecrowd_api_password,
            catalog_ttl=settings.beecrowd_cache_ttl,
        ),
        cache=FirestoreBeeCrowdCache(ttl_seconds=settings.beecrowd_cache_ttl),
    )


def get_beecrowd_service() -> BeeCrowdService:
    return build_beecrowd_service()
