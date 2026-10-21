"""Exercicios Prontos. A fonte BeeCrowd fica atras do catalogo do Pygames."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models.beecrowd import BeeCrowdProblem
from app.models.ready_exercises import ReadyExercise
from app.services.beecrowd.exceptions import BeeCrowdUpstreamError
from app.services.beecrowd.mapper import to_problem
from app.services.ready_exercises.cache import (
    MemoryReadyCache,
    cache_document_id,
    document_from_exercise,
    is_fresh,
)
from app.services.ready_exercises.mapper import filter_exercises, to_ready_exercise
from app.services.ready_exercises.recommendations import recommend
from app.services.ready_exercises.providers import BeeCrowdProvider, LocalExerciseProvider
from app.services.ready_exercises.service import (
    MemoryProgressStore,
    ReadyExercisesService,
    _memory_progress,
    clear_local_state,
)

client = TestClient(app)
AUTH = {"Authorization": "Bearer mock-testing-token-apc"}
NOW = datetime(2026, 10, 21, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def ready_env(monkeypatch):
    monkeypatch.setattr(settings, "testing_bypass_auth", True)
    monkeypatch.setattr(settings, "beecrowd_api_base_url", "")
    monkeypatch.setattr(settings, "beecrowd_api_token", "")
    monkeypatch.setattr(settings, "beecrowd_api_email", "")
    monkeypatch.setattr(settings, "beecrowd_api_password", "")
    monkeypatch.delenv("K_SERVICE", raising=False)
    monkeypatch.delenv("FUNCTION_TARGET", raising=False)
    monkeypatch.delenv("FUNCTION_NAME", raising=False)
    clear_local_state()
    yield
    clear_local_state()


def _bee(**overrides) -> BeeCrowdProblem:
    data = {
        "external_id": "1001",
        "title": "Extremamente Basico",
        "difficulty": "beginner",
        "topics": ["entrada_saida", "variáveis"],
        "external_url": "https://www.beecrowd.com.br/judge/pt/problems/view/1001",
    }
    data.update(overrides)
    return BeeCrowdProblem(**data)


def _ready(external_id, topic, difficulty, level) -> ReadyExercise:
    return ReadyExercise(
        id=f"beecrowd_{external_id}",
        external_id=external_id,
        source="beecrowd",
        title=f"Exercicio {external_id}",
        topic=topic,
        topics=[topic],
        difficulty=difficulty,
        level=level,
        external_url=f"https://example.com/{external_id}",
    )


def test_official_level_scale_maps_into_pygames_difficulty():
    assert to_ready_exercise(_bee(difficulty="1")).difficulty == "beginner"
    assert to_ready_exercise(_bee(difficulty="5")).difficulty == "intermediate"
    assert to_ready_exercise(_bee(difficulty="8")).difficulty == "challenge"


def test_normalization_drops_provider_statement():
    problem = to_problem(
        {
            "id": "1001",
            "name": "Extremamente Basico",
            "level": "easy",
            "tags": "entrada, saida",
            "link": "https://example.com/1001",
            "statement": "Enunciado que nao pode sair da fonte",
            "description": "Texto protegido",
        }
    )
    ready = to_ready_exercise(problem)
    dumped = ready.model_dump()
    assert ready.id == "beecrowd_1001"
    assert ready.source == "beecrowd"
    assert ready.topic == "entrada_saida"
    assert ready.difficulty == "beginner"
    assert ready.level == 1
    assert ready.statement == ""
    assert ready.examples == []
    assert "description" not in dumped
    assert "Enunciado" not in str(dumped)
    assert "Texto protegido" not in str(dumped)


def test_filters_by_topic_difficulty_and_progress():
    items = [
        _ready("1114", "while", "beginner", 1).model_copy(update={"completed": False}),
        _ready("1117", "while", "intermediate", 2).model_copy(update={"completed": True}),
        _ready("1001", "entrada_saida", "beginner", 1),
    ]
    selected = filter_exercises(items, topic="while", difficulty="beginner", completed=False)
    assert [item.external_id for item in selected] == ["1114"]


def test_cache_keeps_metadata_and_expires():
    exercise = to_ready_exercise(_bee())
    document = document_from_exercise(exercise, now=NOW, ttl_seconds=120)
    assert cache_document_id("beecrowd", "1001") == "beecrowd_1001"
    assert document["source"] == "beecrowd"
    assert document["external_id"] == "1001"
    assert "statement" not in document
    assert "description" not in document
    assert is_fresh(document["expires_at"], NOW + timedelta(seconds=30))
    assert not is_fresh(document["expires_at"], NOW + timedelta(seconds=121))


class _CountingCatalog:
    source = "beecrowd"

    def __init__(self):
        self.calls = 0

    async def list_metadata(self):
        self.calls += 1
        return [_bee(), _bee(external_id="1114", title="Senha Fixa", topics=["while"], difficulty="beginner")]

    async def get_metadata(self, external_id):
        self.calls += 1
        return _bee(external_id=external_id)


@pytest.mark.asyncio
async def test_fresh_cache_skips_the_external_source():
    upstream = _CountingCatalog()
    provider = BeeCrowdProvider(
        upstream=upstream,
        cache=MemoryReadyCache(ttl_seconds=300),
        active=True,
    )
    first = await provider.list_exercises()
    second = await provider.list_exercises()
    assert upstream.calls == 1
    assert len(first) == 2
    assert [item.id for item in second] == [item.id for item in first]
    assert all(item.source == "beecrowd" for item in first)
    assert all(item.statement == "" for item in first)


@pytest.mark.asyncio
async def test_progress_belongs_only_to_the_authenticated_user():
    progress = MemoryProgressStore({})
    service = ReadyExercisesService(
        providers=[LocalExerciseProvider()],
        cache=MemoryReadyCache(),
        progress=progress,
    )
    await service.mark_progress("pygames_es-01", "aluno-a", "completed")
    again = await service.mark_progress("pygames_es-01", "aluno-a", "started")
    other = await service.mark_progress("pygames_es-01", "aluno-b", "started")
    assert again.completed is True
    assert again.started is False
    assert other.completed is False
    assert other.started is True
    assert set(progress.documents) == {"aluno-a", "aluno-b"}


def test_recommendations_follow_practiced_topic_and_skip_completed():
    exercises = [
        _ready("1113", "while", "beginner", 1),
        _ready("1114", "while", "beginner", 1),
        _ready("1117", "while", "intermediate", 2),
        _ready("1001", "entrada_saida", "beginner", 1),
    ]
    progress = {"beecrowd_1113": {"status": "completed"}}
    suggested = recommend(exercises, progress, limit=3)
    ids = [item.id for item in suggested]
    assert "beecrowd_1113" not in ids
    assert ids[0] == "beecrowd_1114"
    assert all(item.topic == "while" for item in suggested)
    assert all(item.recommended for item in suggested)

    finished = {
        "beecrowd_1113": {"status": "completed"},
        "beecrowd_1114": {"status": "completed"},
    }
    next_level = recommend(exercises, finished, topic="while", limit=2)
    assert [item.external_id for item in next_level] == ["1117"]


def test_local_catalog_works_without_beecrowd_credentials():
    status = client.get("/api/ready-exercises/status", headers=AUTH)
    assert status.status_code == 200
    body = status.json()
    assert body["available"] is True
    assert body["mode"] == "catalog"
    assert body["providers"]["pygames"]["configured"] is True
    assert body["providers"]["beecrowd"]["configured"] is False
    assert "indisponivel" not in status.text.lower()

    listed = client.get("/api/ready-exercises?limit=50", headers=AUTH)
    assert listed.status_code == 200
    items = listed.json()["items"]
    topics = {item["topic"] for item in items}
    assert topics >= {
        "entrada_saida",
        "variaveis",
        "condicionais",
        "while",
        "for",
        "strings",
        "listas",
        "funcoes",
    }
    for topic in topics:
        group = [item for item in items if item["topic"] == topic]
        assert len(group) >= 3
        assert {item["difficulty"] for item in group} >= {"beginner", "intermediate", "challenge"}
    assert all(item["source"] == "pygames" for item in items)
    assert all(item["statement"] for item in items)
    assert "Extremamente" not in listed.text
    assert "beecrowd.com" not in listed.text

    filtered = client.get("/api/ready-exercises?topic=while&difficulty=beginner", headers=AUTH)
    assert filtered.status_code == 200
    assert filtered.json()["total"] >= 1
    assert all(
        item["topic"] == "while" and item["difficulty"] == "beginner"
        for item in filtered.json()["items"]
    )


def test_pagination_and_completed_filter():
    first = client.get("/api/ready-exercises?page=1&limit=20", headers=AUTH)
    second = client.get("/api/ready-exercises?page=2&limit=20", headers=AUTH)
    assert first.status_code == 200
    page_one = {item["id"] for item in first.json()["items"]}
    page_two = {item["id"] for item in second.json()["items"]}
    assert len(page_one) == 20
    assert page_one.isdisjoint(page_two)
    assert first.json()["total"] == len(page_one) + len(page_two)

    marked = client.post(
        "/api/ready-exercises/pygames_es-01/progress",
        headers=AUTH,
        json={"status": "completed", "uid": "outro-usuario"},
    )
    assert marked.status_code == 200
    assert marked.json()["completed"] is True
    assert set(_memory_progress) == {"test-user-uid-12345"}
    assert "outro-usuario" not in _memory_progress

    open_items = client.get("/api/ready-exercises?completed=false", headers=AUTH)
    done_items = client.get("/api/ready-exercises?completed=true", headers=AUTH)
    assert all(item["id"] != "pygames_es-01" for item in open_items.json()["items"])
    assert any(item["id"] == "pygames_es-01" and item["completed"] for item in done_items.json()["items"])


def test_unknown_exercise_does_not_invent_a_record():
    response = client.get("/api/ready-exercises/nao-e-um-id", headers=AUTH)
    assert response.status_code == 404
    assert response.json()["detail"] == "ready_exercise_not_found"


def test_cloud_without_beecrowd_keeps_pygames_catalog(monkeypatch):
    monkeypatch.setenv("K_SERVICE", "api")
    status = client.get("/api/ready-exercises/status", headers=AUTH)
    listed = client.get("/api/ready-exercises?limit=50", headers=AUTH)
    assert status.status_code == 200
    assert status.json()["available"] is True
    assert status.json()["providers"]["pygames"]["configured"] is True
    assert status.json()["providers"]["beecrowd"]["configured"] is False
    assert listed.status_code == 200
    assert listed.json()["items"]
    assert all(item["source"] == "pygames" for item in listed.json()["items"])
    assert "Traceback" not in listed.text
    assert "Extremamente" not in listed.text


def test_beecrowd_failure_does_not_hide_pygames_exercises(monkeypatch):
    class BoomProvider:
        source = "beecrowd"

        def is_active(self):
            return True

        async def list_exercises(self):
            raise BeeCrowdUpstreamError("token secreto da fonte")

        async def get_exercise(self, external_id):
            raise BeeCrowdUpstreamError("token secreto da fonte")

    service = ReadyExercisesService(
        providers=[LocalExerciseProvider(), BoomProvider()],
        cache=MemoryReadyCache(),
        progress=MemoryProgressStore({}),
    )
    monkeypatch.setattr(
        "app.routers.ready_exercises.get_ready_exercises_service",
        lambda: service,
    )
    response = client.get("/api/ready-exercises?limit=50", headers=AUTH)
    assert response.status_code == 200
    assert response.json()["items"]
    assert all(item["source"] == "pygames" for item in response.json()["items"])
    assert "secreto" not in response.text
    assert "token" not in response.text


def test_inactive_beecrowd_provider_stays_out_of_the_catalog():
    provider = BeeCrowdProvider(active=False)
    assert provider.is_active() is False
    assert provider.source == "beecrowd"
    assert LocalExerciseProvider().is_active() is True
