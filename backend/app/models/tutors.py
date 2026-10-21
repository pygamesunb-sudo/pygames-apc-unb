from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


TutorMode = Literal["apc", "python", "debug", "practice", "assistant", "exercise"]
TutorSurface = Literal["page", "floating"]
ExerciseTopic = Literal[
    "entrada_saida",
    "variaveis",
    "strings",
    "condicionais",
    "while",
    "for",
    "listas",
    "funcoes",
    "recursao",
]
ExerciseDifficulty = Literal["facil", "medio", "dificil"]


def _clean_optional_id(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > 128 or "/" in cleaned:
        raise ValueError("Identificador invalido.")
    return cleaned


class TutorExercise(BaseModel):
    """Exercicio gerado pelo proprio Pygames e fixado no chat."""

    titulo: str = Field(..., min_length=1, max_length=140)
    tema: str = Field(..., min_length=1, max_length=80)
    dificuldade: str = Field(..., min_length=1, max_length=40)
    enunciado: str = Field(..., min_length=1, max_length=2500)
    entrada: str = Field(..., min_length=1, max_length=800)
    saida: str = Field(..., min_length=1, max_length=800)
    exemploEntrada: str = Field(..., min_length=1, max_length=800)
    exemploSaida: str = Field(..., min_length=1, max_length=800)
    conceitos: list[str] = Field(..., min_length=1, max_length=8)

    @field_validator(
        "titulo",
        "tema",
        "dificuldade",
        "enunciado",
        "entrada",
        "saida",
        "exemploEntrada",
        "exemploSaida",
        mode="before",
    )
    @classmethod
    def require_text(cls, value):
        if not isinstance(value, str):
            raise ValueError("Texto do exercicio invalido.")
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Texto do exercicio vazio.")
        return cleaned

    @field_validator("conceitos", mode="before")
    @classmethod
    def require_concepts(cls, value):
        if not isinstance(value, list):
            raise ValueError("Conceitos invalidos.")
        cleaned = []
        for item in value:
            if not isinstance(item, str):
                raise ValueError("Conceito invalido.")
            text = item.strip()
            if text:
                cleaned.append(text[:80])
        if not cleaned:
            raise ValueError("O exercicio precisa de ao menos um conceito.")
        return cleaned[:8]


class TutorExerciseRequest(BaseModel):
    topic: ExerciseTopic
    difficulty: ExerciseDifficulty


class TutorChatRequest(BaseModel):
    conversation_id: str | None = None
    mode: TutorMode
    message: str = Field(..., min_length=1, max_length=4000)
    problem_id: str | None = Field(default=None, max_length=128)
    code: str | None = Field(default=None, max_length=20000)
    surface: TutorSurface = "page"
    exercise: TutorExercise | None = None

    @field_validator("conversation_id", "problem_id", mode="before")
    @classmethod
    def validate_optional_id(cls, value):
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("Identificador invalido.")
        return _clean_optional_id(value)

    @field_validator("code", mode="before")
    @classmethod
    def clean_code(cls, value):
        if value is None:
            return None
        if not isinstance(value, str):
            raise ValueError("Codigo invalido.")
        stripped = value.strip()
        return stripped or None

    @model_validator(mode="after")
    def exercise_mode_keeps_the_current_problem(self):
        if self.mode == "exercise" and self.exercise is None:
            raise ValueError("O tutor de exercicios precisa do exercicio atual.")
        return self


class TutorUsageView(BaseModel):
    used: int
    limit: int


class TutorChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    mode: TutorMode
    stage: int = Field(..., ge=1, le=5)
    surface: TutorSurface
    reply: str
    usage: TutorUsageView


class TutorMessage(BaseModel):
    message_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: str
    stage: int | None = None
    code: str | None = None


class TutorConversationSummary(BaseModel):
    conversation_id: str
    mode: TutorMode
    surface: TutorSurface
    problem_id: str | None = None
    stage: int = Field(..., ge=1, le=5)
    preview: str = ""
    updated_at: str


class TutorConversationDetail(TutorConversationSummary):
    messages: list[TutorMessage]
