from typing import Literal

from pydantic import BaseModel, Field, field_validator


TutorMode = Literal["apc", "python", "debug", "practice", "assistant"]
TutorSurface = Literal["page", "floating"]


def _clean_optional_id(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned:
        return None
    if len(cleaned) > 128 or "/" in cleaned:
        raise ValueError("Identificador invalido.")
    return cleaned


class TutorChatRequest(BaseModel):
    conversation_id: str | None = None
    mode: TutorMode
    message: str = Field(..., min_length=1, max_length=4000)
    problem_id: str | None = Field(default=None, max_length=128)
    code: str | None = Field(default=None, max_length=20000)
    surface: TutorSurface = "page"

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
