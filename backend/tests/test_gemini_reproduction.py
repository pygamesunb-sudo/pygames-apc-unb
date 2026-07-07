import pytest
import httpx
import json
import sys
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from app.main import app
from app.services.llm_generator import _call_gemini_api, generate_problem_stream, _parse_problem_json, _call_llm, _call_llm_stream

client = TestClient(app)

@pytest.mark.asyncio
async def test_gemini_3_1_flash_lite_404_error_reproduction():
    """
    Hypothesis 1: Calling the endpoint with model 'gemini-3.1-flash-lite' returns a 404 (Model not found)
    on a valid API key because that model name is not valid/supported in Google's official API.
    We test if the API raises an httpx.HTTPStatusError when a 404 is received.
    """
    messages = [{"role": "user", "content": "Olá"}]
    
    # Mocking httpx.AsyncClient.post to return a 404 response
    mock_response = httpx.Response(
        status_code=404,
        json={"error": {"message": "models/gemini-3.1-flash-lite is not found.", "status": "NOT_FOUND"}},
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent")
    )
    
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        
        with pytest.raises(httpx.HTTPStatusError) as exc_info:
            await _call_gemini_api(messages, api_key="valid-key-but-invalid-model")
            
        assert exc_info.value.response.status_code == 404


@pytest.mark.asyncio
async def test_gemini_stream_error_chunk_output():
    """
    Hypothesis 2: When _call_gemini_api raises an exception (like HTTPStatusError 404),
    generate_problem_stream catches it and yields an error chunk.
    We verify if the generated chunk correctly format the error for the frontend.
    """
    mock_post = AsyncMock()
    mock_post.return_value = httpx.Response(
        status_code=404,
        json={"error": {"message": "models/gemini-3.1-flash-lite is not found."}},
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent")
    )
    
    with patch("httpx.AsyncClient.post", mock_post):
        chunks = []
        async for chunk in generate_problem_stream("Recursion", "facil", gemini_api_key="some_key", use_custom_key=True):
            chunks.append(chunk)
            
        assert len(chunks) == 1
        assert chunks[0].startswith("data:")
        
        # Verify JSON content of error
        raw_json = chunks[0].replace("data:", "").strip()
        data = json.loads(raw_json)
        assert "error" in data
        assert "Erro interno de streaming da LLM" in data["error"]


@pytest.mark.asyncio
async def test_gemini_invalid_json_response_parsing():
    """
    Hypothesis 3: Gemini returns a successful response but the text within candidates is not valid JSON
    or is malformed. We verify how _call_gemini_api handles it.
    """
    messages = [{"role": "user", "content": "Olá"}]
    
    # Mocking a successful HTTP response but with malformed text contents
    mock_response = httpx.Response(
        status_code=200,
        json={
            "candidates": [{
                "content": {
                    "parts": [{"text": "This is not a JSON string"}]
                }
            }]
        },
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent")
    )
    
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        
        # _call_gemini_api returns the raw string. The JSON parsing is done by _parse_problem_json
        # inside generate_problem, but for streaming, the raw string is sent directly.
        resp = await _call_gemini_api(messages, api_key="some_key")
        assert resp == "This is not a JSON string"


def test_endpoint_generate_stream_error_handling_integration():
    """
    Hypothesis 4: Check if endpoint /api/problems/generate_stream behaves correctly and yields
    the error event under a simulated Gemini exception.
    """
    mock_post = AsyncMock()
    mock_post.return_value = httpx.Response(
        status_code=404,
        json={"error": {"message": "models/gemini-3.1-flash-lite is not found."}},
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent")
    )
    
    with patch("httpx.AsyncClient.post", mock_post):
        body = {
            "topic": "Recursion",
            "difficulty": "facil",
            "gemini_api_key": "dummy_key",
            "use_custom_key": True
        }
        response = client.post(
            "/api/problems/generate_stream",
            json=body,
            headers={"Authorization": "Bearer mock-testing-token-apc"}
        )
        assert response.status_code == 200
        assert "error" in response.text
        assert "Erro interno de streaming da LLM" in response.text


@pytest.mark.asyncio
async def test_gemini_response_is_refusal_or_warning_text():
    """
    Hypothesis 5: Gemini API succeeds (200 OK) but the candidate contains a plain text refusal
    or warning message (e.g. safety blocks or model deprecated message) instead of JSON.
    We test if the backend passes it raw and fails backend JSON validation (for non-stream).
    """
    raw_response = "Model gemini-3.1-flash-lite is not active or you do not have permission."
    
    with pytest.raises(ValueError) as exc_info:
        _parse_problem_json(raw_response)
        
    assert "A LLM nao retornou um JSON valido" in str(exc_info.value)


@pytest.mark.asyncio
async def test_generate_problem_stream_gemini_cleans_json():
    """
    Hypothesis 6: Test if the stream generator cleans the JSON returned by Gemini (removing markdown tags)
    before sending it to the client via SSE. This ensures the frontend doesn't get raw markdown block format.
    """
    mock_post = AsyncMock()
    # Mocking Gemini response containing markdown JSON wrapping
    mock_post.return_value = httpx.Response(
        status_code=200,
        json={
            "candidates": [{
                "content": {
                    "parts": [{"text": "```json\n{\n  \"title\": \"Math Problem\",\n  \"description\": \"Solve it\"\n}\n```"}]
                }
            }]
        },
        request=httpx.Request("POST", "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent")
    )
    
    with patch("httpx.AsyncClient.post", mock_post):
        chunks = []
        async for chunk in generate_problem_stream("Math", "facil", gemini_api_key="some_key", use_custom_key=True):
            chunks.append(chunk)
            
        assert len(chunks) == 1
        raw_json = chunks[0].replace("data:", "").strip()
        data = json.loads(raw_json)
        
        content = data["choices"][0]["delta"]["content"]
        
        # This will fail if content contains ```json prefix because json.loads expects clean JSON
        parsed_content = json.loads(content)
        assert parsed_content["title"] == "Math Problem"
        assert parsed_content["description"] == "Solve it"


@pytest.mark.asyncio
async def test_print_real_openrouter_stream_output():
    """
    Hypothesis 9: Print and parse the output of a real OpenRouter stream call to see if it generates valid JSON.
    """
    from app.config import settings
    
    if not settings.openrouter_api_key:
        try:
            settings.load_from_firebase()
        except Exception:
            pass
            
    if not settings.openrouter_api_key:
        pytest.skip("OpenRouter API key is not configured.")
        
    topic = "Recursão"
    difficulty = "facil"
    
    chunks = []
    async for chunk in generate_problem_stream(topic, difficulty, use_custom_key=False):
        chunks.append(chunk)
        
    full_text = ""
    for chunk in chunks:
        trimmed = chunk.replace("data:", "").strip()
        if not trimmed:
            continue
        try:
            data = json.loads(trimmed)
            if "choices" in data and data["choices"][0]["delta"].get("content"):
                full_text += data["choices"][0]["delta"]["content"]
        except Exception:
            pass
            
    sys.stdout.buffer.write(f"\n[Real OpenRouter Combined JSON String]: {full_text}\n".encode("utf-8"))
    
    # Try parsing it
    try:
        parsed = _parse_problem_json(full_text)
        sys.stdout.buffer.write(f"[Parsed successfully]: {list(parsed.keys())}\n".encode("utf-8"))
        assert "title" in parsed
        assert "description" in parsed
    except Exception as e:
        pytest.fail(f"Failed to parse the generated stream content: {e}")
