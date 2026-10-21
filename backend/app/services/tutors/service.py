"""Motor unico dos tutores.

Os modos mudam o prompt. A politica, o historico, o limite e o cliente de IA
sao os mesmos para a pagina e para o chatbot flutuante.
"""

from __future__ import annotations

import logging

from app.config import settings
from app.models.tutors import (
    TutorChatRequest,
    TutorChatResponse,
    TutorConversationDetail,
    TutorConversationSummary,
    TutorMessage,
    TutorUsageView,
)
from app.services.ai.client import LLMUnavailable, chat_completion
from app.services.ai.usage import consume_daily_message
from app.services.tutors import context as tutor_context
from app.services.tutors import history
from app.services.tutors.policies import resolve_stage
from app.services.tutors.prompts import build_messages

logger = logging.getLogger(__name__)


class ConversationNotFound(Exception):
    """A conversa nao existe ou pertence a outro usuario."""


class TutorModeConflict(Exception):
    """Uma conversa nao troca de modo no meio do caminho."""


def _usage_view(snapshot) -> TutorUsageView:
    return TutorUsageView(used=snapshot.count, limit=snapshot.limit)


def _summary(conversation: dict) -> TutorConversationSummary:
    return TutorConversationSummary(
        conversation_id=conversation["conversation_id"],
        mode=conversation["mode"],
        surface=conversation.get("surface") or "page",
        problem_id=conversation.get("problem_id"),
        stage=int(conversation.get("stage") or 1),
        preview=conversation.get("preview") or "",
        updated_at=conversation.get("updated_at") or "",
    )


async def list_user_conversations(uid: str) -> list[TutorConversationSummary]:
    rows = await history.list_conversations(uid)
    return [_summary(row) for row in rows]


async def get_user_conversation(uid: str, conversation_id: str) -> TutorConversationDetail:
    conversation = await history.get_conversation(conversation_id, uid)
    if conversation is None:
        raise ConversationNotFound()
    messages = await history.list_messages(conversation_id)
    detail = _summary(conversation).model_dump()
    detail["messages"] = [
        TutorMessage(
            message_id=item["message_id"],
            role=item["role"],
            content=item.get("content") or "",
            created_at=item.get("created_at") or "",
            stage=item.get("stage"),
            code=item.get("code"),
        )
        for item in messages
    ]
    return TutorConversationDetail(**detail)


async def chat(user: dict, request: TutorChatRequest) -> TutorChatResponse:
    uid = user.get("uid") or ""
    conversation = None
    prior_messages: list[dict] = []
    if request.conversation_id:
        conversation = await history.get_conversation(request.conversation_id, uid)
        if conversation is None:
            raise ConversationNotFound()
        if conversation.get("mode") != request.mode:
            raise TutorModeConflict()
        prior_messages = await history.list_messages(conversation["conversation_id"])

    snapshot = await consume_daily_message(uid)
    prior_assistant = sum(1 for item in prior_messages if item.get("role") == "assistant")
    stage = resolve_stage(prior_assistant, request.message)
    problem_id = (conversation or {}).get("problem_id") or request.problem_id
    tutor_ctx = await tutor_context.build_context(
        user=user,
        mode=request.mode,
        surface=request.surface,
        stage=stage,
        problem_id=problem_id,
        code=request.code,
    )
    llm_messages = build_messages(
        mode=request.mode,
        stage=stage,
        context=tutor_ctx,
        history=prior_messages,
        user_message=request.message,
    )
    model = (settings.tutor_model or "").strip() or settings.openrouter_model
    logger.info(
        "Tutor uid=%s mode=%s stage=%s surface=%s",
        uid,
        request.mode,
        stage,
        request.surface,
    )
    reply = await chat_completion(
        llm_messages,
        temperature=0.4,
        timeout=60.0,
        models=[model],
        use_generation_fallbacks=False,
        missing_key_message=(
            "OPENROUTER_API_KEY nao configurada na Function. "
            "Defina o segredo antes de usar o tutor."
        ),
        failure_message="O tutor nao conseguiu obter resposta do modelo.",
        log_label="Tutor",
    )
    text = str(reply).strip()
    if not text:
        raise LLMUnavailable("O tutor retornou uma resposta vazia.")

    if conversation is None:
        conversation = await history.create_conversation(
            uid=uid,
            mode=request.mode,
            surface=request.surface,
            problem_id=problem_id,
            preview=request.message,
        )

    message_id = await history.append_turn(
        conversation,
        user_message=request.message,
        assistant_message=text,
        stage=stage,
        surface=request.surface,
        code=request.code,
        problem_id=problem_id,
    )
    return TutorChatResponse(
        conversation_id=conversation["conversation_id"],
        message_id=message_id,
        mode=request.mode,
        stage=stage,
        surface=request.surface,
        reply=text,
        usage=_usage_view(snapshot),
    )
