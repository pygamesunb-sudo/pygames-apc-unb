"""Motor unico dos tutores.

Os modos mudam o prompt. A politica, o historico, o limite e o cliente de IA
sao os mesmos para a pagina e para o chatbot flutuante.
"""

from __future__ import annotations

import logging

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
from app.services.ai.gemini_client import resolve_gemini_key, resolve_tutor_model
from app.services.ai.usage import consume_daily_message
from app.services.tutors import context as tutor_context
from app.services.tutors import history
from app.services.tutors.behaviors import behavior_for
from app.services.tutors.exercise import (
    InvalidGeneratedExercise,
    build_generator_messages,
    build_interactive_generator_messages,
    parse_generated_exercise,
    parse_interactive_exercise,
    public_exercise,
)
from app.services.tutors.policies import resolve_stage
from app.services.tutors.prompts import build_messages

logger = logging.getLogger(__name__)


class ConversationNotFound(Exception):
    """A conversa nao existe ou pertence a outro usuario."""


class TutorModeConflict(Exception):
    """Uma conversa nao troca de modo no meio do caminho."""


class TutorExerciseInvalid(Exception):
    """A geracao nao produziu um exercicio valido depois da nova tentativa."""


def _usage_view(snapshot) -> TutorUsageView:
    return TutorUsageView(used=snapshot.count, limit=snapshot.limit)


def _summary(conversation: dict) -> TutorConversationSummary:
    updated_at = conversation.get("updated_at") or ""
    return TutorConversationSummary(
        conversation_id=conversation["conversation_id"],
        mode=conversation.get("tutor_mode") or conversation["mode"],
        surface=conversation.get("surface") or "page",
        problem_id=conversation.get("problem_id"),
        stage=int(conversation.get("stage") or 1),
        preview=conversation.get("preview") or "",
        title=conversation.get("title") or conversation.get("preview") or "",
        updated_at=updated_at,
        created_at=conversation.get("created_at") or "",
        last_message_at=conversation.get("last_message_at") or updated_at,
        archived=bool(conversation.get("archived")),
        theme=conversation.get("theme"),
        topic=conversation.get("topic"),
        difficulty=conversation.get("difficulty"),
        input_type=conversation.get("input_type"),
        output_type=conversation.get("output_type"),
    )


async def list_user_conversations(
    uid: str,
    *,
    include_archived: bool = False,
    limit: int = 20,
    before: str | None = None,
) -> list[TutorConversationSummary]:
    rows = await history.list_conversations(
        uid,
        include_archived=include_archived,
        limit=limit,
        before=before,
    )
    return [_summary(row) for row in rows]


async def create_user_conversation(uid: str, mode: str, surface: str) -> TutorConversationSummary:
    conversation = await history.create_conversation(
        uid=uid,
        mode=mode,
        surface=surface,
        problem_id=None,
        preview="",
    )
    return _summary(conversation)


async def update_user_conversation(uid: str, conversation_id: str, changes) -> TutorConversationSummary:
    conversation = await history.update_conversation(
        conversation_id,
        uid,
        title=changes.title,
        archived=changes.archived,
    )
    if conversation is None:
        raise ConversationNotFound()
    return _summary(conversation)


async def get_user_conversation(uid: str, conversation_id: str) -> TutorConversationDetail:
    conversation = await history.get_conversation(conversation_id, uid)
    if conversation is None:
        raise ConversationNotFound()
    messages = await history.list_messages(conversation_id)
    detail = _summary(conversation).model_dump()
    visible = public_exercise(conversation.get("generated_exercise"))
    detail["exercise"] = visible.model_dump() if visible else None
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


def tutor_api_key(gemini_key: str | None, use_custom_key: bool) -> str:
    return resolve_gemini_key(gemini_key, use_custom_key)


async def _complete(messages: list[dict], api_key: str, *, temperature: float = 0.4) -> str:
    if not api_key:
        raise TutorAINotConfigured()
    provider = get_tutor_provider()
    model = resolve_tutor_model()
    logger.info("Tutor chamando provider=%s model=%s", provider.name, model)
    return await provider.complete(
        messages,
        temperature=temperature,
        model=model,
        timeout=60.0,
        api_key=api_key,
    )


async def generate_exercise(user: dict, request: TutorExerciseRequest) -> TutorExercise:
    uid = user.get("uid") or ""
    await consume_daily_message(uid)
    logger.info("Tutor gerando exercicio uid=%s topic=%s", uid, request.topic)
    raw = await _complete(
        build_generator_messages(request.topic, request.difficulty),
        tutor_api_key(request.gemini_api_key, request.use_custom_key),
    )
    try:
        return parse_generated_exercise(raw, topic=request.topic, difficulty=request.difficulty)
    except InvalidGeneratedExercise as exc:
        logger.warning("Exercicio gerado pelo tutor foi recusado.")
        raise LLMUnavailable("O tutor nao conseguiu montar um exercicio valido.") from exc


async def _generate_interactive(user: dict, request: TutorChatRequest) -> TutorChatResponse:
    uid = user.get("uid") or ""
    snapshot = await consume_daily_message(uid)
    api_key = tutor_api_key(request.gemini_api_key, request.use_custom_key)
    messages = build_interactive_generator_messages(
        theme=request.theme or "",
        topic=request.topic,
        difficulty=request.difficulty,
        input_type=request.input_type,
        output_type=request.output_type,
    )
    stored = None
    for attempt in range(2):
        raw = await _complete(messages, api_key, temperature=0.7)
        try:
            stored = parse_interactive_exercise(
                raw,
                theme=request.theme or "",
                topic=request.topic,
                difficulty=request.difficulty,
                input_type=request.input_type,
                output_type=request.output_type,
            )
            break
        except InvalidGeneratedExercise:
            logger.warning("Exercicio interativo recusado na tentativa %s.", attempt + 1)
            messages = messages + [
                {"role": "assistant", "content": "JSON anterior invalido."},
                {
                    "role": "user",
                    "content": (
                        "O JSON anterior foi recusado. Envie somente um objeto JSON valido, "
                        "com title, story, statement, input, output, examples, topic e difficulty "
                        "iguais ao pedido. A reference_solution fica fora do enunciado."
                    ),
                },
            ]
    if stored is None:
        raise TutorExerciseInvalid()
    visible = public_exercise(stored)
    title = visible.title if visible else "Exercicio"
    reply = (
        f'O exercicio "{title}" esta fixado acima. '
        "Leia o enunciado e me diga, com suas palavras, o que o programa precisa fazer."
    )
    conversation = await history.create_conversation(
        uid=uid,
        mode=request.mode,
        surface=request.surface,
        problem_id=None,
        preview=title,
        metadata={
            "generated_exercise": stored,
            "theme": request.theme,
            "topic": request.topic,
            "difficulty": request.difficulty,
            "input_type": request.input_type,
            "output_type": request.output_type,
        },
    )
    message_id = await history.append_turn(
        conversation,
        user_message=f"Gerar exercicio sobre {request.theme}.",
        assistant_message=reply,
        stage=1,
        surface=request.surface,
        code=None,
        problem_id=None,
    )
    logger.info("Tutor gerou exercicio interativo uid=%s topic=%s", uid, request.topic)
    return TutorChatResponse(
        conversation_id=conversation["conversation_id"],
        message_id=message_id,
        mode=request.mode,
        stage=1,
        surface=request.surface,
        reply=reply,
        usage=_usage_view(snapshot),
        exercise=visible,
    )


async def chat(user: dict, request: TutorChatRequest) -> TutorChatResponse:
    if request.action == "generate":
        return await _generate_interactive(user, request)
    behavior = behavior_for(request.mode)
    uid = user.get("uid") or ""
    conversation = None
    prior_messages: list[dict] = []
    if request.conversation_id:
        conversation = await history.get_conversation(request.conversation_id, uid)
        if conversation is None:
            if request.mode == "exercise_generator":
                raise ConversationNotFound()
            conversation = None
        elif conversation.get("mode") != request.mode:
            raise TutorModeConflict()
        else:
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
    visible_exercise = None
    if request.mode == "exercise" and request.exercise is not None:
        tutor_ctx["exercicio_fixado"] = request.exercise.model_dump()
    if request.mode == "exercise_generator":
        stored = (conversation or {}).get("generated_exercise") or {}
        visible_exercise = public_exercise(stored)
        if visible_exercise is None:
            raise ConversationNotFound()
        tutor_ctx["exercicio_fixado"] = visible_exercise.model_dump()
        tutor_ctx["solucao_referencia_interna"] = stored.get("reference_solution") or ""
        tutor_ctx["explicacao_interna"] = stored.get("solution_explanation") or ""
    llm_messages = build_messages(
        mode=behavior.system_mode() if request.mode != "exercise" else request.mode,
        stage=stage,
        context=tutor_ctx,
        history=prior_messages,
        user_message=request.message,
        focus_mode=request.focus_mode,
    )
    logger.info(
        "Tutor uid=%s mode=%s comportamento=%s stage=%s surface=%s",
        uid,
        request.mode,
        behavior.mode,
        stage,
        request.surface,
    )
    text = await _complete(
        llm_messages,
        tutor_api_key(request.gemini_api_key, request.use_custom_key),
    )

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
        exercise=visible_exercise,
    )
