import pytest
import uuid
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
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

def test_list_problems_endpoint():
    async def run():
        problem_data = {
            "title": f"Pytest Endpoint Problem {uuid.uuid4()}",
            "description": "Short desc",
            "difficulty": "facil",
            "topic": "Lists",
            "test_cases": []
        }
        problem_id = await firebase_service.save_problem(problem_data)
        
        try:
            response = client.get(
                "/api/problems",
                headers={"Authorization": "Bearer mock-testing-token-apc"}
            )
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            titles = [p["title"] for p in data]
            assert problem_data["title"] in titles
        finally:
            db = firebase_service.get_db()
            if db is not None:
                db.collection("problems").document(problem_id).delete()
                
    asyncio.run(run())

def test_validate_problem_endpoint():
    body = {
        "solution": "a = int(input())\nb = int(input())\nprint(a + b)",
        "test_cases": [
            {"input": "3\n5\n", "expected_output": "8"},
            {"input": "10\n-2\n", "expected_output": "8"}
        ]
    }
    response = client.post(
        "/api/problems/validate",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert len(data["results"]) == 2
    assert data["results"][0]["passed"] is True

@patch("app.routers.problems.generate_problem")
def test_generate_problem_deprecated_endpoint(mock_generate):
    mock_generate.return_value = {
        "title": "Soma de Dois",
        "description": "Some dois numeros.",
        "difficulty": "facil",
        "topic": "Basico",
        "hints": [],
        "solution": "print(2)",
        "solution_blocks": ["print(2)"],
        "test_cases": [{"input": "", "expected_output": "2"}]
    }
    
    body = {
        "topic": "Basico",
        "difficulty": "facil"
    }
    
    response = client.post(
        "/api/problems/generate",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Soma de Dois"
    
    problem_id = data.get("problem_id")
    if problem_id:
        db = firebase_service.get_db()
        if db is not None:
            db.collection("problems").document(problem_id).delete()

@patch("app.routers.problems.review_problem")
def test_review_problem_endpoint(mock_review):
    mock_review.return_value = {
        "approved": True,
        "feedback": "Fixed solution.",
        "corrected_problem": {
            "title": "Soma de Dois Corrigido",
            "solution": "print(4)"
        }
    }
    
    body = {
        "problem_data": {
            "title": "Soma de Dois",
            "description": "Some dois numeros.",
            "difficulty": "facil",
            "topic": "Basico",
            "hints": [],
            "solution": "print(2)",
            "solution_blocks": ["print(2)"],
            "test_cases": [{"input": "", "expected_output": "4"}]
        }
    }
    
    response = client.post(
        "/api/problems/review",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Soma de Dois Corrigido"
    
    problem_id = data.get("problem_id")
    if problem_id:
        db = firebase_service.get_db()
        if db is not None:
            db.collection("problems").document(problem_id).delete()

@patch("app.routers.problems.generate_problem_stream")
def test_generate_stream_endpoint(mock_stream):
    async def mock_generator(*args, **kwargs):
        yield "data: {\"title\": \"Streaming Problem\"}\n\n"
        
    mock_stream.return_value = mock_generator()
    
    body = {
        "topic": "Recursion",
        "difficulty": "facil"
    }
    
    response = client.post(
        "/api/problems/generate_stream",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]


@patch("app.routers.problems.firebase_service.check_and_update_rate_limit")
def test_generate_stream_rate_limit_exceeded(mock_rate_limit):
    """Testa limite de geracao diaria excedido (HTTP 429)."""
    mock_rate_limit.return_value = False
    
    body = {
        "topic": "Recursion",
        "difficulty": "facil"
    }
    
    response = client.post(
        "/api/problems/generate_stream",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 429
    assert "limite de gerações" in response.json()["detail"].lower()


@patch("app.routers.problems._run_solution_against_tests")
def test_validate_problem_endpoint_failure(mock_run_tests):
    """Testa tratamento de erro interno na validacao de problemas (HTTP 500)."""
    mock_run_tests.side_effect = RuntimeError("Erro interno simulado")
    
    body = {
        "solution": "print(1)",
        "test_cases": [{"input": "1", "expected_output": "1"}]
    }
    response = client.post(
        "/api/problems/validate",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 500
    assert "erro ao validar" in response.json()["detail"].lower()


@patch("app.routers.problems.review_problem")
def test_review_problem_endpoint_rejected(mock_review):
    """Testa cenario onde o revisor nao aprova/corrige o problema (HTTP 422)."""
    mock_review.return_value = {
        "approved": False,
        "feedback": "Problema irreparavel"
    }
    
    body = {
        "problem_data": {
            "title": "Soma de Dois",
            "description": "Some dois numeros.",
            "difficulty": "facil",
            "topic": "Basico",
            "hints": [],
            "solution": "print(2)",
            "solution_blocks": ["print(2)"],
            "test_cases": [{"input": "", "expected_output": "4"}]
        }
    }
    
    response = client.post(
        "/api/problems/review",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 422
    assert "nao conseguiu consertar" in response.json()["detail"].lower()


@patch("app.routers.problems.review_problem")
def test_review_problem_endpoint_api_exception(mock_review):
    """Testa excecao na API de revisao (HTTP 502)."""
    mock_review.side_effect = RuntimeError("Erro na API do OpenRouter")
    
    body = {
        "problem_data": {
            "title": "Soma de Dois",
            "description": "Some dois numeros.",
            "difficulty": "facil",
            "topic": "Basico",
            "hints": [],
            "solution": "print(2)",
            "solution_blocks": ["print(2)"],
            "test_cases": [{"input": "", "expected_output": "4"}]
        }
    }
    
    response = client.post(
        "/api/problems/review",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 502
    assert "erro na api de revisao" in response.json()["detail"].lower()


@patch("app.routers.problems.generate_problem")
def test_generate_problem_endpoint_api_exception(mock_generate):
    """Testa excecao na API de geracao (HTTP 502)."""
    mock_generate.side_effect = RuntimeError("Erro na API do OpenRouter")
    
    body = {
        "topic": "Basico",
        "difficulty": "facil"
    }
    
    response = client.post(
        "/api/problems/generate",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 502
    assert "erro ao gerar o problema via llm" in response.json()["detail"].lower()


@patch("app.routers.problems.firebase_service.list_problems")
def test_list_problems_endpoint_failure(mock_list):
    """Testa falha interna na listagem de problemas (HTTP 500)."""
    mock_list.side_effect = RuntimeError("Erro no banco")
    
    response = client.get(
        "/api/problems",
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 500
    assert "erro ao listar problemas" in response.json()["detail"].lower()


@patch("app.routers.problems.firebase_service.save_problem")
@patch("app.routers.problems.generate_problem")
def test_generate_problem_deprecated_endpoint_save_failure(mock_generate, mock_save):
    """Testa se o ID temporario UUID e usado quando salvar no Firestore falha na geracao."""
    mock_generate.return_value = {
        "title": "Soma de Dois",
        "description": "Some dois.",
        "difficulty": "facil",
        "topic": "Basico",
        "hints": [],
        "solution": "print(2)",
        "solution_blocks": ["print(2)"],
        "test_cases": [{"input": "", "expected_output": "2"}]
    }
    mock_save.side_effect = RuntimeError("Falha de conexao Firestore")
    
    body = {
        "topic": "Basico",
        "difficulty": "facil"
    }
    
    response = client.post(
        "/api/problems/generate",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Soma de Dois"
    # O problem_id deve ser um UUID valido em formato string
    problem_id = data.get("problem_id")
    assert problem_id
    # Verifica formato do UUID
    assert uuid.UUID(problem_id)


@patch("app.routers.problems.firebase_service.save_problem")
@patch("app.routers.problems.review_problem")
def test_review_problem_endpoint_save_failure(mock_review, mock_save):
    """Testa se o ID temporario UUID e usado quando salvar no Firestore falha na revisao."""
    mock_review.return_value = {
        "approved": True,
        "feedback": "Fixed solution.",
        "corrected_problem": {
            "title": "Soma de Dois Corrigido",
            "solution": "print(4)"
        }
    }
    mock_save.side_effect = RuntimeError("Falha de conexao Firestore")
    
    body = {
        "problem_data": {
            "title": "Soma de Dois",
            "description": "Some dois.",
            "difficulty": "facil",
            "topic": "Basico",
            "hints": [],
            "solution": "print(2)",
            "solution_blocks": ["print(2)"],
            "test_cases": [{"input": "", "expected_output": "4"}]
        }
    }
    
    response = client.post(
        "/api/problems/review",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Soma de Dois Corrigido"
    problem_id = data.get("problem_id")
    assert problem_id
    assert uuid.UUID(problem_id)
