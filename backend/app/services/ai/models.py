from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class UsageSnapshot(BaseModel):
    """Contador diario de mensagens do tutor para um usuario."""

    uid: str
    date: str = Field(..., description="Dia UTC no formato YYYY-MM-DD.")
    count: int = Field(..., ge=0)
    limit: int = Field(..., ge=0)

    @property
    def remaining(self) -> int:
        return max(self.limit - self.count, 0)
