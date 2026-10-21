"""Gerador de um unico exercicio de APC para o Tutor de Exercicios.

O resultado e validado antes de voltar ao chat. A conversa seguinte nao gera
outro exercicio: ela recebe este objeto como contexto fixo.
"""

from __future__ import annotations

import json
import re
import unicodedata

from pydantic import ValidationError

from app.models.tutors import ExerciseDifficulty, ExerciseTopic, TutorExercise

EXERCISE_TOPICS: dict[str, str] = {
    "entrada_saida": "Entrada e saída",
    "variaveis": "Variáveis",
    "strings": "Strings",
    "condicionais": "Condicionais",
    "while": "While",
    "for": "For",
    "listas": "Listas",
    "funcoes": "Funções",
    "recursao": "Recursão",
}

EXERCISE_DIFFICULTIES: dict[str, str] = {
    "facil": "Fácil",
    "medio": "Médio",
    "dificil": "Difícil",
}


class InvalidGeneratedExercise(ValueError):
    """O modelo nao devolveu um exercicio utilizavel."""


def _plain(value: str) -> str:
    folded = unicodedata.normalize("NFD", (value or "").casefold())
    return "".join(ch for ch in folded if unicodedata.category(ch) != "Mn")


def build_generator_messages(topic: ExerciseTopic, difficulty: ExerciseDifficulty) -> list[dict]:
    topic_label = EXERCISE_TOPICS[topic]
    difficulty_label = EXERCISE_DIFFICULTIES[difficulty]
    system = (
        "Voce cria um unico exercicio de Algoritmos e Programacao de Computadores "
        "para estudantes iniciantes.\n"
        "Regras:\n"
        "- Responda apenas com um objeto JSON, sem markdown.\n"
        "- O exercicio e resolvido em Python, sem bibliotecas externas.\n"
        "- Respeite o tema e a dificuldade pedidos.\n"
        "- O enunciado deve ser claro, possivel e sem ambiguidade.\n"
        "- Descreva a entrada, a saida e pelo menos um exemplo.\n"
        "- Nao inclua a solucao, o codigo pronto nem a explicacao da resposta.\n"
        "- Use exatamente estas chaves: titulo, tema, dificuldade, enunciado, "
        "entrada, saida, exemploEntrada, exemploSaida, conceitos.\n"
        "- conceitos e uma lista curta de strings.\n"
        f'- tema deve ser exatamente "{topic_label}".\n'
        f'- dificuldade deve ser exatamente "{difficulty_label}".'
    )
    return [
        {"role": "system", "content": system},
        {
            "role": "user",
            "content": (
                "Gere um exercicio.\n"
                f"Tema: {topic_label}\n"
                f"Dificuldade: {difficulty_label}"
            ),
        },
    ]


def parse_generated_exercise(
    raw: str,
    *,
    topic: ExerciseTopic,
    difficulty: ExerciseDifficulty,
) -> TutorExercise:
    text = (raw or "").strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, flags=re.DOTALL)
    if fenced:
        text = fenced.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        raise InvalidGeneratedExercise("Resposta sem JSON.")
    try:
        data = json.loads(text[start:end + 1])
        exercise = TutorExercise.model_validate(data)
    except (json.JSONDecodeError, ValidationError, TypeError) as exc:
        raise InvalidGeneratedExercise("JSON de exercicio invalido.") from exc

    expected_topic = EXERCISE_TOPICS[topic]
    expected_difficulty = EXERCISE_DIFFICULTIES[difficulty]
    if _plain(exercise.tema) != _plain(expected_topic):
        raise InvalidGeneratedExercise("O exercicio nao respeitou o tema.")
    if _plain(exercise.dificuldade) != _plain(expected_difficulty):
        raise InvalidGeneratedExercise("O exercicio nao respeitou a dificuldade.")
    return exercise.model_copy(update={
        "tema": expected_topic,
        "dificuldade": expected_difficulty,
    })
