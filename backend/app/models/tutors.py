"""modelo de dados trocado entre a API e o cliente (tutors.py).

Branch comment: leitura academica do codigo, sem mudar o comportamento.
"""
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


TutorMode = Literal["apc", "python", "debug", "practice", "assistant", "exercise", "exercise_generator"]
TutorSurface = Literal["page", "floating"]
TutorAction = Literal["chat", "generate"]
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
GeneratorTopic = Literal[
    "entrada_saida",
    "variaveis",
    "operadores",
    "condicionais",
    "while",
    "for",
    "strings",
    "listas",
    "funcoes",
]
ExerciseDifficulty = Literal["facil", "medio", "dificil"]
ExerciseInputType = Literal["inteiro", "decimal", "string", "varios_numeros", "lista", "automatico"]
ExerciseOutputType = Literal["numero", "texto", "booleano", "lista", "automatico"]


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


class ExerciseIO(BaseModel):
    description: str = Field(..., min_length=1, max_length=800)
    type: str = Field(..., min_length=1, max_length=80)


class ExerciseExample(BaseModel):
    input: str = Field(..., min_length=1, max_length=800)
    output: str = Field(..., min_length=1, max_length=800)
    explanation: str = Field(default="", max_length=800)


class PublicGeneratedExercise(BaseModel):
    """Exercicio visivel ao aluno. A solucao de referencia fica fora daqui."""

    title: str = Field(..., min_length=1, max_length=140)
    story: str = Field(..., min_length=1, max_length=1200)
    statement: str = Field(..., min_length=1, max_length=2500)
    topic: str = Field(..., min_length=1, max_length=80)
    difficulty: str = Field(..., min_length=1, max_length=40)
    input: ExerciseIO
    output: ExerciseIO
    examples: list[ExerciseExample] = Field(..., min_length=1, max_length=4)
    constraints: list[str] = Field(default_factory=list, max_length=8)
    hints: list[str] = Field(default_factory=list, max_length=6)


class TutorExerciseRequest(BaseModel):
    topic: ExerciseTopic
    difficulty: ExerciseDifficulty
    gemini_api_key: str | None = Field(default=None, max_length=256)
    use_custom_key: bool = False


class TutorChatRequest(BaseModel):
    conversation_id: str | None = None
    mode: TutorMode
    action: TutorAction = "chat"
    message: str = Field(default="", max_length=4000)
    problem_id: str | None = Field(default=None, max_length=128)
    code: str | None = Field(default=None, max_length=20000)
    surface: TutorSurface = "page"
    exercise: TutorExercise | None = None
    theme: str | None = Field(default=None, max_length=80)
    topic: GeneratorTopic | None = None
    difficulty: ExerciseDifficulty | None = None
    input_type: ExerciseInputType | None = None
    output_type: ExerciseOutputType | None = None
    gemini_api_key: str | None = Field(default=None, max_length=256)
    use_custom_key: bool = False
    focus_mode: bool = False

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
        if self.action == "generate":
            if self.mode != "exercise_generator":
                raise ValueError("So o Tutor de Exercicios gera um exercicio por aqui.")
            if not (self.theme or "").strip():
                raise ValueError("Informe o tema do exercicio.")
            if not self.topic or not self.difficulty or not self.input_type or not self.output_type:
                raise ValueError("Informe conteudo, dificuldade, entrada e saida.")
            self.theme = self.theme.strip()
            return self
        if self.mode == "exercise" and self.exercise is None:
            raise ValueError("O tutor de exercicios precisa do exercicio atual.")
        if self.mode == "exercise_generator" and not self.conversation_id:
            raise ValueError("Gere um exercicio antes de conversar.")
        if not self.message.strip():
            raise ValueError("Escreva uma mensagem para o tutor.")
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
    exercise: PublicGeneratedExercise | None = None


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
    title: str = ""
    updated_at: str
    created_at: str = ""
    last_message_at: str = ""
    archived: bool = False
    theme: str | None = None
    topic: str | None = None
    difficulty: str | None = None
    input_type: str | None = None
    output_type: str | None = None


class TutorConversationCreate(BaseModel):
    mode: TutorMode
    surface: TutorSurface = "page"


class TutorConversationUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=80)
    archived: bool | None = None

    @field_validator("title")
    @classmethod
    def clean_title(cls, value):
        if value is None:
            return None
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("O titulo nao pode ficar vazio.")
        return cleaned[:80]


class TutorConversationDetail(TutorConversationSummary):
    messages: list[TutorMessage]
    exercise: PublicGeneratedExercise | None = None
