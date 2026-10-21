from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class BeeCrowdProblem(BaseModel):
    """Metadados internos. Nao inclui enunciado."""

    external_id: str
    title: str
    category: str | None = None
    difficulty: str | None = None
    topics: list[str] = Field(default_factory=list)
    source: Literal["beecrowd"] = "beecrowd"
    external_url: str
    available: bool = True
    cached_at: datetime | None = None


class BeeCrowdQuery(BaseModel):
    topic: str | None = None
    difficulty: str | None = None
    category: str | None = None
    page: int = Field(default=1, ge=1, le=500)
    limit: int = Field(default=20, ge=1, le=50)


class BeeCrowdStatus(BaseModel):
    configured: bool
    provider: Literal["beecrowd"] = "beecrowd"
