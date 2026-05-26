from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Literal

from app.dependencies import get_current_user
from app.services import firebase_service

router = APIRouter(prefix="/api/users", tags=["users"])


class GameScoreRequest(BaseModel):
    game: Literal["doodle", "snake", "invaders"] = Field(..., description="Chave identificadora do minigame.")
    score: int = Field(..., ge=0, description="Pontuacao obtida no minigame.")


@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    """
    Retorna as informacoes de perfil do usuario logado (pontos e recordes).
    """
    uid = user.get("uid")
    email = user.get("email", "")
    name = user.get("name", "Usuario Anonimo")
    
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
    leaderboard = await firebase_service.get_leaderboard_data()
    return leaderboard
