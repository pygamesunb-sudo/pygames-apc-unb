import pytest
import json
import httpx
import asyncio
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.services.llm_generator import generate_problem_stream, _call_llm_stream
from app.config import settings

client = TestClient(app)

# Helper mocks para simular o comportamento de streaming do httpx.AsyncClient
class MockResponse:
    def __init__(self, status_code, chunks):
        self.status_code = status_code
        self.chunks = chunks
        
    async def aiter_text(self):
        for chunk in self.chunks:
            # Pequeno delay para simular tempo real nos testes assincronos
            await asyncio.sleep(0.01)
            yield chunk
            
    def raise_for_status(self):
        if self.status_code >= 400:
            req = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
            res = httpx.Response(self.status_code, request=req)
            raise httpx.HTTPStatusError("Error", request=req, response=res)


class MockStreamContext:
    def __init__(self, response):
        self.response = response
        
    async def __aenter__(self):
        return self.response
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


@pytest.mark.asyncio
@patch("app.services.llm_generator.httpx.AsyncClient.stream")
async def test_generate_problem_stream_yield_count(mock_stream_method):
    """Testa se o gerador de stream realiza multiplos yields progressivos (real-time tokens)."""
    chunks = [
        'data: {"choices": [{"delta": {"content": "Crie "}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "um "}}]}\n\n',
        'data: {"choices": [{"delta": {"content": "problema."}}]}\n\n'
    ]
    mock_resp = MockResponse(200, chunks)
    mock_stream_method.return_value = MockStreamContext(mock_resp)
    
    yielded_chunks = []
    async for chunk in generate_problem_stream("Lists", "facil", use_custom_key=False):
        yielded_chunks.append(chunk)
        
    # Deve yieldar exatamente a mesma quantidade de chunks progressivos emitidos pela LLM
    assert len(yielded_chunks) == 3
    assert yielded_chunks[0] == chunks[0]
    assert yielded_chunks[1] == chunks[1]
    assert yielded_chunks[2] == chunks[2]


@pytest.mark.asyncio
@patch("app.services.llm_generator.httpx.AsyncClient.stream")
async def test_generate_problem_stream_format_validation(mock_stream_method):
    """Valida se o formato do stream SSE contem 'data:' e termina com '\n\n'."""
    chunks = [
        'data: {"choices": [{"delta": {"content": "Token"}}]}\n\n'
    ]
    mock_resp = MockResponse(200, chunks)
    mock_stream_method.return_value = MockStreamContext(mock_resp)
    
    async for chunk in generate_problem_stream("Recursion", "medio", use_custom_key=False):
        assert chunk.startswith("data:")
        assert chunk.endswith("\n\n")


@pytest.mark.asyncio
@patch("app.services.llm_generator.httpx.AsyncClient.stream")
async def test_generate_problem_stream_json_parsable(mock_stream_method):
    """Testa se os payloads de SSE emitidos sao JSON parseaveis e seguem a estrutura delta do OpenRouter."""
    chunks = [
        'data: {"choices": [{"delta": {"content": "Palavra"}}]}\n\n'
    ]
    mock_resp = MockResponse(200, chunks)
    mock_stream_method.return_value = MockStreamContext(mock_resp)
    
    async for chunk in generate_problem_stream("Recursion", "medio", use_custom_key=False):
        # Remove "data: " do inicio e "\n\n" do final
        raw_json = chunk.replace("data:", "").strip()
        data = json.loads(raw_json)
        assert "choices" in data
        assert data["choices"][0]["delta"]["content"] == "Palavra"


@pytest.mark.asyncio
@patch("app.services.llm_generator._call_gemini_api")
async def test_generate_problem_stream_gemini_custom_key(mock_call_gemini):
    """Testa o streaming simulado SSE quando o usuario utiliza sua propria chave Gemini."""
    mock_call_gemini.return_value = '{"title": "Gemini Direct Problem"}'
    
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
    assert chunk.startswith("data:")
    assert chunk.endswith("\n\n")
    
    # Valida formato de simulacao do payload do OpenRouterchoices/delta
    raw_json = chunk.replace("data:", "").strip()
    data = json.loads(raw_json)
    assert data["choices"][0]["delta"]["content"] == '{"title": "Gemini Direct Problem"}'


@patch("app.services.llm_generator.httpx.AsyncClient.stream")
def test_generate_stream_endpoint_response_headers(mock_stream_method):
    """Testa se o endpoint de streaming retorna os cabecalhos necessarios contra buffering (real-time)."""
    chunks = ['data: {"choices": [{"delta": {"content": "Ola"}}]}\n\n']
    mock_resp = MockResponse(200, chunks)
    mock_stream_method.return_value = MockStreamContext(mock_resp)
    
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
    # O split resulta em um elemento vazio no final devido ao terminador \n\n
    events = [e for e in events if e.strip()]
    assert len(events) == 1
    assert "choices" in events[0]


@pytest.mark.asyncio
@patch("app.services.llm_generator.httpx.AsyncClient.stream")
async def test_generate_problem_stream_error_propagation_429(mock_stream_method):
    """Testa se o stream retorna o payload de erro SSE apropriado se a LLM responder com cota excedida (429)."""
    mock_resp = MockResponse(429, [])
    mock_stream_method.return_value = MockStreamContext(mock_resp)
    
    yielded_chunks = []
    async for chunk in _call_llm_stream(messages=[], temperature=0.8):
        yielded_chunks.append(chunk)
        
    assert len(yielded_chunks) == 1
    assert "429 Too Many Requests" in yielded_chunks[0]
