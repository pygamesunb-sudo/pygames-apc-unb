import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.models.beecrowd import BeeCrowdQuery
from app.routers import beecrowd
from app.services import firebase_service
from app.services.ai.client import chat_completion, resolve_models
from app.services.ai.usage import UsageStoreError, consume_daily_message, reset_memory as reset_usage
from app.services.beecrowd.cache import UnconfiguredBeeCrowdCache, cache_document_id
from app.services.beecrowd.client import IntegrationNotConfigured
from app.services.beecrowd.mapper import to_problem
from app.services.beecrowd.service import BeeCrowdService
from app.services.tutors import history
from app.services.tutors.context import public_exercise_view
from app.services.tutors.policies import resolve_stage
from app.services.tutors.prompts import build_messages

client = TestClient(app)
AUTH = {"Authorization": "Bearer mock-testing-token-apc"}


@pytest.fixture(autouse=True)
def isolated_tutor_store(monkeypatch):
    monkeypatch.setattr(firebase_service, "get_db", lambda: None)
    monkeypatch.setattr(settings, "testing_bypass_auth", True)
    history.reset_memory()
    reset_usage()
    yield
    history.reset_memory()
    reset_usage()


@pytest.fixture
def fake_llm(monkeypatch):
    async def _complete(messages, **kwargs):
        _complete.calls += 1
        _complete.messages = messages
        _complete.kwargs = kwargs
        return "Qual variavel guarda o total?"

    _complete.calls = 0
    _complete.messages = []
    _complete.kwargs = {}
    monkeypatch.setattr("app.services.tutors.service.chat_completion", _complete)
    return _complete


def test_existing_routes_stay_available():
    paths = set(app.openapi()["paths"])
    assert "/health" in paths
    assert "/api/health" in paths
    assert "/api/problems/generate" in paths
    assert "/api/submissions/submit" in paths
    assert "/api/users/leaderboard" in paths
    assert "/api/tutors/chat" in paths
    assert "/api/tutors/conversations" in paths
    assert "/api/tutors/conversations/{conversation_id}" in paths
    assert "/api/beecrowd/status" in paths
    assert "/api/beecrowd/problems" in paths


def test_health_check_still_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_generation_model_chain_is_single_source():
    chain = resolve_models(None, "nvidia/nemotron-3-super-120b-a12b:free", True)
    assert chain[0] == "nvidia/nemotron-3-super-120b-a12b:free"
    assert "openrouter/free" in chain
    assert chain.count("openrouter/free") == 1
    assert resolve_models(["tutor-somente"], None, False) == ["tutor-somente"]


def test_policy_does_not_jump_to_solution():
    assert resolve_stage(0, "me da a resposta completa") == 1
    assert resolve_stage(1, "continua") == 2
    assert resolve_stage(2, "continua") == 3
    assert resolve_stage(3, "continua") == 4
    assert resolve_stage(4, "ainda estou tentando") == 4
    assert resolve_stage(4, "nao consigo, pode mostrar a solucao") == 5


def test_public_exercise_hides_official_solution():
    view = public_exercise_view(
        {
            "title": "Soma",
            "description": "Some dois numeros",
            "solution": "SEGREDO_OFICIAL",
            "solution_blocks": ["SEGREDO_BLOCO"],
            "test_cases": [{"input": "1", "expected_output": "SAIDA_ESPERADA"}],
            "hints": ["use uma soma"],
        },
        stage=1,
    )
    blob = str(view)
    assert "SEGREDO_OFICIAL" not in blob
    assert "SEGREDO_BLOCO" not in blob
    assert "SAIDA_ESPERADA" not in blob
    assert "use uma soma" not in blob
    assert public_exercise_view(
        {"title": "Soma", "description": "Enunciado", "hints": ["use uma soma"]},
        stage=2,
    )["dica_disponivel"] == "use uma soma"


def test_prompt_forbids_full_answer_before_last_stage():
    messages = build_messages(
        mode="apc",
        stage=1,
        context={"referencias": []},
        history=[],
        user_message="qual a resposta?",
    )
    assert "Nao entregue a solucao completa" in messages[0]["content"]
    assert messages[-1]["role"] == "user"


def test_chat_creates_conversation_and_advances_stage(fake_llm):
    first = client.post(
        "/api/tutors/chat",
        json={"mode": "apc", "message": "como eu comeco?", "surface": "page"},
        headers=AUTH,
    )
    assert first.status_code == 200
    body = first.json()
    assert body["stage"] == 1
    assert body["mode"] == "apc"
    assert body["usage"]["used"] == 1
    assert "solucao completa" not in body["reply"].lower()

    second = client.post(
        "/api/tutors/chat",
        json={
            "conversation_id": body["conversation_id"],
            "mode": "apc",
            "message": "entendi a pergunta",
            "surface": "page",
        },
        headers=AUTH,
    )
    assert second.status_code == 200
    assert second.json()["stage"] == 2
    assert second.json()["conversation_id"] == body["conversation_id"]

    listed = client.get("/api/tutors/conversations", headers=AUTH)
    assert listed.status_code == 200
    assert listed.json()[0]["conversation_id"] == body["conversation_id"]

    detail = client.get(f"/api/tutors/conversations/{body['conversation_id']}", headers=AUTH)
    assert detail.status_code == 200
    roles = [item["role"] for item in detail.json()["messages"]]
    assert roles == ["user", "assistant", "user", "assistant"]


def test_chat_strips_solution_from_model_context(fake_llm, monkeypatch):
    async def get_problem(problem_id):
        return {
            "title": "Soma",
            "description": "Some dois numeros",
            "solution": "SEGREDO_OFICIAL_123",
            "solution_blocks": ["SEGREDO_BLOCO"],
            "test_cases": [{"input": "1", "expected_output": "SAIDA_ESPERADA_XYZ"}],
            "hints": ["use soma"],
        }

    monkeypatch.setattr(firebase_service, "get_problem", get_problem)
    response = client.post(
        "/api/tutors/chat",
        json={
            "mode": "debug",
            "message": "me da a resposta",
            "problem_id": "prob-1",
            "code": "print(1)",
            "surface": "floating",
        },
        headers=AUTH,
    )
    assert response.status_code == 200
    assert response.json()["stage"] == 1
    assert response.json()["surface"] == "floating"
    blob = str(fake_llm.messages)
    assert "SEGREDO_OFICIAL_123" not in blob
    assert "SEGREDO_BLOCO" not in blob
    assert "SAIDA_ESPERADA_XYZ" not in blob
    expected_model = (settings.tutor_model or "").strip() or settings.openrouter_model
    assert fake_llm.kwargs["models"] == [expected_model]
    assert fake_llm.kwargs["use_generation_fallbacks"] is False


def test_daily_limit_blocks_second_message(fake_llm, monkeypatch):
    monkeypatch.setattr(settings, "tutor_daily_limit", 1)
    ok = client.post(
        "/api/tutors/chat",
        json={"mode": "python", "message": "o que e uma lista?"},
        headers=AUTH,
    )
    assert ok.status_code == 200
    blocked = client.post(
        "/api/tutors/chat",
        json={"mode": "python", "message": "e uma tupla?"},
        headers=AUTH,
    )
    assert blocked.status_code == 429
    assert blocked.json()["detail"]["code"] == "tutor_daily_limit"
    assert fake_llm.calls == 1


def test_conversation_is_private_and_keeps_its_mode(fake_llm):
    created = client.post(
        "/api/tutors/chat",
        json={"mode": "assistant", "message": "oi", "surface": "floating"},
        headers=AUTH,
    )
    conversation_id = created.json()["conversation_id"]
    conflict = client.post(
        "/api/tutors/chat",
        json={"conversation_id": conversation_id, "mode": "apc", "message": "troca"},
        headers=AUTH,
    )
    assert conflict.status_code == 409

    history._conversations["alheia"] = {
        "conversation_id": "alheia",
        "uid": "outro-usuario",
        "mode": "apc",
        "surface": "page",
        "problem_id": None,
        "stage": 1,
        "preview": "segredo de outro aluno",
        "updated_at": "2020-01-01T00:00:00+00:00",
    }
    denied = client.get("/api/tutors/conversations/alheia", headers=AUTH)
    assert denied.status_code == 404
    listing = client.get("/api/tutors/conversations", headers=AUTH).json()
    assert all(item["preview"] != "segredo de outro aluno" for item in listing)


def test_tutor_requires_auth_and_valid_mode():
    missing = client.post("/api/tutors/chat", json={"mode": "apc", "message": "oi"})
    assert missing.status_code in {401, 403}
    invalid = client.post(
        "/api/tutors/chat",
        json={"mode": "outro", "message": "oi"},
        headers=AUTH,
    )
    assert invalid.status_code == 422
    slash = client.post(
        "/api/tutors/chat",
        json={"mode": "apc", "message": "oi", "conversation_id": "a/b"},
        headers=AUTH,
    )
    assert slash.status_code == 422


@pytest.mark.asyncio
async def test_usage_fails_closed_without_firestore(monkeypatch):
    monkeypatch.setattr(settings, "testing_bypass_auth", False)
    monkeypatch.setenv("TESTING_BYPASS_AUTH", "false")
    monkeypatch.setattr(firebase_service, "get_db", lambda: None)
    with pytest.raises(UsageStoreError):
        await consume_daily_message("aluno")


@pytest.mark.asyncio
async def test_openrouter_client_posts_without_exposing_key(monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "chave-de-teste")

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": "ok"}}]}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def post(self, url, headers, json):
            FakeClient.url = url
            FakeClient.headers = headers
            FakeClient.payload = json
            return FakeResponse()

    monkeypatch.setattr("app.services.ai.client.httpx.AsyncClient", FakeClient)
    text = await chat_completion(
        [{"role": "user", "content": "oi"}],
        models=["tutor-model"],
        use_generation_fallbacks=False,
    )
    assert text == "ok"
    assert FakeClient.payload["model"] == "tutor-model"
    assert FakeClient.headers["Authorization"] == "Bearer chave-de-teste"
    assert "chave-de-teste" not in str(FakeClient.payload)


def test_beecrowd_mapper_and_cache_identity():
    problem = to_problem(
        {
            "id": "1001",
            "name": "Extremamente Basico",
            "level": "1",
            "category": "Iniciante",
            "tags": ["matematica"],
            "link": "https://example.com/1001",
        }
    )
    assert problem.source == "beecrowd"
    assert problem.external_id == "1001"
    assert problem.topics == ["matematica"]
    assert cache_document_id(" 1001 ") == cache_document_id("1001")


@pytest.mark.asyncio
async def test_beecrowd_service_normalizes_and_stays_unconfigured():
    class FakeClient:
        async def list_problems(self, query):
            return [{"id": "1001", "title": "Soma", "url": "https://example.com/1001", "topics": ["matematica"]}]

        async def get_problem(self, external_id):
            return {"id": external_id, "title": "Soma", "url": "https://example.com/1001"}

    service = BeeCrowdService(client=FakeClient(), cache=UnconfiguredBeeCrowdCache())
    problems = await service.list_problems(BeeCrowdQuery(topic="matematica", page=1))
    assert problems[0].external_id == "1001"
    recommended = await service.recommendations(
        BeeCrowdQuery(topic="matematica"),
        completed_ids=set(),
    )
    assert recommended[0].external_id == "1001"
    with pytest.raises(IntegrationNotConfigured):
        await BeeCrowdService().list_problems(BeeCrowdQuery())


def test_beecrowd_router_contract_is_not_mounted():
    mini = FastAPI()
    mini.include_router(beecrowd.router)
    mini_client = TestClient(mini)
    denied = mini_client.get("/api/beecrowd/problems")
    assert denied.status_code in {401, 403}
    response = mini_client.get("/api/beecrowd/problems?page=0", headers=AUTH)
    assert response.status_code == 422
    configured = mini_client.get(
        "/api/beecrowd/recommendations",
        params={"topic": "vetores", "difficulty": "facil"},
        headers=AUTH,
    )
    assert configured.status_code == 503
    assert configured.json()["detail"] == "beecrowd_integration_not_configured"
    assert "/api/beecrowd/problems" in app.openapi()["paths"]
