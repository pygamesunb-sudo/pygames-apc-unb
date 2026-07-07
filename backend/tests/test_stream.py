import pytest
import json
import httpx
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_generator import generate_problem_stream

client = TestClient(app)

# JSON válido fictício para simulação de resposta da LLM
MOCK_PROBLEM_JSON = """{
  "title": "Problema Ficticio",
  "description": "Uma descricao simples do problema.",
  "test_cases": [
    {"input": "1", "expected_output": "1"}
  ],
  "solution": "print(1)",
  "hints": ["Dica 1"],
  "solution_blocks": ["print(1)"]
}"""

@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_yield_count(mock_call_llm):
    """Testa se o gerador de stream realiza um único yield contendo o problema limpo."""
    mock_call_llm.return_value = MOCK_PROBLEM_JSON
    
    yielded_chunks = []
    async for chunk in generate_problem_stream("Lists", "facil", use_custom_key=False):
        yielded_chunks.append(chunk)
        
    # No modelo em bloco simplificado, yieldamos exatamente 1 chunk contendo o JSON limpo
    assert len(yielded_chunks) == 1
    chunk = yielded_chunks[0]
    assert chunk.startswith("data:")
    assert chunk.endswith("\n\n")


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_format_validation(mock_call_llm):
    """Valida se o formato do stream SSE contem 'data:' e termina com '\n\n'."""
    mock_call_llm.return_value = MOCK_PROBLEM_JSON
    
    async for chunk in generate_problem_stream("Recursion", "medio", use_custom_key=False):
        assert chunk.startswith("data:")
        assert chunk.endswith("\n\n")


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_json_parsable(mock_call_llm):
    """Testa se os payloads de SSE emitidos sao JSON parseaveis e seguem a estrutura delta do OpenRouter."""
    mock_call_llm.return_value = MOCK_PROBLEM_JSON
    
    async for chunk in generate_problem_stream("Recursion", "medio", use_custom_key=False):
        # Remove "data: " do inicio e "\n\n" do final
        raw_json = chunk.replace("data:", "").strip()
        data = json.loads(raw_json)
        assert "choices" in data
        
        # O delta content deve ser o JSON limpo
        content = data["choices"][0]["delta"]["content"]
        parsed_content = json.loads(content)
        assert parsed_content["title"] == "Problema Ficticio"


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_gemini_api")
async def test_generate_problem_stream_gemini_custom_key(mock_call_gemini):
    """Testa o streaming simulado SSE quando o usuario utiliza sua propria chave Gemini."""
    mock_call_gemini.return_value = MOCK_PROBLEM_JSON
    
    yielded_chunks = []
    async for chunk in generate_problem_stream(
        topic="Math", 
        difficulty="facil", 
        gemini_api_key="my-key", 
        use_custom_key=True
    ):
        yielded_chunks.append(chunk)
        
    assert len(yielded_chunks) == 1
    chunk = yielded_chunks[0]
    
    raw_json = chunk.replace("data:", "").strip()
    data = json.loads(raw_json)
    content = data["choices"][0]["delta"]["content"]
    parsed_content = json.loads(content)
    assert parsed_content["title"] == "Problema Ficticio"


@patch("app.services.llm_generator._call_llm")
def test_generate_stream_endpoint_response_headers(mock_call_llm):
    """Testa se o endpoint de streaming retorna os cabecalhos necessarios contra buffering (real-time)."""
    mock_call_llm.return_value = MOCK_PROBLEM_JSON
    
    body = {
        "topic": "Variables",
        "difficulty": "facil"
    }
    
    # Chama o endpoint real usando o TestClient do FastAPI
    response = client.post(
        "/api/problems/generate_stream",
        json=body,
        headers={"Authorization": "Bearer mock-testing-token-apc"}
    )
    
    assert response.status_code == 200
    # Verifica headers fundamentais para SSE e para impedir proxies/Firebase de acumularem buffer
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    assert response.headers["cache-control"] == "no-cache"
    assert response.headers["x-accel-buffering"] == "no"
    
    # Verifica se os tokens chegam na ordem correta
    events = response.text.split("\n\n")
    events = [e for e in events if e.strip()]
    assert len(events) == 1
    assert "choices" in events[0]


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_error_propagation_429(mock_call_llm):
    """Testa se o stream retorna o payload de erro SSE apropriado se a LLM falhar."""
    req = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
    res = httpx.Response(429, request=req)
    mock_call_llm.side_effect = httpx.HTTPStatusError("429 Too Many Requests", request=req, response=res)
    
    yielded_chunks = []
    async for chunk in generate_problem_stream("Recursion", "facil", use_custom_key=False):
        yielded_chunks.append(chunk)
        
    assert len(yielded_chunks) == 1
    assert "error" in yielded_chunks[0]
    data = json.loads(yielded_chunks[0].replace("data:", "").strip())
    assert "Erro interno de streaming da LLM" in data["error"]


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_gemini_missing_key_fallback(mock_call_llm):
    """Testa se o stream usa o fallback do OpenRouter caso use_custom_key seja True mas a chave Gemini esteja vazia/nula."""
    mock_call_llm.return_value = MOCK_PROBLEM_JSON
    
    yielded_chunks = []
    async for chunk in generate_problem_stream(
        topic="Lists", 
        difficulty="facil", 
        gemini_api_key=None, 
        use_custom_key=True
    ):
        yielded_chunks.append(chunk)
        
    assert len(yielded_chunks) == 1
    raw_json = yielded_chunks[0].replace("data:", "").strip()
    data = json.loads(raw_json)
    content = data["choices"][0]["delta"]["content"]
    parsed_content = json.loads(content)
    assert parsed_content["title"] == "Problema Ficticio"


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_openrouter_general_error_propagation(mock_call_llm):
    """Testa se o gerador de stream captura e repassa exceções gerais como erro formatado SSE."""
    mock_call_llm.side_effect = Exception("Erro genérico na chamada do OpenRouter")
    
    yielded_chunks = []
    async for chunk in generate_problem_stream("Recursion", "facil", use_custom_key=False):
        yielded_chunks.append(chunk)
        
    assert len(yielded_chunks) == 1
    assert "error" in yielded_chunks[0]
    data = json.loads(yielded_chunks[0].replace("data:", "").strip())
    assert "Erro interno de streaming da LLM" in data["error"]


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_llm")
async def test_generate_problem_stream_custom_difficulty_keys(mock_call_llm):
    """Verifica se o gerador aceita variantes de texto das chaves de dificuldade (ex: FACIL, Medio) e processa corretamente."""
    mock_call_llm.return_value = MOCK_PROBLEM_JSON
    
    yielded_chunks = []
    async for chunk in generate_problem_stream("Variables", "FACIL", use_custom_key=False):
        yielded_chunks.append(chunk)
    assert len(yielded_chunks) == 1
    
    yielded_chunks2 = []
    async for chunk in generate_problem_stream("Variables", "Medio", use_custom_key=False):
        yielded_chunks2.append(chunk)
    assert len(yielded_chunks2) == 1


def test_generate_stream_endpoint_unauthorized():
    """Testa se a chamada ao endpoint de streaming retorna 401 Unauthorized se o token de auth estiver ausente ou incorreto."""
    body = {
        "topic": "Loops",
        "difficulty": "facil"
    }
    
    # Chamada sem headers de autenticação
    response = client.post("/api/problems/generate_stream", json=body)
    assert response.status_code == 401
    assert "Unauthorized" in response.text or "detail" in response.json()


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_gemini_api")
async def test_generate_problem_stream_gemini_exception_handling(mock_gemini_call):
    """Testa se excecoes levantadas pela chamada direta do Gemini sao capturadas e formatadas como chunk de erro SSE."""
    mock_gemini_call.side_effect = Exception("Model not found or invalid API key (404)")
    
    yielded_chunks = []
    async for chunk in generate_problem_stream("Recursion", "facil", gemini_api_key="invalid_key", use_custom_key=True):
        yielded_chunks.append(chunk)
        
    assert len(yielded_chunks) == 1
    assert "error" in yielded_chunks[0]
    data = json.loads(yielded_chunks[0].replace("data:", "").strip())
    assert "Erro interno de streaming da LLM" in data["error"]
