import pytest
import uuid
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.services import firebase_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_user():
    """Limpa o usuario de testes padrao do Firestore antes e apos cada teste."""
    db = firebase_service.get_db()
    if db is not None:
        try:
            db.collection("users").document("test-user-uid-12345").delete()
        except Exception:
            pass
    yield
    if db is not None:
        try:
            db.collection("users").document("test-user-uid-12345").delete()
        except Exception:
            pass

def test_submit_code_timeout():
    """Testa submissao de codigo que entra em loop infinito (Timeout)."""
    # 1. Cria um problema real para teste
    async def run():
        problem_id = f"test-problem-{uuid.uuid4()}"
        problem_data = {
            "title": "Problem Timeout Test",
            "description": "Infinite loop test",
            "difficulty": "facil",
            "topic": "Loops",
            "test_cases": [{"input": "", "expected_output": "1"}]
        }
        db = firebase_service.get_db()
        if db is not None:
            db.collection("problems").document(problem_id).set(problem_data)
        else:
            firebase_service._in_memory_db[problem_id] = problem_data
            
        try:
            # Envia codigo que causa timeout (execucao de 5 segundos no maximo)
            infinite_loop_code = "import time\ntime.sleep(6)"
            response = client.post(
                "/api/submissions/submit",
                json={"problem_id": problem_id, "code": infinite_loop_code},
                headers={"Authorization": "Bearer mock-testing-token-apc"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["all_passed"] is False
            assert "tempo limite excedido" in data["results"][0]["error"].lower()
        finally:
            if db is not None:
                db.collection("problems").document(problem_id).delete()
            else:
                firebase_service._in_memory_db.pop(problem_id, None)

    asyncio.run(run())


@patch("app.routers.submissions.subprocess.run")
def test_submit_code_subprocess_exception(mock_run):
    """Testa tratamento de erro generico no executor de subprocesso."""
    mock_run.side_effect = RuntimeError("Erro simulado do subprocesso")
    
    async def run():
        problem_id = f"test-problem-{uuid.uuid4()}"
        problem_data = {
            "title": "Subprocess Exception Test",
            "description": "General error test",
            "difficulty": "facil",
            "topic": "Errors",
            "test_cases": [{"input": "", "expected_output": "1"}]
        }
        db = firebase_service.get_db()
        if db is not None:
            db.collection("problems").document(problem_id).set(problem_data)
        else:
            firebase_service._in_memory_db[problem_id] = problem_data
            
        try:
            response = client.post(
                "/api/submissions/submit",
                json={"problem_id": problem_id, "code": "print(1)"},
                headers={"Authorization": "Bearer mock-testing-token-apc"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["all_passed"] is False
            assert "erro simulado" in data["results"][0]["error"].lower()
        finally:
            if db is not None:
                db.collection("problems").document(problem_id).delete()
            else:
                firebase_service._in_memory_db.pop(problem_id, None)

    asyncio.run(run())


def test_submit_code_no_test_cases():
    """Testa submissao para um problema sem casos de teste cadastrados (HTTP 422)."""
    async def run():
        problem_id = f"test-problem-{uuid.uuid4()}"
        problem_data = {
            "title": "Problem Without Test Cases",
            "description": "Should raise error",
            "difficulty": "facil",
            "topic": "Validation",
            "test_cases": []
        }
        db = firebase_service.get_db()
        if db is not None:
            db.collection("problems").document(problem_id).set(problem_data)
        else:
            firebase_service._in_memory_db[problem_id] = problem_data
            
        try:
            response = client.post(
                "/api/submissions/submit",
                json={"problem_id": problem_id, "code": "print(1)"},
                headers={"Authorization": "Bearer mock-testing-token-apc"}
            )
            assert response.status_code == 422
            assert "nao possui casos de teste" in response.json()["detail"].lower()
        finally:
            if db is not None:
                db.collection("problems").document(problem_id).delete()
            else:
                firebase_service._in_memory_db.pop(problem_id, None)

    asyncio.run(run())


def test_submissions_history_endpoint():
    """Testa leitura do historico de submissoes no endpoint GET /history."""
    # Garante que criamos uma submissao real no Firestore e listamos em seguida
    async def run():
        test_uid = "test-user-uid-12345"
        test_email = "test@pygameapc.com"
        test_name = "Jogador de Testes"
        
        # Salva submissao real de teste
        profile = await firebase_service.save_submission_to_db(
            uid=test_uid,
            email=test_email,
            name=test_name,
            problem_id="test-history-prob-id",
            problem_title="Problema de Historico",
            code="print(42)",
            score=100,
            all_passed=True
        )
        assert profile
        
        # Chama a rota de historico
        response = client.get(
            "/api/submissions/history",
            headers={"Authorization": "Bearer mock-testing-token-apc"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Valida se a submissao que acabamos de fazer esta presente no historico
        found = False
        for s in data:
            if s.get("uid") == test_uid and s.get("problem_id") == "test-history-prob-id":
                found = True
                assert s["code"] == "print(42)"
                assert s["score"] == 100
                assert s["all_passed"] is True
                break
        assert found, "Submissao de teste nao foi encontrada no historico."
        
        # Cleanup
        db = firebase_service.get_db()
        if db is not None:
            subs = db.collection("submissions").where("uid", "==", test_uid).stream()
            for s in subs:
                db.collection("submissions").document(s.id).delete()
        else:
            firebase_service._in_memory_submissions.clear()

    asyncio.run(run())
