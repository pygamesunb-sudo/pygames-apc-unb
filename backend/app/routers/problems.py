import asyncio
import logging
import uuid
import random

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse

from app.models.schemas import (
    GenerateProblemRequest, 
    GeneratedProblem, 
    TestCase,
    ValidateProblemRequest,
    ValidateProblemResponse,
    ReviewProblemRequest,
    TestResult
)
from app.services.llm_generator import generate_problem, generate_problem_stream
from app.services.llm_reviewer import review_problem, _run_solution_against_tests
from app.services import firebase_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/problems", tags=["problems"])
logger = logging.getLogger(__name__)


@router.post("/generate_stream")
async def generate_problem_stream_endpoint(body: GenerateProblemRequest, user: dict = Depends(get_current_user)):
    """
    Gera um novo problema de programacao via SSE (Server-Sent Events).
    Aplica limites de cota antes de gerar.
    """
    # 1. Verifica limites de cota
    uid = user.get("uid", "anonymous")
    allowed = await firebase_service.check_and_update_rate_limit(uid=uid)
    if not allowed:
        raise HTTPException(
            status_code=429, 
            detail="Você atingiu o limite de gerações diárias/semanais. Tente novamente mais tarde."
        )

    # 2. Retorna a resposta em stream
    return StreamingResponse(
        generate_problem_stream(
            topic=body.topic,
            difficulty=body.difficulty,
            gemini_api_key=body.gemini_api_key,
            use_custom_key=body.use_custom_key
        ),
        media_type="text/event-stream"
    )


@router.post("/validate", response_model=ValidateProblemResponse)
async def validate_problem_endpoint(body: ValidateProblemRequest, user: dict = Depends(get_current_user)):
    """
    Roda a solucao gerada contra os casos de teste localmente.
    A ser chamado pelo Frontend logo apos terminar o stream.
    """
    try:
        # Formata para o formato esperado pelo _run_solution_against_tests
        test_cases_dict = [
            {"input": tc.input, "expected_output": tc.expected_output}
            for tc in body.test_cases
        ]
        
        results_dict = _run_solution_against_tests(body.solution, test_cases_dict)
        all_passed = all(r["passed"] for r in results_dict)
        
        results = [
            TestResult(
                test_case_index=r["test_case_index"],
                passed=r["passed"],
                input=r["input"],
                expected_output=r["expected_output"],
                actual_output=r["actual_output"],
                error=r["error"]
            )
            for r in results_dict
        ]
        
        return ValidateProblemResponse(passed=all_passed, results=results)
    except Exception as e:
        logger.exception("Erro na validacao automatica da solucao.")
        raise HTTPException(status_code=500, detail=f"Erro ao validar problema: {e}")


@router.post("/review", response_model=GeneratedProblem)
async def review_problem_endpoint(body: ReviewProblemRequest, user: dict = Depends(get_current_user)):
    """
    Aciona o agente revisor para corrigir um problema que falhou nos testes iniciais.
    Salva no Firestore se corrigido com sucesso.
    """
    problem_data = body.problem_data
    
    try:
        review_result = await review_problem(
            problem_data, 
            reviewer_index=1, 
            gemini_api_key=body.gemini_api_key, 
            use_custom_key=body.use_custom_key
        )
    except Exception as e:
        logger.exception("Erro ao acionar revisor.")
        raise HTTPException(status_code=502, detail=f"Erro na API de revisao: {e}")
        
    if not review_result.get("approved"):
        raise HTTPException(
            status_code=422,
            detail=f"O revisor nao conseguiu consertar o problema. Feedback: {review_result.get('feedback')}"
        )
        
    corrected = review_result.get("corrected_problem")
    if corrected:
        problem_data = {**problem_data, **corrected}
        if "solution_blocks" in problem_data and problem_data["solution_blocks"]:
            random.shuffle(problem_data["solution_blocks"])
            
    # Salva no Firestore
    problem_to_save = {
        **problem_data,
        "reviews": [review_result]
    }
    
    try:
        problem_id = await firebase_service.save_problem(problem_to_save)
    except Exception as e:
        logger.warning("Nao foi possivel salvar no Firestore: %s. Usando ID temporario.", e)
        problem_id = str(uuid.uuid4())

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
        difficulty=problem_data.get("difficulty", "facil"),
        topic=problem_data.get("topic", "Tema"),
        test_cases=test_cases,
        hints=problem_data.get("hints", []),
        solution_blocks=problem_data.get("solution_blocks", []),
    )


@router.post("/generate", response_model=GeneratedProblem, status_code=201)
async def generate_problem_endpoint(body: GenerateProblemRequest, user: dict = Depends(get_current_user)):
    """
    [DEPRECATED] Mantido por compatibilidade.
    Gera um novo problema de programacao baseado no topico e dificuldade.
    """
    # ... mesma implementacao basica da geracao sem SSE, mantida para os testes
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
        
    # --- Etapa 3: Persistencia no Firestore ---
    problem_to_save = {
        **problem_data,
        "topic": body.topic,
        "difficulty": body.difficulty,
        "reviews": [],
    }
    try:
        problem_id = await firebase_service.save_problem(problem_to_save)
    except Exception as e:
        logger.warning("Nao foi possivel salvar no Firestore: %s.", e)
        problem_id = str(uuid.uuid4())

    test_cases = [
        TestCase(input=tc.get("input", ""), expected_output=tc.get("expected_output", ""))
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
