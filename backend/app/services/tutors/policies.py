"""Politica pedagogica progressiva, compartilhada por todos os modos.

1. pergunta orientadora
2. dica
3. explicacao conceitual
4. exemplo semelhante
5. solucao somente quando o aluno ja passou pela etapa 4 e pede ajuda final
"""

from __future__ import annotations

STAGE_GUIDING_QUESTION = 1
STAGE_HINT = 2
STAGE_CONCEPT = 3
STAGE_SIMILAR_EXAMPLE = 4
STAGE_SOLUTION = 5

STAGE_NAMES = {
    STAGE_GUIDING_QUESTION: "pergunta_orientadora",
    STAGE_HINT: "dica",
    STAGE_CONCEPT: "explicacao_conceitual",
    STAGE_SIMILAR_EXAMPLE: "exemplo_semelhante",
    STAGE_SOLUTION: "solucao",
}

_SOLUTION_SIGNALS = (
    "solucao",
    "solução",
    "gabarito",
    "resposta completa",
    "mostra o codigo",
    "mostra o código",
    "me da a resposta",
    "me dá a resposta",
    "nao consigo",
    "não consigo",
    "desisto",
    "trava total",
    "pode resolver",
)


def asks_for_solution(message: str) -> bool:
    normalized = (message or "").casefold()
    return any(signal in normalized for signal in _SOLUTION_SIGNALS)


def resolve_stage(prior_assistant_messages: int, user_message: str) -> int:
    """Avanca uma etapa por resposta do tutor. Nao pula para a solucao no inicio."""
    count = max(prior_assistant_messages, 0)
    if count <= 0:
        return STAGE_GUIDING_QUESTION
    if count == 1:
        return STAGE_HINT
    if count == 2:
        return STAGE_CONCEPT
    if count == 3:
        return STAGE_SIMILAR_EXAMPLE
    if asks_for_solution(user_message):
        return STAGE_SOLUTION
    return STAGE_SIMILAR_EXAMPLE
