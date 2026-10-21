"""Monta o contexto que o tutor pode ver.

A solucao oficial do exercicio, os blocos e as saidas esperadas nao entram.
Esse material continua reservado ao corretor automatico.
`referencias` existe para um RAG futuro e hoje fica vazio.
"""

from __future__ import annotations

import logging

from app.services import firebase_service
from app.services.tutors.policies import STAGE_HINT

logger = logging.getLogger(__name__)

_MAX_CODE_CHARS = 4000
_HIDDEN_PROBLEM_KEYS = {"solution", "solution_blocks", "expected_output", "gemini_api_key"}


def public_exercise_view(problem: dict | None, stage: int) -> dict | None:
    if not problem:
        return None
    view = {
        "titulo": problem.get("title") or "",
        "enunciado": problem.get("description") or "",
        "dificuldade": problem.get("difficulty") or "",
        "tema": problem.get("topic") or "",
    }
    if stage >= STAGE_HINT:
        hints = problem.get("hints") or []
        if hints:
            view["dica_disponivel"] = str(hints[0])
    return view


def _public_attempt(attempt: dict) -> dict:
    passed = bool(attempt.get("all_passed"))
    item = {
        "pontuacao": attempt.get("score"),
        "passou": passed,
        "quando": attempt.get("timestamp") or "",
    }
    if not passed:
        code = (attempt.get("code") or "").strip()
        if code:
            item["trecho"] = code[:400]
    return item


async def load_previous_attempts(uid: str, problem_id: str, limit: int = 5) -> list[dict]:
    try:
        db = firebase_service.get_db()
        if db is None:
            rows = [
                item
                for item in firebase_service._in_memory_submissions
                if item.get("uid") == uid and item.get("problem_id") == problem_id
            ]
        else:
            docs = (
                db.collection("submissions")
                .where("uid", "==", uid)
                .where("problem_id", "==", problem_id)
                .limit(limit)
                .get(timeout=5.0)
            )
            rows = [doc.to_dict() or {} for doc in docs]
    except Exception:
        logger.warning("Nao foi possivel carregar tentativas anteriores do tutor.", exc_info=True)
        return []

    rows.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
    return [_public_attempt(item) for item in rows[:limit]]


async def build_context(
    *,
    user: dict,
    mode: str,
    surface: str,
    stage: int,
    problem_id: str | None,
    code: str | None,
) -> dict:
    exercise = None
    attempts: list[dict] = []
    if problem_id:
        try:
            raw = await firebase_service.get_problem(problem_id)
        except Exception:
            logger.warning("Nao foi possivel carregar o exercicio %s para o tutor.", problem_id, exc_info=True)
            raw = None
        exercise = public_exercise_view(raw, stage)
        attempts = await load_previous_attempts(user.get("uid", ""), problem_id)

    current_code = (code or "").strip()
    return {
        "aluno": {"nome": user.get("name") or "Aluno"},
        "modo": mode,
        "superficie": surface,
        "exercicio": exercise,
        "codigo_atual": current_code[:_MAX_CODE_CHARS] if current_code else None,
        "tentativas_anteriores": attempts,
        "referencias": [],
    }
