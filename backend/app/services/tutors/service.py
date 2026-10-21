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
    TutorExercise,
    TutorExerciseRequest,
    TutorMessage,
    TutorUsageView,
)
from app.services.ai.client import LLMUnavailable
from app.services.ai.errors import TutorAINotConfigured
from app.services.ai.gemini_client import gemini_api_key, resolve_tutor_model
from app.services.ai.usage import consume_daily_message
from app.services.tutors import context as tutor_context
from app.services.tutors import history
from app.services.tutors.exercise import (
    InvalidGeneratedExercise,
    build_generator_messages,
    parse_generated_exercise,
)
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


def get_tutor_provider():
    from app.services.ai.gemini_client import GeminiProvider

    return GeminiProvider()


async def _complete(messages: list[dict]) -> str:
    if not gemini_api_key():
        raise TutorAINotConfigured()
    provider = get_tutor_provider()
    model = resolve_tutor_model()
    logger.info("Tutor chamando provider=%s model=%s", provider.name, model)
    return await provider.complete(
        messages,
        temperature=0.4,
        model=model,
        timeout=60.0,
    )


async def generate_exercise(user: dict, request: TutorExerciseRequest) -> TutorExercise:
    uid = user.get("uid") or ""
    await consume_daily_message(uid)
    logger.info("Tutor gerando exercicio uid=%s topic=%s", uid, request.topic)
    raw = await _complete(build_generator_messages(request.topic, request.difficulty))
    try:
        return parse_generated_exercise(raw, topic=request.topic, difficulty=request.difficulty)
    except InvalidGeneratedExercise as exc:
        logger.warning("Exercicio gerado pelo tutor foi recusado.")
        raise LLMUnavailable("O tutor nao conseguiu montar um exercicio valido.") from exc


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
    if request.mode == "exercise" and request.exercise is not None:
        tutor_ctx["exercicio_fixado"] = request.exercise.model_dump()
    llm_messages = build_messages(
        mode=request.mode,
        stage=stage,
        context=tutor_ctx,
        history=prior_messages,
        user_message=request.message,
    )
    logger.info(
        "Tutor uid=%s mode=%s stage=%s surface=%s",
        uid,
        request.mode,
        stage,
        request.surface,
    )
    text = await _complete(llm_messages)

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
