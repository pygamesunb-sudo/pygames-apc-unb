"""Gerador de um unico exercicio de APC para o Tutor de Exercicios.

O resultado e validado antes de voltar ao chat. A conversa seguinte nao gera
outro exercicio: ela recebe este objeto como contexto fixo.
"""

from __future__ import annotations

import json
import re
import unicodedata

from pydantic import ValidationError

from app.models.tutors import (
    ExerciseDifficulty,
    ExerciseInputType,
    ExerciseOutputType,
    ExerciseTopic,
    GeneratorTopic,
    PublicGeneratedExercise,
    TutorExercise,
)
from app.services.tutors.prompts import EXERCISE_GENERATOR_PROMPT

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

GENERATOR_TOPICS: dict[str, str] = {
    "entrada_saida": "Entrada e saída",
    "variaveis": "Variáveis",
    "operadores": "Operadores",
    "condicionais": "Condicionais",
    "while": "While",
    "for": "For",
    "strings": "Strings",
    "listas": "Listas",
    "funcoes": "Funções",
}

INPUT_TYPE_LABELS: dict[str, str] = {
    "inteiro": "número inteiro",
    "decimal": "número decimal",
    "string": "string",
    "varios_numeros": "vários números",
    "lista": "lista",
    "automatico": "automático",
}

OUTPUT_TYPE_LABELS: dict[str, str] = {
    "numero": "número",
    "texto": "texto",
    "booleano": "booleano",
    "lista": "lista",
    "automatico": "automático",
}

_PRIVATE_KEYS = {"reference_solution", "solution_explanation"}


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


def build_interactive_generator_messages(
    *,
    theme: str,
    topic: GeneratorTopic,
    difficulty: ExerciseDifficulty,
    input_type: ExerciseInputType,
    output_type: ExerciseOutputType,
) -> list[dict]:
    topic_label = GENERATOR_TOPICS[topic]
    difficulty_label = EXERCISE_DIFFICULTIES[difficulty]
    return [
        {"role": "system", "content": EXERCISE_GENERATOR_PROMPT},
        {
            "role": "user",
            "content": (
                "Crie um exercicio original.\n"
                f"Tema do aluno: {theme}\n"
                f"Conteudo de APC: {topic_label}\n"
                f"Dificuldade: {difficulty_label}\n"
                f"Tipo de entrada: {INPUT_TYPE_LABELS[input_type]}\n"
                f"Tipo de saida: {OUTPUT_TYPE_LABELS[output_type]}\n"
                f'topic deve ser exatamente "{topic_label}".\n'
                f'difficulty deve ser exatamente "{difficulty_label}".'
            ),
        },
    ]


def _load_json_object(raw: str) -> dict:
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
    except json.JSONDecodeError as exc:
        raise InvalidGeneratedExercise("JSON de exercicio invalido.") from exc
    if not isinstance(data, dict):
        raise InvalidGeneratedExercise("JSON de exercicio invalido.")
    return data


def _text_list(value, limit: int) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list):
        raise InvalidGeneratedExercise("Lista do exercicio invalida.")
    cleaned = []
    for item in value:
        if not isinstance(item, str):
            raise InvalidGeneratedExercise("Item do exercicio invalido.")
        text = item.strip()
        if text:
            cleaned.append(text[:240])
    return cleaned[:limit]


def _example_matches(input_type: str, output_type: str, sample_input: str, sample_output: str) -> bool:
    incoming = sample_input.strip()
    outgoing = sample_output.strip()
    if not incoming or not outgoing:
        return False
    first = incoming.splitlines()[0].strip()
    if input_type == "inteiro" and not re.fullmatch(r"-?\d+", first):
        return False
    if input_type == "decimal" and not re.fullmatch(r"-?\d+(?:[.,]\d+)?", first):
        return False
    if input_type in {"varios_numeros", "lista"} and not re.search(r"\d", incoming):
        return False
    if output_type == "numero" and not re.search(r"\d", outgoing):
        return False
    return True


def parse_interactive_exercise(
    raw: str,
    *,
    theme: str,
    topic: GeneratorTopic,
    difficulty: ExerciseDifficulty,
    input_type: ExerciseInputType,
    output_type: ExerciseOutputType,
) -> dict:
    data = _load_json_object(raw)
    expected_topic = GENERATOR_TOPICS[topic]
    expected_difficulty = EXERCISE_DIFFICULTIES[difficulty]
    if _plain(str(data.get("topic") or "")) != _plain(expected_topic):
        raise InvalidGeneratedExercise("O exercicio nao respeitou o conteudo.")
    if _plain(str(data.get("difficulty") or "")) != _plain(expected_difficulty):
        raise InvalidGeneratedExercise("O exercicio nao respeitou a dificuldade.")
    solution = str(data.get("reference_solution") or "").strip()
    if not solution:
        raise InvalidGeneratedExercise("O exercicio ficou sem solucao interna.")
    statement = str(data.get("statement") or "")
    if solution and len(solution) > 24 and solution in statement:
        raise InvalidGeneratedExercise("A solucao apareceu no enunciado.")
    data["topic"] = expected_topic
    data["difficulty"] = expected_difficulty
    data["constraints"] = _text_list(data.get("constraints"), 8)
    data["hints"] = _text_list(data.get("hints"), 6)
    try:
        public = PublicGeneratedExercise.model_validate(data)
    except ValidationError as exc:
        raise InvalidGeneratedExercise("JSON de exercicio invalido.") from exc
    sample = public.examples[0]
    if not _example_matches(input_type, output_type, sample.input, sample.output):
        raise InvalidGeneratedExercise("A entrada e a saida do exemplo nao sao compativeis.")
    stored = public.model_dump()
    stored["reference_solution"] = solution[:4000]
    stored["solution_explanation"] = str(data.get("solution_explanation") or "").strip()[:2000]
    stored["theme"] = theme.strip()[:80]
    stored["input_type"] = input_type
    stored["output_type"] = output_type
    return stored


def public_exercise(stored: dict | None) -> PublicGeneratedExercise | None:
    if not stored:
        return None
    visible = {key: value for key, value in stored.items() if key not in _PRIVATE_KEYS}
    visible.pop("theme", None)
    visible.pop("input_type", None)
    visible.pop("output_type", None)
    try:
        return PublicGeneratedExercise.model_validate(visible)
    except ValidationError:
        return None
