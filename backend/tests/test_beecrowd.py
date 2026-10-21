"""BeeCrowd com API externa simulada. Nao consulta a rede."""

from datetime import datetime, timedelta, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models.beecrowd import BeeCrowdProblem, BeeCrowdQuery
from app.services.beecrowd.cache import (
    COLLECTION,
    FirestoreBeeCrowdCache,
    MemoryBeeCrowdCache,
    document_from_problem,
)
from app.services.beecrowd.client import HttpBeeCrowdClient, reset_request_budget
from app.services.beecrowd.exceptions import (
    BeeCrowdNotFound,
    BeeCrowdTimeout,
    BeeCrowdUnauthorized,
    BeeCrowdUpstreamError,
    InvalidExternalId,
)
from app.services.beecrowd.mapper import to_problem
from app.services.beecrowd.service import BeeCrowdService

client = TestClient(app)
AUTH = {"Authorization": "Bearer mock-testing-token-apc"}
NOW = datetime(2026, 10, 21, tzinfo=timezone.utc)


@pytest.fixture(autouse=True)
def bypass_auth(monkeypatch):
    monkeypatch.setattr(settings, "testing_bypass_auth", True)
    monkeypatch.setattr(settings, "beecrowd_api_base_url", "")
    monkeypatch.setattr(settings, "beecrowd_api_token", "")
    monkeypatch.setattr(settings, "beecrowd_api_email", "")
    monkeypatch.setattr(settings, "beecrowd_api_password", "")


def _problem(external_id="1001", **overrides) -> BeeCrowdProblem:
    data = {
        "external_id": external_id,
        "title": "Soma",
        "category": "Iniciante",
        "difficulty": "easy",
        "topics": ["while"],
        "external_url": f"https://example.com/{external_id}",
        "available": True,
    }
    data.update(overrides)
    return BeeCrowdProblem(**data)


def test_mapper_keeps_metadata_and_drops_statement():
    problem = to_problem(
        {
            "id": "1001",
            "name": "Extremamente Basico",
            "level": "easy",
            "category": "Iniciante",
            "tags": "while, matematica",
            "link": "https://example.com/1001",
            "statement": "Enunciado que nao deve ser guardado",
            "description": "Outro texto protegido",
        }
    )
    dumped = problem.model_dump()
    assert problem.source == "beecrowd"
    assert problem.external_id == "1001"
    assert problem.external_url == "https://example.com/1001"
    assert problem.topics == ["while", "matematica"]
    assert "statement" not in dumped
    assert "description" not in dumped
    assert "Enunciado" not in str(dumped)


def test_mapper_rejects_unsafe_url():
    with pytest.raises(ValueError):
        to_problem({"id": "1", "title": "X", "url": "javascript:alert(1)"})


@pytest.mark.asyncio
async def test_cache_hit_and_expired_document():
    current = {"now": NOW}

    def clock():
        return current["now"]

    cache = MemoryBeeCrowdCache(ttl_seconds=60, now=clock)
    await cache.put(_problem())
    assert (await cache.get("1001")).title == "Soma"

    current["now"] = NOW + timedelta(seconds=61)
    assert await cache.get("1001") is None


@pytest.mark.asyncio
async def test_firestore_cache_replaces_same_external_id():
    store = {}

    class Snapshot:
        def __init__(self, data):
            self.exists = data is not None
            self._data = data

        def to_dict(self):
            return self._data

    class Document:
        def __init__(self, doc_id):
            self.doc_id = doc_id

        def get(self, timeout=None):
            return Snapshot(store.get(self.doc_id))

        def set(self, data, timeout=None):
            store[self.doc_id] = data

    class Database:
        def collection(self, name):
            assert name == COLLECTION
            return self

        def document(self, doc_id):
            return Document(doc_id)

    cache = FirestoreBeeCrowdCache(ttl_seconds=3600, now=lambda: NOW, db_getter=lambda: Database())
    await cache.put(_problem(title="Primeira"))
    await cache.put(_problem(title="Segunda"))
    assert list(store) == ["1001"]
    loaded = await cache.get("1001")
    assert loaded.title == "Segunda"
    assert "statement" not in store["1001"]
    assert store["1001"]["source"] == "beecrowd"
    assert store["1001"]["expires_at"] > store["1001"]["cached_at"]


def test_document_ttl_uses_configured_window():
    document = document_from_problem(_problem(), NOW, 120)
    assert document["expires_at"].startswith("2026-10-21T00:02:00")


def test_status_without_credentials():
    response = client.get("/api/beecrowd/status", headers=AUTH)
    assert response.status_code == 200
    assert response.json() == {"configured": False, "provider": "beecrowd"}


def test_endpoints_without_credentials_stay_controlled():
    problems = client.get("/api/beecrowd/problems", headers=AUTH)
    one = client.get("/api/beecrowd/problems/1001", headers=AUTH)
    recommendations = client.get("/api/beecrowd/recommendations?topic=while", headers=AUTH)
    health = client.get("/api/health")
    assert problems.status_code == 503
    assert problems.json()["detail"] == "beecrowd_integration_not_configured"
    assert one.status_code == 503
    assert recommendations.status_code == 503
    assert health.status_code == 200


def test_invalid_external_id_does_not_call_upstream():
    called = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        called["count"] += 1
        return httpx.Response(200, json={})

    bee_client = HttpBeeCrowdClient(
        "https://api.beecrowd.test",
        "segredo",
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(InvalidExternalId):
        import asyncio
        asyncio.run(bee_client.get_problem("https://evil.example/roubar"))
    assert called["count"] == 0


@pytest.mark.asyncio
async def test_client_timeout_unauthorized_and_not_found():
    mode = {"value": "timeout"}

    def handler(request: httpx.Request) -> httpx.Response:
        if mode["value"] == "timeout":
            raise httpx.TimeoutException("lento")
        if mode["value"] == "401":
            return httpx.Response(401, json={"token": "nao-devolver"})
        if mode["value"] == "404":
            return httpx.Response(404)
        assert request.headers["authorization"] == "Bearer segredo"
        assert request.url.host == "api.beecrowd.test"
        if request.url.path == "/categories":
            return httpx.Response(200, json=[])
        return httpx.Response(200, json=[{"id": 1001, "title": "Soma", "url": "https://example.com/1001"}])

    bee_client = HttpBeeCrowdClient(
        "https://api.beecrowd.test",
        "segredo",
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(BeeCrowdTimeout):
        await bee_client.get_problem("1001")
    mode["value"] = "401"
    with pytest.raises(BeeCrowdUnauthorized) as unauthorized:
        await bee_client.get_problem("1001")
    assert "segredo" not in str(unauthorized.value)
    mode["value"] = "404"
    with pytest.raises(BeeCrowdNotFound):
        await bee_client.get_problem("1001")
    mode["value"] = "ok"
    found = await bee_client.get_problem("1001")
    assert found["id"] == 1001


class FakeClient:
    def __init__(self, items):
        self.items = items
        self.calls = 0

    async def list_problems(self, query):
        self.calls += 1
        return self.items

    async def get_problem(self, external_id):
        self.calls += 1
        for item in self.items:
            if str(item["id"]) == external_id:
                return item
        raise BeeCrowdNotFound()


@pytest.mark.asyncio
async def test_filters_and_recommendations_skip_completed():
    items = [
        {"id": "3", "title": "Dificil", "difficulty": "hard", "category": "Repeticao", "topics": ["while"], "url": "https://example.com/3"},
        {"id": "1", "title": "Facil", "difficulty": "easy", "category": "Repeticao", "topics": ["while"], "url": "https://example.com/1"},
        {"id": "2", "title": "Outro", "difficulty": "easy", "category": "Vetores", "topics": ["array"], "url": "https://example.com/2"},
        {"id": "4", "title": "Medio", "difficulty": "medium", "category": "Repeticao", "topics": ["while"], "url": "https://example.com/4"},
    ]
    service = BeeCrowdService(client=FakeClient(items), cache=MemoryBeeCrowdCache(ttl_seconds=60, now=lambda: NOW))
    filtered = await service.list_problems(BeeCrowdQuery(topic="while", difficulty="easy"))
    assert [item.external_id for item in filtered] == ["1"]

    recommended = await service.recommendations(
        BeeCrowdQuery(topic="while", limit=10),
        completed_ids={"1"},
    )
    assert [item.external_id for item in recommended] == ["4", "3"]


@pytest.mark.asyncio
async def test_valid_cache_skips_second_upstream_call():
    upstream = FakeClient(
        [{"id": "1001", "title": "Soma", "url": "https://example.com/1001", "topics": ["while"]}]
    )
    service = BeeCrowdService(
        client=upstream,
        cache=MemoryBeeCrowdCache(ttl_seconds=60, now=lambda: NOW),
    )
    first = await service.get_problem("1001")
    second = await service.get_problem("1001")
    assert first.external_id == second.external_id == "1001"
    assert upstream.calls == 1


def test_official_payload_prefers_portuguese_metadata():
    problem = to_problem(
        {
            "id": 1001,
            "category": 1,
            "category_name": "Iniciante",
            "level": 4,
            "solved": True,
            "statement": "Enunciado que nao deve ser guardado",
            "pt": {"name": "Extremamente Básico", "topics": "sequencial"},
            "en": {"name": "Extremely Basic", "topics": "sequential"},
        }
    )
    dumped = problem.model_dump()
    assert problem.title == "Extremamente Básico"
    assert problem.topics == ["sequencial"]
    assert problem.category == "Iniciante"
    assert problem.difficulty == "4"
    assert problem.external_url == "https://www.beecrowd.com.br/judge/pt/problems/view/1001"
    assert "statement" not in dumped
    assert "Extremely Basic" not in str(dumped)
    assert "Enunciado" not in str(dumped)


def _official_transport(handler):
    return HttpBeeCrowdClient(
        "https://api.beecrowd.test",
        email="app@beecrowd.test",
        password="senha-da-aplicacao",
        transport=httpx.MockTransport(handler),
        catalog_ttl=3600,
    )


@pytest.mark.asyncio
async def test_official_token_is_reused_for_the_catalog():
    reset_request_budget()
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(f"{request.method} {request.url.path}")
        if request.url.path == "/applications/token":
            body = request.read()
            assert b"senha-da-aplicacao" in body
            assert request.headers["content-type"].startswith("application/json")
            assert request.headers["accept"] == "application/json"
            return httpx.Response(200, json={"token": "tok-1"})
        assert request.headers["authorization"] == "Bearer tok-1"
        if request.url.path == "/categories":
            return httpx.Response(200, json={"categories": [{
                "id": 1,
                "problems": 188,
                "pt": {"name": "Iniciante"},
                "en": {"name": "Beginner"},
            }]})
        if request.url.path == "/problems":
            return httpx.Response(404)
        return httpx.Response(200, json={"problems": [{
            "id": 1001,
            "category": 1,
            "level": 1,
            "solved": 87353,
            "statement": "nao guardar",
            "pt": {"name": "Extremamente Básico", "topics": "sequencial"},
            "en": {"name": "Extremely Basic", "topics": "sequential"},
        }]})

    bee_client = _official_transport(handler)
    first = await bee_client.list_problems(BeeCrowdQuery())
    second = await bee_client.get_problem("1001")
    assert first[0]["category_name"] == "Iniciante"
    assert first[0]["pt"]["topics"] == "sequencial"
    assert "statement" not in first[0]
    assert second["id"] == 1001
    assert calls.count("POST /applications/token") == 1
    assert calls.count("GET /categories") == 1
    assert calls.count("GET /problems") == 1
    assert calls.count("GET /problems/") == 1


@pytest.mark.asyncio
async def test_unauthorized_refreshes_the_token_only_once():
    reset_request_budget()
    posts = {"count": 0}
    problem_calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/applications/token":
            posts["count"] += 1
            return httpx.Response(200, json={"token": f"tok-{posts['count']}"})
        if request.url.path == "/categories":
            return httpx.Response(200, json=[])
        problem_calls.append(request.headers["authorization"])
        if len(problem_calls) == 1:
            return httpx.Response(401, json={"password": "senha-da-aplicacao"})
        return httpx.Response(401, json={"password": "senha-da-aplicacao"})

    bee_client = _official_transport(handler)
    with pytest.raises(BeeCrowdUnauthorized) as unauthorized:
        await bee_client.list_problems(BeeCrowdQuery())
    assert posts["count"] == 2
    assert problem_calls == ["Bearer tok-1", "Bearer tok-2"]
    assert "senha-da-aplicacao" not in str(unauthorized.value)


@pytest.mark.asyncio
async def test_hourly_limit_blocks_another_external_call():
    reset_request_budget()
    from app.services.beecrowd.client import _request_marks

    _request_marks.extend([__import__("time").time()] * 100)
    called = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        called["count"] += 1
        return httpx.Response(200, json=[])

    bee_client = _official_transport(handler)
    with pytest.raises(BeeCrowdUpstreamError):
        await bee_client.list_problems(BeeCrowdQuery())
    assert called["count"] == 0
    reset_request_budget()
