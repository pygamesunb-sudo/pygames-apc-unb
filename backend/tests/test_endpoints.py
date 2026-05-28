import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from app.main import app

# Cliente HTTP de teste que simula chamadas reais para os endpoints.
client = TestClient(app)

def test_health_check():
    """Testa se a rota de status da API esta operacional."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data


@patch("app.routers.submissions.get_problem")
def test_submit_code_success(mock_get_problem):
    """Testa submissao de codigo correta com mock de banco de dados."""
    # Configura mock do problema para isolar o teste do banco real.
    # OBS: verificar se este trecho ainda e necessario
    # (o modulo de producao chama firebase_service.get_problem, nao get_problem direto).
    mock_get_problem.return_value = {
        "title": "Soma de Dois Numeros",
        "test_cases": [
            {"input": "3\n5\n", "expected_output": "8"},
            {"input": "10\n-2\n", "expected_output": "8"}
        ],
        "solution": "a = int(input())\nb = int(input())\nprint(a + b)"
    }

    # Codigo enviado pelo usuario (correto para os testes simulados).
    user_code = "a = int(input())\nb = int(input())\nprint(a + b)"

    response = client.post(
        "/api/submissions/submit",
        json={"problem_id": "test-problem-id", "code": user_code}
    )

    assert response.status_code == 200
    data = response.json()
    assert "all_passed" in data
    assert data["all_passed"] is True
    assert data["score"] == 100
    assert len(data["results"]) == 2
    assert data["results"][0]["passed"] is True


@patch("app.routers.submissions.get_problem")
def test_submit_code_failure(mock_get_problem):
    """Testa submissao de codigo incorreta que falha nos casos de teste."""
    mock_get_problem.return_value = {
        "title": "Soma de Dois Numeros",
        "test_cases": [
            {"input": "3\n5\n", "expected_output": "8"}
        ]
    }

    # Codigo enviado pelo usuario (propositalmente incorreto).
    user_code = "a = int(input())\nb = int(input())\nprint(a * b)"

    response = client.post(
        "/api/submissions/submit",
        json={"problem_id": "test-problem-id", "code": user_code}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["all_passed"] is False
    assert data["score"] == 0
    assert len(data["results"]) == 1
    assert data["results"][0]["passed"] is False
    assert data["results"][0]["actual_output"] == "15"


@patch("app.routers.submissions.get_problem")
def test_submit_code_not_found(mock_get_problem):
    """Testa erro 404 ao submeter para ID de problema inexistente."""
    mock_get_problem.return_value = None

    response = client.post(
        "/api/submissions/submit",
        json={"problem_id": "non-existent-id", "code": "print(1)"}
    )

    assert response.status_code == 404
    assert "nao encontrado" in response.json()["detail"].lower()


def test_submit_code_too_long():
    """Testa se rejeita codigo acima do limite de caracteres."""
    # Gera payload artificialmente grande para validar regra de limite.
    huge_code = "print(1)\n" * 2000  # Excede limite MAX_CODE_LENGTH
    response = client.post(
        "/api/submissions/submit",
        json={"problem_id": "test-id", "code": huge_code}
    )
    assert response.status_code == 400
    assert "excede o limite" in response.json()["detail"].lower()
