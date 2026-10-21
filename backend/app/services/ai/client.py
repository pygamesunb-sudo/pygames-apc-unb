"""Cliente unico de chat completions no OpenRouter.

Gerador, revisor e tutores passam por aqui. A chave fica somente no backend.
"""

from __future__ import annotations

import asyncio
import logging
import random
from collections.abc import Callable
from typing import TypeVar

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

DEFAULT_FALLBACK_MODELS = (
    "openai/gpt-oss-120b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
)

T = TypeVar("T")


class LLMUnavailable(RuntimeError):
    """A chamada ao provedor de LLM nao pode ser concluida."""


def generation_model_chain(primary: str) -> list[str]:
    """Cadeia usada hoje pelo gerador e pelo revisor de exercicios."""
    models = [primary]
    if primary != "openrouter/free":
        models.append("openrouter/free")
    for model in DEFAULT_FALLBACK_MODELS:
        if model not in models:
            models.append(model)
    return models


def resolve_models(
    models: list[str] | None,
    primary_model: str | None,
    use_generation_fallbacks: bool,
) -> list[str]:
    if models:
        return list(models)
    primary = (primary_model or settings.openrouter_model or "").strip()
    if not primary:
        raise LLMUnavailable("Nenhum modelo de LLM foi configurado.")
    if use_generation_fallbacks:
        return generation_model_chain(primary)
    return [primary]


async def chat_completion(
    messages: list[dict],
    *,
    temperature: float = 0.7,
    timeout: float = 300.0,
    models: list[str] | None = None,
    primary_model: str | None = None,
    use_generation_fallbacks: bool = True,
    missing_key_message: str = (
        "OPENROUTER_API_KEY nao configurada na Function. "
        "Defina o segredo antes de chamar o modelo."
    ),
    failure_message: str = "Todos os modelos da API do OpenRouter falharam.",
    log_label: str = "LLM",
    parse: Callable[[str], T] | None = None,
) -> str | T:
    """Envia mensagens ao OpenRouter e devolve o texto, ou o valor parseado.

    `parse` permite ao revisor rejeitar JSON invalido e tentar o proximo modelo
    da cadeia, como ja acontecia antes da centralizacao.
    """
    if not (settings.openrouter_api_key or "").strip():
        raise RuntimeError(missing_key_message)

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.openrouter_referer(),
        "X-Title": "Pygame-APC",
    }
    model_list = resolve_models(models, primary_model, use_generation_fallbacks)
    last_exception: Exception | None = None

    for model in model_list:
        logger.info("%s tentando chamada a LLM com o modelo: %s", log_label, model)
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        max_retries = 3
        backoff_factor = 2.0

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        OPENROUTER_API_URL,
                        headers=headers,
                        json=payload,
                    )

                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(
                                "%s: modelo %s retornou 429. Nova tentativa em %.2fs (%d/%d).",
                                log_label,
                                model,
                                sleep_time,
                                attempt + 1,
                                max_retries,
                            )
                            await asyncio.sleep(sleep_time)
                            continue

                    response.raise_for_status()
                    data = response.json()

                    if "error" in data:
                        error_data = data["error"]
                        error_msg = error_data.get("message", "Erro desconhecido retornado pelo OpenRouter.")
                        error_code = error_data.get("code")
                        if error_code == 429 or "429" in str(error_msg):
                            if attempt < max_retries - 1:
                                sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                                logger.warning(
                                    "%s: OpenRouter reportou 429 para %s. Nova tentativa em %.2fs (%d/%d).",
                                    log_label,
                                    model,
                                    sleep_time,
                                    attempt + 1,
                                    max_retries,
                                )
                                await asyncio.sleep(sleep_time)
                                continue
                        logger.error("%s: erro do OpenRouter no modelo %s: %s", log_label, model, error_data)
                        raise ValueError(f"OpenRouter ({model}): {error_msg}")

                    if "choices" not in data or not data["choices"]:
                        logger.error("%s: resposta inesperada do modelo %s: %s", log_label, model, data)
                        raise ValueError(
                            f"OpenRouter ({model}): A resposta nao contem opcoes validas ('choices')."
                        )

                    content = data["choices"][0]["message"]["content"]
                    if parse is None:
                        logger.info("%s: chamada concluida com o modelo %s.", log_label, model)
                        return content
                    try:
                        parsed = parse(content)
                    except ValueError as exc:
                        logger.warning(
                            "%s: resposta do modelo %s rejeitada pelo parser: %s",
                            log_label,
                            model,
                            exc,
                        )
                        last_exception = exc
                        break
                    logger.info("%s: chamada concluida com o modelo %s.", log_label, model)
                    return parsed

            except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as exc:
                if isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code == 429:
                    if attempt < max_retries - 1:
                        sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning(
                            "%s: HTTP 429 para %s. Nova tentativa em %.2fs (%d/%d).",
                            log_label,
                            model,
                            sleep_time,
                            attempt + 1,
                            max_retries,
                        )
                        await asyncio.sleep(sleep_time)
                        continue
                logger.warning("%s: falha na tentativa %d para %s: %s", log_label, attempt + 1, model, exc)
                last_exception = exc
                break

    raise LLMUnavailable(f"{failure_message} Ultimo erro: {last_exception}")
