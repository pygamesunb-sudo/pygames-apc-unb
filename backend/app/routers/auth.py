import logging

from fastapi import APIRouter, HTTPException, status
from firebase_admin import auth as firebase_auth
from pydantic import BaseModel, Field

from app.services.firebase_admin_init import ensure_firebase_initialized

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class FirebaseLoginRequest(BaseModel):
    token: str = Field(..., min_length=10, description="Firebase ID Token (JWT)")


class FirebaseUserResponse(BaseModel):
    uid: str
    name: str | None = None
    email: str | None = None
    picture: str | None = None


class FirebaseLoginResponse(BaseModel):
    success: bool = True
    user: FirebaseUserResponse


@router.post("/firebase-login", response_model=FirebaseLoginResponse)
async def firebase_login(body: FirebaseLoginRequest):
    """
    Valida o ID Token emitido pelo Firebase Auth (login Google no frontend)
    e retorna os dados basicos do usuario autenticado.
    """
    try:
        ensure_firebase_initialized()
        decoded = firebase_auth.verify_id_token(body.token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao expirado. Faca login novamente.",
        )
    except firebase_auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revogado. Faca login novamente.",
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao invalido.",
        )
    except Exception as exc:
        logger.exception("Erro ao validar token Firebase: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Nao foi possivel validar o token no servidor. Verifique as credenciais do Firebase Admin.",
        )

    return FirebaseLoginResponse(
        user=FirebaseUserResponse(
            uid=decoded.get("uid", ""),
            name=decoded.get("name"),
            email=decoded.get("email"),
            picture=decoded.get("picture"),
        )
    )
