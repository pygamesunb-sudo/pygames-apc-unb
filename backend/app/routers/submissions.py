import subprocess
import sys
import tempfile
import os
import logging

from fastapi import APIRouter, HTTPException

from app.models.schemas import SubmitCodeRequest, SubmitCodeResponse, TestResult
from app.services.firebase_service import get_problem

router = APIRouter(prefix="/api/submissions", tags=["submissions"])
logger = logging.getLogger(__name__)

MAX_CODE_LENGTH = 10_000  # Limite de caracteres para o codigo submetido


def _run_user_code(code: str, test_input: str) -> tuple[str, str | None]:
    """
    Executa o codigo do usuario em um subprocesso isolado com limite de tempo.
    Retorna (output, error).

    AVISO DE SEGURANCA: Esta implementacao e para desenvolvimento/MVP.
    Em producao, utilize um sandbox Docker ou servico como Judge0.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".py", delete=False, encoding="utf-8"
        ) as tmp:
            tmp.write(code)
            tmp_path = tmp.name

        proc = subprocess.run(
            [sys.executable, tmp_path],
            input=test_input,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return proc.stdout.strip(), proc.stderr.strip() or None
    except subprocess.TimeoutExpired:
        return "", "Tempo limite excedido (5 segundos)."
    except Exception as e:
        return "", str(e)
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/submit", response_model=SubmitCodeResponse)
async def submit_code(body: SubmitCodeRequest):
    """
    Recebe o codigo do usuario, busca o problema no Firestore,
    executa o codigo contra cada caso de teste e retorna os resultados.
    """
    if len(body.code) > MAX_CODE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Codigo excede o limite de {MAX_CODE_LENGTH} caracteres.",
        )

    # Busca o problema no Firestore
    problem_data = await get_problem(body.problem_id)
    if not problem_data:
        raise HTTPException(
            status_code=404,
            detail=f"Problema com ID '{body.problem_id}' nao encontrado.",
        )

    test_cases = problem_data.get("test_cases", [])
    if not test_cases:
        raise HTTPException(status_code=422, detail="Este problema nao possui casos de teste.")

    # Executa o codigo contra cada caso de teste
    results: list[TestResult] = []
    for i, tc in enumerate(test_cases):
        actual_output, error = _run_user_code(body.code, tc.get("input", ""))
        passed = actual_output == tc.get("expected_output", "").strip()
        results.append(
            TestResult(
                test_case_index=i,
                passed=passed,
                input=tc.get("input", ""),
                expected_output=tc.get("expected_output", ""),
                actual_output=actual_output,
                error=error,
            )
        )
        logger.debug("Caso de teste %d: passed=%s", i, passed)

    all_passed = all(r.passed for r in results)
    passed_count = sum(1 for r in results if r.passed)
    score = int((passed_count / len(results)) * 100) if results else 0

    logger.info(
        "Submissao para problema '%s': %d/%d testes passaram (score=%d).",
        body.problem_id,
        passed_count,
        len(results),
        score,
    )

    return SubmitCodeResponse(all_passed=all_passed, results=results, score=score)
