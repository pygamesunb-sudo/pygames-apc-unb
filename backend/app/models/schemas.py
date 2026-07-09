"""
Modelos Pydantic (schemas) de request/response da API.

Definem validacao automatica de entrada e documentacao OpenAPI em /docs.
Todos os endpoints importam seus contratos daqui.
"""
from pydantic import BaseModel, Field
from typing import Literal


# --- Geracao de problemas ---

class GenerateProblemRequest(BaseModel):
    """Payload enviado pelo frontend ao solicitar um novo desafio."""
    topic: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Tema de interesse do usuario (ex: Minecraft, historias comicas).",
        examples=["Minecraft e Redstone"],
    )
    difficulty: Literal["facil", "medio", "dificil", "competitivo"] = Field(
        default="facil",
        description="Nivel de dificuldade do problema.",
    )
    gemini_api_key: str | None = Field(
        default=None,
        description="Chave de API do Gemini do proprio usuario (opcional)."
    )
    use_custom_key: bool = Field(
        default=False,
        description="Se True, usa a chave de API fornecida pelo usuario para gerar o problema."
    )


class TestCase(BaseModel):
    """Um par entrada/saida esperada para validar a solucao."""
    input: str = Field(..., description="Entrada do caso de teste.")
    expected_output: str = Field(..., description="Saida esperada do caso de teste.")


class GeneratedProblem(BaseModel):
    """Problema completo retornado ao frontend apos geracao/revisao."""
    problem_id: str = Field(..., description="ID unico do problema no Firestore.")
    title: str = Field(..., description="Titulo do problema.")
    description: str = Field(..., description="Enunciado completo do problema.")
    difficulty: str
    topic: str
    test_cases: list[TestCase]
    hints: list[str] = Field(default_factory=list)
    solution_blocks: list[str] = Field(
        default_factory=list,
        description="Linhas da solucao embaralhadas para o modo de blocos.",
    )


# --- Submissao de codigo ---

class SubmitCodeRequest(BaseModel):
    """Codigo Python enviado pelo usuario para um problema especifico."""
    problem_id: str = Field(..., description="ID do problema sendo respondido.")
    code: str = Field(..., min_length=1, description="Codigo Python submetido pelo usuario.")


class TestResult(BaseModel):
    """Resultado da execucao de um unico caso de teste."""
    test_case_index: int
    passed: bool
    input: str
    expected_output: str
    actual_output: str
    error: str | None = None


class SubmitCodeResponse(BaseModel):
    """Resposta consolidada apos executar todos os casos de teste."""
    all_passed: bool
    results: list[TestResult]
    score: int = Field(..., description="Pontuacao de 0 a 100.")
    coding_points: int | None = Field(default=None, description="Pontos totais de programacao do usuario.")
    total_score: int | None = Field(default=None, description="Pontuacao consolidada geral do usuario.")


# --- Validacao e revisao pos-geracao ---

class ValidateProblemRequest(BaseModel):
    """Usado pelo frontend logo apos o stream SSE terminar."""
    solution: str = Field(..., description="Codigo da solucao para testar.")
    test_cases: list[TestCase]


class ValidateProblemResponse(BaseModel):
    passed: bool
    results: list[TestResult]


class ReviewProblemRequest(BaseModel):
    """Aciona o agente revisor quando a validacao automatica falha."""
    problem_data: dict = Field(..., description="O dicionario do problema a ser revisado.")
    gemini_api_key: str | None = None
    use_custom_key: bool = False
