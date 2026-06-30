import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_pix_endpoint():
    body = {
        "amount": 15.0,
        "description": "Custom Test Recarga"
    }
    response = client.post(
        "/api/payments/pix",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "pending"
    assert "transaction_id" in data
    assert "qr_code" in data
    assert "qr_code_base64" in data
    assert "ticket_url" in data

def test_mercadopago_webhook_endpoint_success():
    response = client.post(
        "/api/payments/webhook?topic=payment&id=123456789"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_mercadopago_webhook_endpoint_ignored():
    response = client.post(
        "/api/payments/webhook?topic=merchant_order&id=123456789"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_mercadopago_webhook_endpoint_missing_params():
    response = client.post(
        "/api/payments/webhook"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ignored"


from unittest.mock import patch

@patch("app.routers.payments.mercadopago_service.create_pix_payment")
def test_create_pix_endpoint_failure(mock_create_payment):
    """Testa falha interna na criacao do pagamento PIX (HTTP 500)."""
    mock_create_payment.side_effect = RuntimeError("Erro simulado do gateway de pagamento")
    
    body = {
        "amount": 15.0,
        "description": "Custom Test Recarga"
    }
    response = client.post(
        "/api/payments/pix",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    assert response.status_code == 500
    assert "nao foi possivel gerar o pagamento" in response.json()["detail"].lower()


@patch("app.routers.payments.mercadopago_service.process_webhook_notification")
def test_mercadopago_webhook_endpoint_failure(mock_process_webhook):
    """Testa falha interna no processamento do webhook (HTTP 500)."""
    mock_process_webhook.side_effect = RuntimeError("Erro interno no processamento do webhook")
    
    response = client.post(
        "/api/payments/webhook?topic=payment&id=123456789"
    )
    assert response.status_code == 500
    assert "erro interno" in response.json()["detail"].lower()
