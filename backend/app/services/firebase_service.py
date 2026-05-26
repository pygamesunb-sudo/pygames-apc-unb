import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)

_db = None
_in_memory_db = {}
_use_local_fallback = False


def get_db():
    """Retorna a instancia do Firestore, inicializando o Firebase Admin SDK se necessario."""
    global _db, _use_local_fallback
    if _use_local_fallback:
        return None

    if _db is None:
        try:
            if not firebase_admin._apps:
                cred_path = settings.firebase_credentials_path
                if os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred)
                    logger.info("Firebase Admin SDK inicializado com credenciais do arquivo.")
                else:
                    # Tenta inicializar com ADC. Se falhar, usa o fallback local em memoria.
                    firebase_admin.initialize_app()
                    logger.info("Firebase Admin SDK inicializado com Application Default Credentials.")
            _db = firestore.client()
        except Exception as e:
            logger.warning(
                "Nao foi possivel inicializar o Firebase Firestore: %s. "
                "Ativando banco de dados local temporario em memoria para este processo.",
                e
            )
            _use_local_fallback = True
            return None
    return _db


async def save_problem(problem_data: dict) -> str:
    """Salva o problema gerado no Firestore (ou em memoria se falhar) e retorna o ID do documento."""
    import uuid
    db = get_db()
    if db is None:
        doc_id = str(uuid.uuid4())
        _in_memory_db[doc_id] = problem_data
        logger.info("Problema salvo em MEMORIA LOCAL com ID: %s", doc_id)
        return doc_id

    doc_ref = db.collection("problems").document()
    doc_ref.set(problem_data)
    logger.info("Problema salvo no Firestore com ID: %s", doc_ref.id)
    return doc_ref.id


async def get_problem(problem_id: str) -> dict | None:
    """Busca um problema no Firestore (ou em memoria se falhar) pelo ID."""
    db = get_db()
    if db is None:
        problem = _in_memory_db.get(problem_id)
        if problem:
            logger.info("Problema carregado da MEMORIA LOCAL com ID: %s", problem_id)
        return problem

    try:
        doc = db.collection("problems").document(problem_id).get()
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        logger.warning("Falha ao ler do Firestore: %s. Tentando na memoria local.", e)
        return _in_memory_db.get(problem_id)
    return None


async def list_problems() -> list[dict]:
    """Retorna uma lista com todos os problemas salvos (Firestore ou memoria)."""
    db = get_db()
    problems = []
    if db is None:
        for doc_id, problem in _in_memory_db.items():
            problems.append({
                "problem_id": doc_id,
                "title": problem.get("title", "Problema sem titulo"),
                "difficulty": problem.get("difficulty", "facil"),
                "topic": problem.get("topic", "Tema"),
                "hints": problem.get("hints", []),
                "solution_blocks": problem.get("solution_blocks", []),
                "description": problem.get("description", ""),
                "test_cases": problem.get("test_cases", [])
            })
        return sorted(problems, key=lambda x: x["title"])

    try:
        docs = db.collection("problems").get()
        for doc in docs:
            p_data = doc.to_dict()
            problems.append({
                "problem_id": doc.id,
                "title": p_data.get("title", "Problema sem titulo"),
                "difficulty": p_data.get("difficulty", "facil"),
                "topic": p_data.get("topic", "Tema"),
                "hints": p_data.get("hints", []),
                "solution_blocks": p_data.get("solution_blocks", []),
                "description": p_data.get("description", ""),
                "test_cases": p_data.get("test_cases", [])
            })
        return problems
    except Exception as e:
        logger.warning("Falha ao listar do Firestore: %s. Usando memoria local.", e)
        for doc_id, problem in _in_memory_db.items():
            problems.append({
                "problem_id": doc_id,
                "title": problem.get("title", "Problema sem titulo"),
                "difficulty": problem.get("difficulty", "facil"),
                "topic": problem.get("topic", "Tema"),
                "hints": problem.get("hints", []),
                "solution_blocks": problem.get("solution_blocks", []),
                "description": problem.get("description", ""),
                "test_cases": problem.get("test_cases", [])
            })
        return sorted(problems, key=lambda x: x["title"])
