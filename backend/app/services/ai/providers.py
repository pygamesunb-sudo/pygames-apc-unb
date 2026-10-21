"""Contrato comum dos provedores de IA.

Tutores usam o Gemini. Geracao e revisao de exercicios continuam no OpenRouter.
"""

from __future__ import annotations

from typing import Protocol


class AIProvider(Protocol):
    name: str

    async def complete(
        self,
        messages: list[dict],
        *,
        temperature: float = 0.4,
        model: str | None = None,
        timeout: float = 60.0,
    ) -> str:
        """Devolve o texto do modelo, sem expor chave nem corpo de erro."""


class OpenRouterProvider:
    """Adapter do cliente OpenRouter ja usado pelo gerador de exercicios."""

    name = "openrouter"

    async def complete(
        self,
        messages: list[dict],
        *,
        temperature: float = 0.4,
        model: str | None = None,
        timeout: float = 60.0,
    ) -> str:
        from app.services.ai.client import chat_completion

        return await chat_completion(
            messages,
            temperature=temperature,
            timeout=timeout,
            models=[model] if model else None,
            use_generation_fallbacks=False,
            log_label="OpenRouter",
        )
