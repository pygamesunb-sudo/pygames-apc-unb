from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependencia do FastAPI para verificar o Firebase ID Token (JWT) enviado pelo frontend.
    Retorna o dicionario decodificado com as informacoes do usuario caso seja valido.
    """
    token = credentials.credentials
    import os
    from app.config import settings
    # Suporte a E2E testing bypass local e seguro
    if token == "mock-testing-token-apc" and (os.getenv("TESTING_BYPASS_AUTH") == "true" or settings.testing_bypass_auth):
        return {
            "uid": "test-user-uid-12345",
            "email": "test@pygameapc.com",
            "name": "Jogador de Testes"
        }

    try:
        # Verifica o token com o Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        logger.warning("Token do Firebase expirou.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="O token de autenticacao expirou. Por favor, faca login novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        logger.warning("Token do Firebase invalido.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao invalido.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.exception("Erro inesperado ao verificar token de autenticacao.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Erro de autenticacao: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
