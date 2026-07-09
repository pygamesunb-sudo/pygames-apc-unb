"""
Dependencias injetaveis do FastAPI (middleware de autenticacao).

O frontend envia o Firebase ID Token no header `Authorization: Bearer <token>`.
Este modulo valida o token e retorna os dados do usuario para os endpoints protegidos.

Estrategia de validacao (em ordem):
1. Token de teste mock (apenas com TESTING_BYPASS_AUTH=true)
2. Firebase Admin SDK (service account ou ADC)
3. Fallback REST via Identity Toolkit (FIREBASE_WEB_API_KEY)
"""
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)

# Extrai automaticamente o header Authorization: Bearer <token>
security = HTTPBearer()


async def _verify_token_via_rest(token: str) -> dict:
    """
    Valida JWT do Firebase via API REST do Identity Toolkit.

    Usado em desenvolvimento local quando nao ha firebase_credentials.json.
    A chave FIREBASE_WEB_API_KEY e publica (mesma do frontend).
    """
    from app.config import settings

    api_key = settings.firebase_web_api_key
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Backend sem credenciais Firebase. Configure FIREBASE_WEB_API_KEY ou firebase_credentials.json.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={api_key}",
            json={"idToken": token},
            timeout=10.0,
        )

    if response.status_code != 200:
        logger.warning("Falha na verificacao REST do token Firebase: %s", response.text)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao invalido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    users = response.json().get("users", [])
    if not users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticacao invalido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = users[0]
    return {
        "uid": user.get("localId"),
        "email": user.get("email"),
        "name": user.get("displayName"),
    }


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependencia injetada em endpoints protegidos via `Depends(get_current_user)`.

    Retorna dict com uid, email e name do usuario autenticado.
    Levanta HTTP 401 se o token for invalido ou expirado.
    """
    token = credentials.credentials
    import os
    import firebase_admin
    from firebase_admin import credentials as fb_credentials
    from app.config import settings

    # Bypass exclusivo para testes automatizados (pytest)
    if token == "mock-testing-token-apc" and (os.getenv("TESTING_BYPASS_AUTH") == "true" or settings.testing_bypass_auth):
        return {
            "uid": "test-user-uid-12345",
            "email": "test@pygameapc.com",
            "name": "Jogador de Testes"
        }

    # Sem service account: valida token via REST (nao inicializa Admin SDK com credenciais quebradas)
    if not os.path.exists(settings.fb_credentials_path):
        return await _verify_token_via_rest(token)

    # Inicializa o Admin SDK na primeira requisicao autenticada (somente com service account)
    if not firebase_admin._apps:
        try:
            cred = fb_credentials.Certificate(settings.fb_credentials_path)
            firebase_admin.initialize_app(cred)
        except Exception as e:
            logger.warning("Falha ao inicializar o Firebase Admin SDK no middleware de auth: %s", e)
            return await _verify_token_via_rest(token)

    try:
        return auth.verify_id_token(token)
    except auth.ExpiredIdTokenError:
        logger.warning("Token do Firebase expirou.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="O token de autenticacao expirou. Por favor, faca login novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.InvalidIdTokenError:
        logger.warning("Token do Firebase invalido via Admin SDK. Tentando verificacao REST...")
        return await _verify_token_via_rest(token)
    except Exception as e:
        if os.path.exists(settings.fb_credentials_path):
            logger.exception("Erro inesperado ao verificar token de autenticacao.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Erro de autenticacao: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        logger.warning("Admin SDK indisponivel (%s). Usando verificacao REST do Firebase.", e)
        return await _verify_token_via_rest(token)
