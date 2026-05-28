from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Literal

from app.dependencies import get_current_user
from app.services import firebase_service

router = APIRouter(prefix="/api/users", tags=["users"])


class GameScoreRequest(BaseModel):
    # Minigame aceito pelo backend para atualizar recordes.
    game: Literal["doodle", "snake", "invaders"] = Field(..., description="Chave identificadora do minigame.")
    # Pontuacao enviada pelo frontend (nao negativa).
    score: int = Field(..., ge=0, description="Pontuacao obtida no minigame.")


@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """
    Retorna as informacoes de perfil do usuario logado (pontos e recordes).
    """
    # Dados basicos extraidos do token autenticado.
    uid = user.get("uid")
    email = user.get("email", "")
    name = user.get("name", "Usuario Anonimo")
    
    # Recupera perfil persistido (Firestore ou fallback local).
    profile = await firebase_service.get_user_profile_data(uid)
    # Sincroniza dados da conta Google atuais caso nao estejam definidos ou alterados
    if not profile.get("email") or not profile.get("name") or profile.get("name") == "Usuario Anonimo":
        profile["email"] = email
        profile["name"] = name
        
    return profile


@router.post("/score")
async def update_score(body: GameScoreRequest, user: dict = Depends(get_current_user)):
    """
    Registra um novo score de mini-game.
    Atualiza o highscore do usuario se a pontuacao for maior do que o recorde anterior.
    """
    # Atualizacao de score depende sempre de usuario autenticado.
    uid = user.get("uid")
    email = user.get("email", "")
    name = user.get("name", "Usuario Anonimo")
    
    updated_profile = await firebase_service.update_user_game_score(
        uid=uid,
        email=email,
        name=name,
        game_key=body.game,
        score=body.score
    )
    return {
        "status": "success",
        "highscore": updated_profile.get("games", {}).get(body.game, 0),
        "total_score": updated_profile.get("total_score", 0),
        "profile": updated_profile
    }


@router.get("/leaderboard")
async def get_leaderboard(user: dict = Depends(get_current_user)):
    """
    Retorna o Placar de Lideres global de todos os usuarios ordenados pela pontuacao geral.
    Exige autenticacao.
    """
    # Placar global para ranking geral da plataforma.
    leaderboard = await firebase_service.get_leaderboard_data()
    return leaderboard


class GeminiConfigRequest(BaseModel):
    # Chave pessoal opcional para usar Gemini em vez da chave padrao do backend.
    gemini_api_key: str | None = Field(default=None, description="Chave de API do Gemini do usuario (salva no Firestore).")
    use_custom_key: bool = Field(default=False, description="Se deve usar a chave de API customizada.")


@router.post("/gemini-config")
async def update_gemini_config(body: GeminiConfigRequest, user: dict = Depends(get_current_user)):
    """
    Salva as configuracoes de API Key do Gemini do usuario no Firestore para sincronismo entre navegadores.
    """
    uid = user.get("uid")
    profile = await firebase_service.get_user_profile_data(uid)
    profile["gemini_api_key"] = body.gemini_api_key
    profile["use_custom_key"] = body.use_custom_key
    
    # Persistencia prioriza Firestore; se indisponivel, usa memoria local.
    # OBS: verificar se este trecho ainda e necessario
    # (acesso direto ao atributo interno _in_memory_users pode acoplar a rota ao servico).
    db = firebase_service.get_db()
    if db is not None:
        user_ref = db.collection("users").document(uid)
        user_ref.set(profile, timeout=5.0)
    else:
        firebase_service._in_memory_users[uid] = profile
        
    return {"status": "success", "profile": profile}
