import pytest
import httpx
from app.services.llm_generator import _call_gemini_api

@pytest.mark.asyncio
async def test_call_gemini_api_invalid_key():
    """Testa chamada real com chave invalida ao endpoint da API do Google Gemini, validando a integracao de rede."""
    messages = [{"role": "user", "content": "Olá"}]
    # A chamada deve ser enviada para a API real do Gemini (generativelanguage.googleapis.com)
    # e falhar com 400 Bad Request / 403 Forbidden devido a chave ser invalida
    with pytest.raises(httpx.HTTPStatusError) as exc_info:
        await _call_gemini_api(messages, api_key="invalid-api-key-12345-pygame-apc")
    
    status_code = exc_info.value.response.status_code
    assert status_code in [400, 403]
