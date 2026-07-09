"""
Servico de persistencia Firebase Firestore.

Colecoes utilizadas:
- problems     — desafios gerados pela LLM
- users        — perfil, pontos, recordes de mini-games
- submissions  — historico de codigo enviado
- system_config — variaveis de ambiente (via config.py)

Fallback: se o Firestore falhar, usa dicionarios em memoria (_in_memory_*).
"""
import firebase_admin
from firebase_admin import credentials, firestore
import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)

_db = None
_in_memory_db = {}       # Fallback local para problemas
_use_local_fallback = False


def get_db():
    """Retorna a instancia do Firestore, inicializando o Firebase Admin SDK se necessario."""
    global _db, _use_local_fallback
    if _use_local_fallback:
        return None

    if _db is None:
        cred_path = settings.fb_credentials_path
        if not os.path.exists(cred_path):
            logger.info("Sem firebase_credentials.json — usando banco em memoria.")
            _use_local_fallback = True
            return None

        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info("Firebase Admin SDK inicializado com credenciais do arquivo.")
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
    global _use_local_fallback
    db = get_db()
    if db is None:
        doc_id = str(uuid.uuid4())
        _in_memory_db[doc_id] = problem_data
        logger.info("Problema salvo em MEMORIA LOCAL com ID: %s", doc_id)
        return doc_id

    try:
        doc_ref = db.collection("problems").document()
        doc_ref.set(problem_data, timeout=5.0)
        logger.info("Problema salvo no Firestore com ID: %s", doc_ref.id)
        return doc_ref.id
    except Exception as e:
        logger.warning("Falha ao salvar no Firestore: %s. Ativando fallback local e salvando em memoria.", e)
        _use_local_fallback = True
        doc_id = str(uuid.uuid4())
        _in_memory_db[doc_id] = problem_data
        logger.info("Problema salvo em MEMORIA LOCAL (fallback) com ID: %s", doc_id)
        return doc_id


async def get_problem(problem_id: str) -> dict | None:
    """Busca um problema no Firestore (ou em memoria se falhar) pelo ID."""
    global _use_local_fallback
    db = get_db()
    if db is None:
        problem = _in_memory_db.get(problem_id)
        if problem:
            logger.info("Problema carregado da MEMORIA LOCAL com ID: %s", problem_id)
        return problem

    try:
        doc = db.collection("problems").document(problem_id).get(timeout=5.0)
        if doc.exists:
            return doc.to_dict()
    except Exception as e:
        logger.warning("Falha ao ler do Firestore: %s. Ativando fallback local e tentando na memoria.", e)
        _use_local_fallback = True
        return _in_memory_db.get(problem_id)
    return None


async def list_problems() -> list[dict]:
    """Retorna uma lista com todos os problemas salvos (Firestore ou memoria)."""
    global _use_local_fallback
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
        docs = db.collection("problems").get(timeout=5.0)
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
        logger.warning("Falha ao listar do Firestore: %s. Ativando fallback local.", e)
        _use_local_fallback = True
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


# --- Sistema de Pontuação e Histórico de Usuários ---

_in_memory_users = {}
_in_memory_submissions = []


async def get_user_profile_data(uid: str) -> dict:
    """Recupera o perfil do usuario do Firestore ou memoria local. Se nao existir, cria um novo perfil."""
    global _use_local_fallback
    db = get_db()
    if db is None:
        if uid not in _in_memory_users:
            _in_memory_users[uid] = {
                "uid": uid,
                "email": "",
                "name": "Usuario Anonimo",
                "coding_points": 0,
                "total_score": 0,
                "games": {
                    "doodle": 0,
                    "snake": 0,
                    "invaders": 0
                },
                "solved_problems": []
            }
        return _in_memory_users[uid]

    try:
        user_ref = db.collection("users").document(uid)
        doc = user_ref.get(timeout=5.0)
        if doc.exists:
            return doc.to_dict()
        else:
            # Cria o documento do usuario inicialmente
            new_profile = {
                "uid": uid,
                "email": "",
                "name": "Usuario Anonimo",
                "coding_points": 0,
                "total_score": 0,
                "games": {
                    "doodle": 0,
                    "snake": 0,
                    "invaders": 0
                },
                "solved_problems": []
            }
            user_ref.set(new_profile, timeout=5.0)
            return new_profile
    except Exception as e:
        logger.warning("Falha ao ler perfil do Firestore: %s. Usando memoria local.", e)
        _use_local_fallback = True
        if uid not in _in_memory_users:
            _in_memory_users[uid] = {
                "uid": uid,
                "email": "",
                "name": "Usuario Anonimo",
                "coding_points": 0,
                "total_score": 0,
                "games": {
                    "doodle": 0,
                    "snake": 0,
                    "invaders": 0
                },
                "solved_problems": []
            }
        return _in_memory_users[uid]


async def save_submission_to_db(
    uid: str,
    email: str,
    name: str,
    problem_id: str,
    problem_title: str,
    code: str,
    score: int,
    all_passed: bool
) -> dict:
    """
    Salva a submissao no Firestore e atualiza os pontos do usuario.
    Retorna o perfil atualizado do usuario com seus novos pontos.
    """
    import uuid
    from datetime import datetime
    global _use_local_fallback

    submission_id = str(uuid.uuid4())
    submission_data = {
        "submission_id": submission_id,
        "uid": uid,
        "email": email,
        "name": name,
        "problem_id": problem_id,
        "problem_title": problem_title,
        "code": code,
        "score": score,
        "all_passed": all_passed,
        "timestamp": datetime.utcnow().isoformat()
    }

    db = get_db()
    if db is None:
        _in_memory_submissions.append(submission_data)
        # Limita historico em memoria
        if len(_in_memory_submissions) > 100:
            _in_memory_submissions.pop(0)

        # Atualiza pontos em memoria
        profile = await get_user_profile_data(uid)
        profile["email"] = email
        profile["name"] = name

# Pontuacao concedida ao resolver 100% de um problema pela primeira vez
        if all_passed and problem_id not in profile.get("solved_problems", []):
            if "solved_problems" not in profile:
                profile["solved_problems"] = []
            profile["solved_problems"].append(problem_id)
            profile["coding_points"] = profile.get("coding_points", 0) + 50
            profile["total_score"] = profile["coding_points"] + sum(profile.get("games", {}).values())

        _in_memory_users[uid] = profile
        return profile

    try:
        # Salva submissao
        db.collection("submissions").document(submission_id).set(submission_data, timeout=5.0)

        # Atualiza perfil do usuario de forma direta
        user_ref = db.collection("users").document(uid)
        doc = user_ref.get(timeout=5.0)
        profile = doc.to_dict() if doc.exists else {
            "uid": uid,
            "email": email,
            "name": name,
            "coding_points": 0,
            "total_score": 0,
            "games": {
                "doodle": 0,
                "snake": 0,
                "invaders": 0
            },
            "solved_problems": []
        }

        profile["email"] = email
        profile["name"] = name

        # Concede 50 pontos apenas se resolveu 100% o exercicio pela primeira vez
        solved_list = profile.get("solved_problems", [])
        if all_passed and problem_id not in solved_list:
            solved_list.append(problem_id)
            profile["solved_problems"] = solved_list
            profile["coding_points"] = profile.get("coding_points", 0) + 50

        # Recalcula total_score
        games_dict = profile.get("games", {"doodle": 0, "snake": 0, "invaders": 0})
        profile["total_score"] = profile.get("coding_points", 0) + sum(games_dict.values())

        user_ref.set(profile, timeout=5.0)
        return profile
    except Exception as e:
        logger.exception("Erro ao salvar submissao no Firestore: %s", e)
        # Fallback para memoria local em caso de erro no Firestore
        _use_local_fallback = True
        _in_memory_submissions.append(submission_data)
        profile = await get_user_profile_data(uid)
        profile["email"] = email
        profile["name"] = name
        if all_passed and problem_id not in profile.get("solved_problems", []):
            profile["solved_problems"].append(problem_id)
            profile["coding_points"] = profile.get("coding_points", 0) + 50
            profile["total_score"] = profile["coding_points"] + sum(profile.get("games", {}).values())
        _in_memory_users[uid] = profile
        return profile


async def update_user_game_score(uid: str, email: str, name: str, game_key: str, score: int) -> dict:
    """
    Atualiza o highscore do usuario em um determinado minigame e recalculao total_score.
    Retorna o perfil atualizado do usuario.
    """
    global _use_local_fallback
    db = get_db()
    if db is None:
        profile = await get_user_profile_data(uid)
        profile["email"] = email
        profile["name"] = name
        games = profile.setdefault("games", {"doodle": 0, "snake": 0, "invaders": 0})
        current_high = games.get(game_key, 0)
        if score > current_high:
            games[game_key] = score
            profile["total_score"] = profile.get("coding_points", 0) + sum(games.values())
            _in_memory_users[uid] = profile
        return profile

    try:
        user_ref = db.collection("users").document(uid)
        doc = user_ref.get(timeout=5.0)
        profile = doc.to_dict() if doc.exists else {
            "uid": uid,
            "email": email,
            "name": name,
            "coding_points": 0,
            "total_score": 0,
            "games": {
                "doodle": 0,
                "snake": 0,
                "invaders": 0
            },
            "solved_problems": []
        }

        profile["email"] = email
        profile["name"] = name
        games = profile.setdefault("games", {"doodle": 0, "snake": 0, "invaders": 0})
        current_high = games.get(game_key, 0)

        if score > current_high:
            games[game_key] = score
            profile["total_score"] = profile.get("coding_points", 0) + sum(games.values())
            user_ref.set(profile, timeout=5.0)
            logger.info("Highscore de %s no jogo %s atualizado para %d!", name, game_key, score)
        return profile
    except Exception as e:
        logger.exception("Erro ao salvar recorde de jogo no Firestore: %s", e)
        # Fallback local
        _use_local_fallback = True
        profile = await get_user_profile_data(uid)
        profile["email"] = email
        profile["name"] = name
        games = profile.setdefault("games", {"doodle": 0, "snake": 0, "invaders": 0})
        current_high = games.get(game_key, 0)
        if score > current_high:
            games[game_key] = score
            profile["total_score"] = profile.get("coding_points", 0) + sum(games.values())
            _in_memory_users[uid] = profile
        return profile


async def get_leaderboard_data() -> list[dict]:
    """Retorna os melhores usuarios ordenados por total_score descendente."""
    global _use_local_fallback
    db = get_db()
    if db is None:
        users = list(_in_memory_users.values())
        return sorted(users, key=lambda x: x.get("total_score", 0), reverse=True)[:50]

    try:
        users_ref = db.collection("users").order_by("total_score", direction=firestore.Query.DESCENDING).limit(50)
        docs = users_ref.get(timeout=5.0)
        leaderboard = []
        for doc in docs:
            leaderboard.append(doc.to_dict())
        return leaderboard
    except Exception as e:
        logger.warning("Falha ao obter ranking do Firestore: %s. Ativando fallback local.", e)
        _use_local_fallback = True
        users = list(_in_memory_users.values())
        return sorted(users, key=lambda x: x.get("total_score", 0), reverse=True)[:50]


async def get_all_submissions_history() -> list[dict]:
    """Retorna as submissoes mais recentes de todos os usuarios."""
    global _use_local_fallback
    db = get_db()
    if db is None:
        return sorted(_in_memory_submissions, key=lambda x: x.get("timestamp", ""), reverse=True)[:50]

    try:
        sub_ref = db.collection("submissions").order_by("timestamp", direction=firestore.Query.DESCENDING).limit(50)
        docs = sub_ref.get(timeout=5.0)
        submissions = []
        for doc in docs:
            submissions.append(doc.to_dict())
        return submissions
    except Exception as e:
        logger.warning("Falha ao obter submissoes do Firestore: %s. Ativando fallback local.", e)
        _use_local_fallback = True
        return sorted(_in_memory_submissions, key=lambda x: x.get("timestamp", ""), reverse=True)[:50]


async def register_solved_exercise_points(uid: str, email: str, name: str, exercise_id: str) -> dict:
    """
    Registra um exercicio interativo resolvido do Docs, concedendo 50 pontos se resolvido pela primeira vez.
    Retorna o perfil atualizado do usuario.
    """
    global _use_local_fallback
    db = get_db()
    if db is None:
        profile = await get_user_profile_data(uid)
        profile["email"] = email
        profile["name"] = name
        solved_list = profile.setdefault("solved_problems", [])
        if exercise_id not in solved_list:
            solved_list.append(exercise_id)
            profile["coding_points"] = profile.get("coding_points", 0) + 50
            profile["total_score"] = profile.get("coding_points", 0) + sum(profile.setdefault("games", {"doodle": 0, "snake": 0, "invaders": 0}).values())
            _in_memory_users[uid] = profile
        return profile

    try:
        user_ref = db.collection("users").document(uid)
        doc = user_ref.get(timeout=5.0)
        profile = doc.to_dict() if doc.exists else {
            "uid": uid,
            "email": email,
            "name": name,
            "coding_points": 0,
            "total_score": 0,
            "games": {
                "doodle": 0,
                "snake": 0,
                "invaders": 0
            },
            "solved_problems": []
        }

        profile["email"] = email
        profile["name"] = name
        solved_list = profile.get("solved_problems", [])
        
        if exercise_id not in solved_list:
            solved_list.append(exercise_id)
            profile["solved_problems"] = solved_list
            profile["coding_points"] = profile.get("coding_points", 0) + 50
            games_dict = profile.get("games", {"doodle": 0, "snake": 0, "invaders": 0})
            profile["total_score"] = profile.get("coding_points", 0) + sum(games_dict.values())
            user_ref.set(profile, timeout=5.0)
            logger.info("Exercicio %s registrado para %s. Novos pontos: %d", exercise_id, name, profile["coding_points"])
        return profile
    except Exception as e:
        logger.exception("Erro ao salvar exercicio no Firestore: %s", e)
        _use_local_fallback = True
        profile = await get_user_profile_data(uid)
        profile["email"] = email
        profile["name"] = name
        solved_list = profile.setdefault("solved_problems", [])
        if exercise_id not in solved_list:
            solved_list.append(exercise_id)
            profile["coding_points"] = profile.get("coding_points", 0) + 50
            profile["total_score"] = profile.get("coding_points", 0) + sum(profile.setdefault("games", {"doodle": 0, "snake": 0, "invaders": 0}).values())
            _in_memory_users[uid] = profile
        return profile


# --- Rate Limiting e Cotas ---

async def check_and_update_rate_limit(uid: str, max_daily: int = 10, max_weekly: int = 50, max_monthly: int = 150) -> bool:
    """
    Verifica se o usuario atingiu sua cota de geracao de problemas.
    Se não atingiu, incrementa o uso e retorna True. Se atingiu, retorna False.
    """
    from datetime import datetime
    global _use_local_fallback
    
    now = datetime.utcnow()
    day_key = now.strftime("%Y-%m-%d")
    week_key = now.strftime("%Y-W%W")
    month_key = now.strftime("%Y-%m")
    
    db = get_db()
    if db is None:
        profile = await get_user_profile_data(uid)
        usage = profile.setdefault("usage", {})
        
        daily = usage.get(f"daily_{day_key}", 0)
        weekly = usage.get(f"weekly_{week_key}", 0)
        monthly = usage.get(f"monthly_{month_key}", 0)
        
        if daily >= max_daily or weekly >= max_weekly or monthly >= max_monthly:
            return False
            
        usage[f"daily_{day_key}"] = daily + 1
        usage[f"weekly_{week_key}"] = weekly + 1
        usage[f"monthly_{month_key}"] = monthly + 1
        _in_memory_users[uid] = profile
        return True

    try:
        user_ref = db.collection("users").document(uid)
        doc = user_ref.get(timeout=5.0)
        if not doc.exists:
            await get_user_profile_data(uid)
            doc = user_ref.get(timeout=5.0)
            
        profile = doc.to_dict()
        usage = profile.get("usage", {})
        
        daily = usage.get(f"daily_{day_key}", 0)
        weekly = usage.get(f"weekly_{week_key}", 0)
        monthly = usage.get(f"monthly_{month_key}", 0)
        
        if daily >= max_daily or weekly >= max_weekly or monthly >= max_monthly:
            logger.warning("Usuario %s atingiu limite de geracao. D:%d/%d, W:%d/%d, M:%d/%d", 
                           uid, daily, max_daily, weekly, max_weekly, monthly, max_monthly)
            return False
            
        usage[f"daily_{day_key}"] = daily + 1
        usage[f"weekly_{week_key}"] = weekly + 1
        usage[f"monthly_{month_key}"] = monthly + 1
        
        profile["usage"] = usage
        user_ref.set(profile, timeout=5.0)
        return True
    except Exception as e:
        logger.exception("Erro ao verificar limite de cota no Firestore: %s", e)
        _use_local_fallback = True
        return True
