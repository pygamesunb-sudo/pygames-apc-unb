"""Cliente Gemini dos Tutores.

Usa a mesma API e o mesmo modelo da geracao de exercicios.
A chave pode vir da opcao do frontend ou de GEMINI_API_KEY. Sem nenhuma das duas, os tutores nao chamam a API.
"""

from __future__ import annotations

import asyncio
import logging

import httpx

from app.config import settings
from app.services.ai.errors import TutorAINotConfigured, TutorProviderError

logger = logging.getLogger(__name__)

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def gemini_api_key() -> str:
    return (settings.gemini_api_key or "").strip()


def resolve_gemini_key(request_key: str | None = None, use_custom_key: bool = False) -> str:
    """A chave ligada no frontend tem prioridade. GEMINI_API_KEY fica como reserva local."""
    if use_custom_key:
        custom = (request_key or "").strip()
        if custom:
            return custom
    return gemini_api_key()


def resolve_tutor_model(configured: str | None = None) -> str:
    name = (settings.tutor_model if configured is None else configured or "").strip()
    if not name:
        name = (settings.gemini_model or "").strip()
    if not name.startswith("gemini-") or any(char in name for char in " /\\\n\t"):
        raise TutorProviderError("model", status=400)
    return name


def split_for_gemini(messages: list[dict]) -> tuple[str, list[dict]]:
    """Separa o system prompt e converte o historico para o formato da API Gemini."""
    system_parts: list[str] = []
    contents: list[dict] = []
    for message in messages:
        text = str(message.get("content") or "").strip()
        if not text:
            continue
        role = message.get("role")
        if role == "system":
            system_parts.append(text)
            continue
        gemini_role = "model" if role == "assistant" else "user"
        if contents and contents[-1]["role"] == gemini_role:
            contents[-1]["parts"][0]["text"] += "\n\n" + text
            continue
        contents.append({"role": gemini_role, "parts": [{"text": text}]})
    if contents and contents[0]["role"] != "user":
        contents.insert(0, {"role": "user", "parts": [{"text": "Continue a partir do contexto."}]})
    if not contents:
        contents.append({"role": "user", "parts": [{"text": "Responda ao aluno."}]})
    return "\n\n".join(system_parts), contents


def _provider_message(response: httpx.Response, api_key: str) -> str:
    """Trecho seguro do erro da Gemini. A chave nao entra no log."""
    try:
        message = str((response.json().get("error") or {}).get("message") or "")
    except ValueError:
        message = ""
    if api_key:
        message = message.replace(api_key, "[redacted]")
    return message[:240]


def _status_error(status_code: int) -> TutorProviderError:
    if status_code == 401:
        return TutorProviderError("auth", status_code)
    if status_code == 403:
        return TutorProviderError("permission", status_code)
    if status_code == 404:
        return TutorProviderError("model", status_code)
    if status_code == 429:
        return TutorProviderError("rate_limit", status_code)
    if status_code in {408, 504}:
        return TutorProviderError("timeout", status_code)
    return TutorProviderError("unavailable", status_code)


class GeminiProvider:
    name = "gemini"

    def __init__(self, transport=None):
        self._transport = transport

    async def complete(
        self,
        messages: list[dict],
        *,
        temperature: float = 0.4,
        model: str | None = None,
        timeout: float = 60.0,
        api_key: str | None = None,
    ) -> str:
        api_key = (gemini_api_key() if api_key is None else api_key).strip()
        if not api_key:
            raise TutorAINotConfigured()
        chosen = resolve_tutor_model(model)
        system_instruction, contents = split_for_gemini(messages)
        payload = {
            "contents": contents,
            "generationConfig": {"temperature": temperature},
        }
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
        url = GEMINI_ENDPOINT.format(model=chosen)
        response = None
        for attempt in range(2):
            try:
                async with httpx.AsyncClient(timeout=timeout, transport=self._transport) as client:
                    response = await client.post(
                        url,
                        headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                        json=payload,
                    )
            except httpx.TimeoutException:
                logger.warning("Tutor Gemini excedeu o tempo model=%s", chosen)
                raise TutorProviderError("timeout") from None
            except httpx.HTTPError:
                logger.warning("Tutor Gemini falhou na conexao model=%s", chosen)
                raise TutorProviderError("unavailable") from None
            if response.status_code == 503 and attempt == 0:
                logger.warning(
                    "Tutor Gemini ocupado model=%s http=503 detalhe=%s",
                    chosen,
                    _provider_message(response, api_key),
                )
                await asyncio.sleep(0.8)
                continue
            break
        if response is None or response.status_code >= 400:
            status_code = 503 if response is None else response.status_code
            mapped = _status_error(status_code)
            logger.warning(
                "Tutor Gemini recusou a chamada code=%s http=%s detalhe=%s",
                mapped.code,
                mapped.status,
                "" if response is None else _provider_message(response, api_key),
            )
            raise mapped
        text = _response_text(response)
        _log_usage(chosen, response)
        if not text:
            logger.warning("Tutor Gemini devolveu resposta vazia model=%s", chosen)
            raise TutorProviderError("empty")
        return text


def _response_text(response: httpx.Response) -> str:
    try:
        data = response.json()
    except ValueError:
        return ""
    candidates = data.get("candidates") or []
    if not candidates:
        return ""
    parts = ((candidates[0].get("content") or {}).get("parts") or [])
    chunks = [str(part.get("text") or "") for part in parts if isinstance(part, dict)]
    return "\n".join(chunk for chunk in chunks if chunk).strip()


def _log_usage(model: str, response: httpx.Response) -> None:
    usage = {}
    try:
        usage = response.json().get("usageMetadata") or {}
    except ValueError:
        usage = {}
    logger.info(
        "Tutor Gemini concluido model=%s prompt_tokens=%s output_tokens=%s total_tokens=%s",
        model,
        usage.get("promptTokenCount"),
        usage.get("candidatesTokenCount"),
        usage.get("totalTokenCount"),
    )
