from typing import Literal

from pydantic import BaseModel, Field


Difficulty = Literal["beginner", "intermediate", "challenge"]
ProgressStatus = Literal["started", "completed"]
CatalogMode = Literal["catalog", "unavailable"]
ExerciseSource = Literal["pygames", "beecrowd"]


class ReadyExample(BaseModel):
    input: str = ""
    output: str


class ReadyExercise(BaseModel):
    """Exercicio pronto no formato do Pygames, independente da fonte."""

    id: str
    external_id: str
    source: ExerciseSource
    title: str
    statement: str = ""
    topic: str
    topics: list[str] = Field(default_factory=list)
    difficulty: Difficulty
    level: int = Field(ge=1, le=3)
    input_description: str = ""
    output_description: str = ""
    examples: list[ReadyExample] = Field(default_factory=list)
    hints: list[str] = Field(default_factory=list)
    external_url: str = ""
    completed: bool = False
    started: bool = False
    recommended: bool = False


class ReadyExerciseList(BaseModel):
    items: list[ReadyExercise]
    page: int
    limit: int
    total: int


class ReadyTopic(BaseModel):
    id: str
    label: str


class ProviderState(BaseModel):
    configured: bool


class ReadyExercisesStatus(BaseModel):
    available: bool
    mode: CatalogMode
    providers: dict[str, ProviderState]


class ReadyProgressUpdate(BaseModel):
    status: ProgressStatus
