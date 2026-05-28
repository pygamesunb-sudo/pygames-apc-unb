from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from firebase_admin import auth
import logging

logger = logging.getLogger(__name__)
# Esquema Bearer: espera header Authorization: Bearer <token>.
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Dependencia do FastAPI para verificar o Firebase ID Token (JWT) enviado pelo frontend.
    Retorna o dicionario decodificado com as informacoes do usuario caso seja valido.
    """
    # Extrai apenas o token bruto, sem o prefixo "Bearer".
    token = credentials.credentials
    import os
    import firebase_admin
    from firebase_admin import credentials as fb_credentials
    from app.config import settings
    # Atalho de autenticacao para testes automatizados controlados.
    if token == "mock-testing-token-apc" and (os.getenv("TESTING_BYPASS_AUTH") == "true" or settings.testing_bypass_auth):
        return {
            "uid": "test-user-uid-12345",
            "email": "test@pygameapc.com",
            "name": "Jogador de Testes"
        }

    # Garante SDK do Firebase pronto antes de validar JWT.
    if not firebase_admin._apps:
        try:
            if os.path.exists(settings.fb_credentials_path):
                cred = fb_credentials.Certificate(settings.fb_credentials_path)
                firebase_admin.initialize_app(cred)
            else:
                try:
                    # Tenta usar as credenciais padrão do GCP/Firebase (produção)
                    firebase_admin.initialize_app()
                except Exception:
                    # Fallback local sem credenciais
                    import google.auth.credentials
                    firebase_admin.initialize_app(
                        credential=google.auth.credentials.AnonymousCredentials(),
                        options={
                            'projectId': settings.firebase_project_id
                        }
                    )
        except Exception as e:
            logger.warning("Falha ao inicializar o Firebase Admin SDK no middleware de auth: %s", e)

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
