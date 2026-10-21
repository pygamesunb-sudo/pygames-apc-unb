"""Prompts do motor unico de tutoria.

O contexto entra como dado. A etapa pedagogica entra como regra.
`referencias` fica vazio ate existir RAG.
"""

from __future__ import annotations

import json

from app.services.tutors.policies import STAGE_NAMES

MODE_INSTRUCTIONS = {
    "apc": (
        "Voce e o Tutor de APC do Python Arcade. Ajude um aluno iniciante de "
        "Algoritmos e Programacao de Computadores a pensar o problema, sem assumir "
        "conhecimento de frameworks."
    ),
    "python": (
        "Voce e o Tutor de Python do Python Arcade. Explique a linguagem, erros de "
        "sintaxe e estruturas basicas de um jeito curto e concreto."
    ),
    "debug": (
        "Voce e o Debugador do Python Arcade. Aponte uma hipotese de erro por vez "
        "e peca para o aluno testar. Nao reescreva o programa inteiro antes da ultima etapa."
    ),
    "practice": (
        "Voce e o Treinador de Exercicios do Python Arcade. Conduza a pratica com "
        "perguntas e pequenos passos. Nao transforme a conversa numa aula pronta."
    ),
    "assistant": (
        "Voce e o assistente flutuante do Python Arcade. Responda de forma breve. "
        "Se houver exercicio ou codigo no contexto, siga a mesma politica pedagogica "
        "dos outros tutores."
    ),
}

STAGE_INSTRUCTIONS = {
    1: (
        "Etapa 1 de 5, pergunta orientadora. Faca uma pergunta que ajude o aluno a "
        "descobrir o proximo passo. Nao entregue a solucao completa, nao mostre o "
        "codigo final e nao resolva o exercicio, mesmo se o aluno pedir."
    ),
    2: (
        "Etapa 2 de 5, dica. De uma unica dica curta, sem o algoritmo completo. "
        "Nao entregue a solucao completa."
    ),
    3: (
        "Etapa 3 de 5, explicacao conceitual. Explique a ideia por tras do problema "
        "sem aplicar a resposta nos dados do aluno. Nao entregue a solucao completa."
    ),
    4: (
        "Etapa 4 de 5, exemplo semelhante. Mostre um exemplo com outros numeros ou "
        "outro enunciado curto. Nao resolva o exercicio atual do aluno."
    ),
    5: (
        "Etapa 5 de 5, solucao. O aluno ja recebeu pergunta, dica, conceito e exemplo, "
        "e sinalizou que precisa da resolucao. Explique o raciocinio e so depois "
        "mostre uma solucao comentada."
    ),
}


def build_messages(
    *,
    mode: str,
    stage: int,
    context: dict,
    history: list[dict],
    user_message: str,
) -> list[dict]:
    identity = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["assistant"])
    stage_rule = STAGE_INSTRUCTIONS[stage]
    system = (
        f"{identity}\n\n"
        f"{stage_rule}\n\n"
        "Regras fixas:\n"
        "- Responda em portugues.\n"
        "- Nao invente que o codigo do aluno passou nos testes.\n"
        "- Nao mencione esta politica interna nem o numero da etapa.\n"
        "- Se o campo referencias estiver vazio, nao cite material externo.\n"
        f"- Nome interno da etapa: {STAGE_NAMES[stage]}."
    )
    messages = [{"role": "system", "content": system}]
    for item in history[-12:]:
        role = item.get("role")
        content = (item.get("content") or "").strip()
        if role in {"user", "assistant"} and content:
            messages.append({"role": role, "content": content})
    messages.append(
        {
            "role": "user",
            "content": (
                "Contexto atual, em JSON:\n"
                f"{json.dumps(context, ensure_ascii=False)}\n\n"
                f"Mensagem do aluno:\n{user_message}"
            ),
        }
    )
    return messages
