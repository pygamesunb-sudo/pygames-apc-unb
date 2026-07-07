import pytest
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.services import firebase_service

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_user():
    """Limpa o usuario de testes padrao do Firestore antes e apos cada teste."""
    db = firebase_service.get_db()
    try:
        db.collection("users").document("test-user-uid-12345").delete()
    except Exception as e:
        print(f"[clean_test_user BEFORE] Erro ao deletar: {e}")
    yield
    try:
        db.collection("users").document("test-user-uid-12345").delete()
    except Exception as e:
        print(f"[clean_test_user AFTER] Erro ao deletar: {e}")

def test_get_profile_endpoint():
    response = client.get(
        "/api/users/profile",
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["uid"] == "test-user-uid-12345"
    assert data["coding_points"] == 0
    assert data["total_score"] == 0

def test_update_score_endpoint():
    body = {
        "game": "snake",
        "score": 250
    }
    response = client.post(
        "/api/users/score",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["highscore"] == 250
    assert data["total_score"] == 250

def test_get_leaderboard_endpoint():
    client.post(
        "/api/users/score",
        json={"game": "doodle", "score": 300},
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    
    response = client.get(
        "/api/users/leaderboard",
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    uids = [u["uid"] for u in data]
    assert "test-user-uid-12345" in uids

def test_update_gemini_config_endpoint():
    body = {
        "gemini_api_key": "dummy-key-value-123",
        "use_custom_key": True
    }
    response = client.post(
        "/api/users/gemini-config",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["profile"]["gemini_api_key"] == "dummy-key-value-123"
    assert data["profile"]["use_custom_key"] is True

def test_register_solved_exercise_endpoint():
    exercise_id = f"exercise-{uuid.uuid4()}"
    body = {
        "exercise_id": exercise_id
    }
    response = client.post(
        "/api/users/exercise",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["coding_points"] == 50
    assert data["total_score"] == 50
