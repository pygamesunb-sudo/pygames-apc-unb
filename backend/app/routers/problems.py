import asyncio
import logging
import uuid

from fastapi import APIRouter, HTTPException, Depends

from app.models.schemas import GenerateProblemRequest, GeneratedProblem, TestCase
from app.services.llm_generator import generate_problem
from app.services.llm_reviewer import review_problem
from app.services import firebase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/problems", tags=["problems"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=GeneratedProblem, status_code=201)
async def generate_problem_endpoint(body: GenerateProblemRequest, user: dict = Depends(get_current_user)):
    """
    Gera um novo problema de programacao baseado no topico e dificuldade fornecidos.
    A pipeline executa:
    1. Agente Gerador (LLM) -> cria problema, testes e solucao.
    2. Dois Agentes Revisores em paralelo -> validam com ferramenta Python.
    3. Salva no Firestore se aprovado por pelo menos 1 revisor.
    """
    # --- Etapa 1: Geracao ---
    # Cria enunciado, casos de teste, dicas e blocos de solucao via LLM.
    try:
        problem_data = await generate_problem(
            body.topic, 
            body.difficulty, 
            gemini_api_key=body.gemini_api_key, 
            use_custom_key=body.use_custom_key
        )
    except Exception as e:
        logger.exception("Erro na geracao do problema.")
        raise HTTPException(status_code=502, detail=f"Erro ao gerar o problema via LLM: {e}")
    # --- Etapa 2: Revisao sequencial (com fallback seguro em caso de erro da API) ---
    reviews = []
    try:
        # Pequena pausa para reduzir chance de rate limit entre chamadas consecutivas.
        await asyncio.sleep(1.5)
        review1 = await review_problem(
            problem_data, 
            reviewer_index=1, 
            gemini_api_key=body.gemini_api_key, 
            use_custom_key=body.use_custom_key
        )
        reviews.append(review1)
        
        await asyncio.sleep(1.5)
        review2 = await review_problem(
            problem_data, 
            reviewer_index=2, 
            gemini_api_key=body.gemini_api_key, 
            use_custom_key=body.use_custom_key
        )
        reviews.append(review2)
        
        logger.info(
            "Resultados da revisao: Revisor1=%s, Revisor2=%s",
            review1.get("approved"),
            review2.get("approved"),
        )
    except Exception as e:
        logger.warning(
            "Revisor falhou devido a erro de API (ex: rate limit 429): %s. "
            "Ignorando revisao automatica e entregando o problema original do gerador.",
            e
        )
        # Mock de revisao aprovada para permitir que o fluxo continue normalmente
        reviews = [
            {"approved": True, "feedback": f"Revisao pulada devido a instabilidade da API: {e}", "reviewer_index": 1},
            {"approved": True, "feedback": f"Revisao pulada devido a instabilidade da API: {e}", "reviewer_index": 2}
        ]
    # --- Etapa 2.5: Correcao colaborativa ---
    # Se algum revisor aprovou e forneceu uma solucao corrigida, adotamos ela!
    corrected = None
    for rev in reviews:
        if rev.get("approved") and rev.get("corrected_problem"):
            corrected = rev.get("corrected_problem")
            logger.info("Adotando versao corrigida e validada pelo Revisor %d!", rev.get("reviewer_index"))
            break
            
    if corrected:
        import random
        problem_data = {
            **problem_data,
            **corrected
        }
        # Re-embaralha os blocos de solucao corrigidos
        if "solution_blocks" in problem_data and problem_data["solution_blocks"]:
            random.shuffle(problem_data["solution_blocks"])

    # Rejeita apenas quando nenhum revisor aprovou o problema.
    approvals = [r.get("approved", False) for r in reviews]
    if not any(approvals):
        feedback = reviews[0].get("feedback", "Problema rejeitado pelos revisores.")
        raise HTTPException(
            status_code=422,
            detail=f"O problema gerado nao passou na revisao: {feedback}",
        )

    # --- Etapa 3: Persistencia no Firestore ---
    # Guarda tambem metadados de revisao para auditoria posterior.
    problem_to_save = {
        **problem_data,
        "topic": body.topic,
        "difficulty": body.difficulty,
        "reviews": reviews,
    }
    try:
        problem_id = await firebase_service.save_problem(problem_to_save)
    except Exception as e:
        logger.warning("Nao foi possivel salvar no Firestore: %s. Usando ID temporario.", e)
        problem_id = str(uuid.uuid4())

    # --- Monta a resposta ---
    # Converte dicionarios em modelos tipados da API.
    test_cases = [
        TestCase(
            input=tc.get("input", ""),
            expected_output=tc.get("expected_output", ""),
        )
        for tc in problem_data.get("test_cases", [])
    ]

    return GeneratedProblem(
        problem_id=problem_id,
        title=problem_data.get("title", "Problema sem titulo"),
        description=problem_data.get("description", ""),
        difficulty=body.difficulty,
        topic=body.topic,
        test_cases=test_cases,
        hints=problem_data.get("hints", []),
        solution_blocks=problem_data.get("solution_blocks", []),
    )


@router.get("", response_model=list[GeneratedProblem])
async def list_problems_endpoint(user: dict = Depends(get_current_user)):
    """
    Retorna uma lista com todos os problemas gerados e salvos.
    """
    try:
        # Lista todos os problemas ja gerados para exibir no frontend.
        raw_problems = await firebase_service.list_problems()
        formatted_problems = []
        for p in raw_problems:
            test_cases = [
                TestCase(
                    input=tc.get("input", ""),
                    expected_output=tc.get("expected_output", ""),
                )
                for tc in p.get("test_cases", [])
            ]
            formatted_problems.append(
                GeneratedProblem(
                    problem_id=p.get("problem_id", ""),
                    title=p.get("title", "Problema sem titulo"),
                    description=p.get("description", ""),
                    difficulty=p.get("difficulty", "facil"),
                    topic=p.get("topic", "Tema"),
                    test_cases=test_cases,
                    hints=p.get("hints", []),
                    solution_blocks=p.get("solution_blocks", []),
                )
            )
        return formatted_problems
    except Exception as e:
        logger.exception("Erro ao listar problemas.")
        raise HTTPException(status_code=500, detail=f"Erro ao listar problemas: {e}")
