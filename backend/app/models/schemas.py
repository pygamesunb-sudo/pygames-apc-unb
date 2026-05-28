from pydantic import BaseModel, Field
from typing import Literal

# Modelos de entrada da API para geracao de problemas.
class GenerateProblemRequest(BaseModel):
    # Tema informado pelo usuario para contextualizar o desafio.
    topic: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Tema de interesse do usuario (ex: Minecraft, historias comicas).",
        examples=["Minecraft e Redstone"],
    )
    # Nivel de complexidade esperado para o exercicio.
    difficulty: Literal["facil", "medio", "dificil", "competitivo"] = Field(
        default="facil",
        description="Nivel de dificuldade do problema.",
    )
    # Chave opcional do Gemini enviada pelo proprio usuario.
    gemini_api_key: str | None = Field(
        default=None,
        description="Chave de API do Gemini do proprio usuario (opcional)."
    )
    # Flag que ativa uso da chave personalizada no fluxo de LLM.
    use_custom_key: bool = Field(
        default=False,
        description="Se True, usa a chave de API fornecida pelo usuario para gerar o problema."
    )

# Estrutura de cada caso de teste usado na correcao automatica.
class TestCase(BaseModel):
    input: str = Field(..., description="Entrada do caso de teste.")
    expected_output: str = Field(..., description="Saida esperada do caso de teste.")

# Formato padrao retornado ao frontend para um problema gerado.
class GeneratedProblem(BaseModel):
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

# Dados enviados quando o aluno submete seu codigo.
class SubmitCodeRequest(BaseModel):
    problem_id: str = Field(..., description="ID do problema sendo respondido.")
    code: str = Field(..., min_length=1, description="Codigo Python submetido pelo usuario.")

# Resultado individual de um caso de teste executado.
class TestResult(BaseModel):
    test_case_index: int
    passed: bool
    input: str
    expected_output: str
    actual_output: str
    error: str | None = None

# Resposta consolidada da avaliacao de codigo.
class SubmitCodeResponse(BaseModel):
    all_passed: bool
    results: list[TestResult]
    score: int = Field(..., description="Pontuacao de 0 a 100.")
    coding_points: int | None = Field(default=None, description="Pontos totais de programacao do usuario.")
    total_score: int | None = Field(default=None, description="Pontuacao consolidada geral do usuario.")

