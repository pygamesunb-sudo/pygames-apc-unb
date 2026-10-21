"""Normaliza metadados de qualquer fonte para o formato do Pygames."""

from __future__ import annotations

import re

from app.models.beecrowd import BeeCrowdProblem
from app.models.ready_exercises import Difficulty, ReadyExercise

_EXERCISE_ID = re.compile(r"^(pygames|beecrowd)_([A-Za-z0-9_-]{1,64})$")
_KNOWN_TOPICS = (
    "entrada_saida",
    "variaveis",
    "condicionais",
    "while",
    "for",
    "strings",
    "listas",
    "funcoes",
)
_TOPIC_KEYWORDS = (
    ("variaveis", ("variavel", "variável", "variaveis", "variáveis")),
    ("while", ("while", "enquanto")),
    ("for", ("for", "para")),
    ("strings", ("string", "strings", "texto", "frase")),
    ("listas", ("lista", "listas", "vetor", "array")),
    ("funcoes", ("funcao", "função", "funcoes", "funções", "function")),
    ("condicionais", ("condicional", "condicionais", "selecao", "seleção")),
    ("entrada_saida", ("entrada", "saida", "saída", "sequencial", "sequential")),
)
_DIFFICULTY = {
    "beginner": ("beginner", 1),
    "iniciante": ("beginner", 1),
    "easy": ("beginner", 1),
    "facil": ("beginner", 1),
    "fácil": ("beginner", 1),
    "1": ("beginner", 1),
    "intermediate": ("intermediate", 2),
    "intermediario": ("intermediate", 2),
    "intermediário": ("intermediate", 2),
    "medium": ("intermediate", 2),
    "medio": ("intermediate", 2),
    "médio": ("intermediate", 2),
    "2": ("intermediate", 2),
    "challenge": ("challenge", 3),
    "desafio": ("challenge", 3),
    "hard": ("challenge", 3),
    "dificil": ("challenge", 3),
    "difícil": ("challenge", 3),
    "avancado": ("challenge", 3),
    "avançado": ("challenge", 3),
    "3": ("challenge", 3),
}


def parse_exercise_id(value: str) -> tuple[str, str]:
    match = _EXERCISE_ID.fullmatch((value or "").strip())
    if not match:
        raise ValueError("id de exercicio pronto invalido")
    return match.group(1), match.group(2)


def safe_external_url(url: str) -> str:
    cleaned = (url or "").strip()
    if not cleaned.startswith(("https://", "http://")):
        raise ValueError("url externa invalida")
    return cleaned


def infer_topic(problem: BeeCrowdProblem) -> str:
    for topic in problem.topics:
        if topic in _KNOWN_TOPICS:
            return topic
    blobs = [
        " ".join(problem.topics).lower(),
        problem.title.lower(),
        (problem.category or "").lower(),
    ]
    for slug, keywords in _TOPIC_KEYWORDS:
        if any(keyword in blob for blob in blobs for keyword in keywords):
            return slug
    return "entrada_saida"


def normalize_difficulty(value: str | None) -> tuple[Difficulty, int]:
    text = (value or "").strip().lower()
    if text.isdigit():
        number = int(text)
        if number <= 3:
            return "beginner", 1
        if number <= 6:
            return "intermediate", 2
        return "challenge", 3
    mapped = _DIFFICULTY.get(text)
    if mapped is None:
        return "beginner", 1
    return mapped  # type: ignore[return-value]


def to_ready_exercise(problem: BeeCrowdProblem) -> ReadyExercise:
    difficulty, level = normalize_difficulty(problem.difficulty)
    topics = []
    for topic in problem.topics:
        cleaned = str(topic).strip()
        if cleaned and cleaned not in topics:
            topics.append(cleaned)
    return ReadyExercise(
        id=f"{problem.source}_{problem.external_id}",
        external_id=problem.external_id,
        source=problem.source,
        title=problem.title.strip(),
        topic=infer_topic(problem),
        topics=topics[:12],
        difficulty=difficulty,
        level=level,
        external_url=safe_external_url(problem.external_url),
    )


def filter_exercises(
    exercises: list[ReadyExercise],
    *,
    topic: str | None = None,
    difficulty: str | None = None,
    source: str | None = None,
    completed: bool | None = None,
) -> list[ReadyExercise]:
    selected = exercises
    if topic and topic not in {"todos", ""}:
        selected = [item for item in selected if item.topic == topic]
    if difficulty:
        selected = [item for item in selected if item.difficulty == difficulty]
    if source:
        selected = [item for item in selected if item.source == source]
    if completed is True:
        selected = [item for item in selected if item.completed]
    elif completed is False:
        selected = [item for item in selected if not item.completed]
    return selected
