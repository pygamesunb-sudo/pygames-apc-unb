import logging

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_current_user
from app.models.tutors import TutorChatRequest, TutorChatResponse, TutorConversationDetail, TutorConversationSummary
from app.services.ai.client import LLMUnavailable
from app.services.ai.usage import DailyLimitExceeded, UsageStoreError
from app.services.tutors import service as tutor_service
from app.services.tutors.history import ConversationStoreError
from app.services.tutors.service import ConversationNotFound, TutorModeConflict

router = APIRouter(prefix="/api/tutors", tags=["tutors"])
logger = logging.getLogger(__name__)


def _store_error(exc: Exception) -> HTTPException:
    logger.warning("Falha de persistencia do tutor: %s", exc)
    return HTTPException(
        status_code=503,
        detail="O tutor esta temporariamente indisponivel. O restante da aplicacao continua no ar.",
    )


@router.post("/chat", response_model=TutorChatResponse)
async def chat(body: TutorChatRequest, user: dict = Depends(get_current_user)):
    try:
        return await tutor_service.chat(user, body)
    except DailyLimitExceeded as exc:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "tutor_daily_limit",
                "message": "Limite diario de mensagens do tutor atingido.",
                "used": exc.used,
                "limit": exc.limit,
            },
        ) from exc
    except TutorModeConflict as exc:
        raise HTTPException(
            status_code=409,
            detail="Esta conversa ja esta vinculada a outro tutor.",
        ) from exc
    except ConversationNotFound as exc:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada.") from exc
    except (UsageStoreError, ConversationStoreError) as exc:
        raise _store_error(exc) from exc
    except (LLMUnavailable, RuntimeError) as exc:
        logger.warning("Tutor sem resposta do modelo: %s", exc)
        raise HTTPException(
            status_code=502,
            detail="O tutor nao conseguiu responder agora.",
        ) from exc


@router.get("/conversations", response_model=list[TutorConversationSummary])
async def list_conversations(user: dict = Depends(get_current_user)):
    try:
        return await tutor_service.list_user_conversations(user.get("uid") or "")
    except ConversationStoreError as exc:
        raise _store_error(exc) from exc


@router.get("/conversations/{conversation_id}", response_model=TutorConversationDetail)
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    if not conversation_id or "/" in conversation_id or len(conversation_id) > 128:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada.")
    try:
        return await tutor_service.get_user_conversation(user.get("uid") or "", conversation_id)
    except ConversationNotFound as exc:
        raise HTTPException(status_code=404, detail="Conversa nao encontrada.") from exc
    except ConversationStoreError as exc:
        raise _store_error(exc) from exc
