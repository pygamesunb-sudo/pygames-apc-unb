import logging
import os

import firebase_admin
from firebase_admin import credentials

from app.config import settings

logger = logging.getLogger(__name__)


def ensure_firebase_initialized() -> None:
    """Inicializa o Firebase Admin SDK uma unica vez, se ainda nao estiver ativo."""
    # Evita reinicializar o SDK em cada requisicao autenticada.
    if firebase_admin._apps:
        return

    # Ordem de prioridade: variavel de ambiente, settings e caminho legado.
    credential_path = (
        os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        or settings.google_application_credentials
        or settings.fb_credentials_path
    )

    try:
        if credential_path and os.path.exists(credential_path):
            cred = credentials.Certificate(credential_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK inicializado com credenciais de arquivo.")
            return

        try:
            # Tenta usar as credenciais padrao do GCP/Firebase (producao).
            firebase_admin.initialize_app()
            logger.info("Firebase Admin SDK inicializado com credenciais padrao do ambiente.")
            return
        except Exception:
            import google.auth.credentials

            # Fallback local sem credenciais reais (desenvolvimento).
            firebase_admin.initialize_app(
                credential=google.auth.credentials.AnonymousCredentials(),
                options={"projectId": settings.firebase_project_id},
            )
            logger.warning(
                "Firebase Admin SDK inicializado em modo local sem credenciais reais. "
                "Configure FB_CREDENTIALS_PATH ou GOOGLE_APPLICATION_CREDENTIALS."
            )
    except Exception as exc:
        logger.exception("Falha ao inicializar Firebase Admin SDK: %s", exc)
        raise
