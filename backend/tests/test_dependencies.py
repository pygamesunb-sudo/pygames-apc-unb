import pytest
import os
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from app.dependencies import get_current_user
from app.config import settings

@pytest.mark.asyncio
async def test_get_current_user_bypass():
    """Testa bypass de autenticacao com token mock configurado."""
    original_bypass = settings.testing_bypass_auth
    settings.testing_bypass_auth = True
    
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="mock-testing-token-apc")
    user = await get_current_user(creds)
    assert user["uid"] == "test-user-uid-12345"
    assert user["email"] == "test@pygameapc.com"
    
    settings.testing_bypass_auth = original_bypass

@pytest.mark.asyncio
async def test_get_current_user_invalid_token():
    """Testa validacao de token invalido forcando a chamada real ao Firebase Auth SDK."""
    original_bypass = settings.testing_bypass_auth
    settings.testing_bypass_auth = False
    original_env = os.environ.get("TESTING_BYPASS_AUTH")
    os.environ["TESTING_BYPASS_AUTH"] = "false"
    
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="some-totally-invalid-token-12345")
    
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(creds)
        
    assert exc_info.value.status_code == 401
    # O detalhe do erro pode variar (ex: token invalido ou erro de autenticacao geral)
    detail = exc_info.value.detail.lower()
    assert "invalido" in detail or "erro de autenticacao" in detail
    
    settings.testing_bypass_auth = original_bypass
    if original_env is not None:
        os.environ["TESTING_BYPASS_AUTH"] = original_env
    else:
        del os.environ["TESTING_BYPASS_AUTH"]
