"""Persistencia das conversas do tutor.

Firestore:
  tutor_conversations/{conversationId}
  tutor_conversations/{conversationId}/messages/{messageId}

Sem o arquivo de credencial do Firebase, a conversa fica na memoria deste processo.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone

from app.config import settings
from app.services import firebase_service

logger = logging.getLogger(__name__)

COLLECTION = "tutor_conversations"
_conversations: dict[str, dict] = {}
_messages: dict[str, list[dict]] = {}
_sequence = 0


class ConversationStoreError(Exception):
    """Falha ao ler ou gravar o historico."""


def reset_memory() -> None:
    global _sequence
    _conversations.clear()
    _messages.clear()
    _sequence = 0


def _now() -> str:
    global _sequence
    _sequence += 1
    return f"{datetime.now(timezone.utc).isoformat()}-{_sequence:06d}"


_memory_notice = False


def _memory_allowed() -> bool:
    """Memoria local nos testes e quando esta maquina nao tem credencial do Firestore."""
    global _memory_notice
    if settings.testing_bypass_auth:
        return True
    if os.getenv("TESTING_BYPASS_AUTH", "").strip().lower() == "true":
        return True
    credentials = settings.resolved_credentials_path()
    if credentials and os.path.isfile(credentials):
        return False
    if not _memory_notice:
        _memory_notice = True
        logger.warning(
            "Historico dos tutores em memoria neste processo. "
            "Sem firebase_credentials.json ele nao sobrevive a um reinicio."
        )
    return True


def _preview(text: str) -> str:
    compact = " ".join((text or "").split())
    if len(compact) <= 80:
        return compact
    return compact[:77] + "..."


_TOPIC_LABELS = {
    "entrada_saida": "Entrada e saída",
    "variaveis": "Variáveis",
    "operadores": "Operadores",
    "condicionais": "Condicionais",
    "while": "While",
    "for": "For",
    "strings": "Strings",
    "listas": "Listas",
    "funcoes": "Funções",
    "recursao": "Recursão",
}

_TUTOR_NAMES = {
    "apc": "Tutor APC",
    "python": "Tutor Python",
    "debug": "Debugador",
    "practice": "Treinador de Exercícios",
    "assistant": "Assistente",
    "exercise": "Tutor de Exercícios",
    "exercise_generator": "Tutor de Exercícios",
}


def friendly_title(conversation: dict, fallback: str = "") -> str:
    """Titulo curto. O de exercicio usa tema e conteudo; os outros, o começo da fala."""
    mode = conversation.get("tutor_mode") or conversation.get("mode") or ""
    theme = (conversation.get("theme") or "").strip()
    topic = conversation.get("topic") or ""
    if mode == "exercise_generator" and theme:
        content = _TOPIC_LABELS.get(topic, str(topic or "")).strip()
        if content:
            return f"{theme} — {content}"[:80]
        return theme[:80]
    words = " ".join((fallback or conversation.get("preview") or "").split())
    if words:
        return " ".join(words.split()[:6])[:80]
    return _TUTOR_NAMES.get(mode, "Conversa")


def _owner(data: dict) -> str:
    return str(data.get("uid") or data.get("user_id") or "")


def _belongs(data: dict, uid: str) -> bool:
    return bool(uid) and _owner(data) == uid


def _stamp(data: dict) -> str:
    return data.get("last_message_at") or data.get("updated_at") or data.get("created_at") or ""


async def create_conversation(
    *,
    uid: str,
    mode: str,
    surface: str,
    problem_id: str | None,
    preview: str,
    metadata: dict | None = None,
) -> dict:
    conversation = {
        "conversation_id": str(uuid.uuid4()),
        "uid": uid,
        "mode": mode,
        "surface": surface,
        "problem_id": problem_id,
        "stage": 1,
        "preview": _preview(preview),
        "created_at": _now(),
        "updated_at": _now(),
    }
    for key, value in (metadata or {}).items():
        if key not in {"conversation_id", "uid", "user_id"}:
            conversation[key] = value
    created_at = conversation["created_at"]
    conversation["user_id"] = uid
    conversation["tutor_mode"] = conversation["mode"]
    conversation["archived"] = bool(conversation.get("archived", False))
    conversation["last_message_at"] = conversation.get("last_message_at") or created_at
    conversation["updated_at"] = conversation.get("updated_at") or created_at
    if not conversation.get("title") or not conversation.get("title_custom"):
        conversation["title"] = friendly_title(conversation, preview)
    await _save_conversation(conversation, is_new=True)
    return conversation


async def get_conversation(conversation_id: str, uid: str) -> dict | None:
    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        found = _conversations.get(conversation_id)
        if not found or not _belongs(found, uid):
            return None
        return dict(found)

    try:
        doc = db.collection(COLLECTION).document(conversation_id).get(timeout=5.0)
    except Exception as exc:
        logger.exception("Falha ao ler conversa do tutor.")
        raise ConversationStoreError("Nao foi possivel ler a conversa do tutor.") from exc
    if not doc.exists:
        return None
    data = doc.to_dict() or {}
    if not _belongs(data, uid):
        return None
    data["conversation_id"] = conversation_id
    return data


async def list_conversations(
    uid: str,
    *,
    include_archived: bool = False,
    limit: int = 20,
    before: str | None = None,
) -> list[dict]:
    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        rows = [dict(item) for item in _conversations.values() if _belongs(item, uid)]
    else:
        rows = await _list_from_firestore(db, uid)
    if not include_archived:
        rows = [item for item in rows if not item.get("archived")]
    rows.sort(key=_stamp, reverse=True)
    if before:
        rows = [item for item in rows if _stamp(item) < before]
    return rows[: max(1, min(limit, 50))]


async def _list_from_firestore(db, uid: str) -> list[dict]:
    """Consulta por dono. O indice uid + last_message_at cobre a ordenacao no Firestore."""
    from firebase_admin import firestore

    collection = db.collection(COLLECTION)
    try:
        docs = (
            collection.where("uid", "==", uid)
            .order_by("last_message_at", direction=firestore.Query.DESCENDING)
            .limit(50)
            .get(timeout=5.0)
        )
    except Exception:
        logger.warning("Consulta ordenada do historico falhou. Usando a lista do usuario.", exc_info=True)
        try:
            docs = collection.where("uid", "==", uid).limit(50).get(timeout=5.0)
        except Exception as exc:
            logger.exception("Falha ao listar conversas do tutor.")
            raise ConversationStoreError("Nao foi possivel listar as conversas do tutor.") from exc
    rows = []
    for doc in docs:
        data = doc.to_dict() or {}
        if not _belongs(data, uid):
            continue
        data["conversation_id"] = doc.id
        rows.append(data)
    return rows


async def list_messages(conversation_id: str) -> list[dict]:
    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        return [dict(item) for item in _messages.get(conversation_id, [])]

    try:
        docs = (
            db.collection(COLLECTION)
            .document(conversation_id)
            .collection("messages")
            .get(timeout=5.0)
        )
    except Exception as exc:
        logger.exception("Falha ao ler mensagens do tutor.")
        raise ConversationStoreError("Nao foi possivel ler as mensagens do tutor.") from exc
    rows = []
    for doc in docs:
        data = doc.to_dict() or {}
        data["message_id"] = doc.id
        rows.append(data)
    rows.sort(key=lambda item: item.get("created_at") or "")
    return rows


async def append_turn(
    conversation: dict,
    *,
    user_message: str,
    assistant_message: str,
    stage: int,
    surface: str,
    code: str | None,
    problem_id: str | None,
) -> str:
    created_at = _now()
    user_id = str(uuid.uuid4())
    assistant_id = str(uuid.uuid4())
    user_doc = {
        "message_id": user_id,
        "role": "user",
        "content": user_message,
        "created_at": created_at,
        "stage": None,
        "code": code,
        "surface": surface,
        "problem_id": problem_id,
    }
    assistant_doc = {
        "message_id": assistant_id,
        "role": "assistant",
        "content": assistant_message,
        "created_at": _now(),
        "stage": stage,
        "code": None,
        "surface": surface,
        "problem_id": problem_id,
    }
    conversation["stage"] = stage
    conversation["surface"] = surface
    if problem_id and not conversation.get("problem_id"):
        conversation["problem_id"] = problem_id
    if not conversation.get("preview"):
        conversation["preview"] = _preview(user_message)
    conversation["updated_at"] = assistant_doc["created_at"]
    conversation["last_message_at"] = assistant_doc["created_at"]
    conversation["user_id"] = conversation.get("uid") or conversation.get("user_id")
    conversation["tutor_mode"] = conversation.get("mode")
    if not conversation.get("title_custom"):
        conversation["title"] = friendly_title(conversation, user_message)

    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        _messages.setdefault(conversation["conversation_id"], []).extend([user_doc, assistant_doc])
        _conversations[conversation["conversation_id"]] = dict(conversation)
        return assistant_id

    try:
        conv_ref = db.collection(COLLECTION).document(conversation["conversation_id"])
        conv_ref.collection("messages").document(user_id).set(user_doc, timeout=5.0)
        conv_ref.collection("messages").document(assistant_id).set(assistant_doc, timeout=5.0)
        conv_ref.set(conversation, timeout=5.0)
    except Exception as exc:
        logger.exception("Falha ao gravar mensagens do tutor.")
        raise ConversationStoreError("Nao foi possivel gravar a conversa do tutor.") from exc
    return assistant_id


async def _save_conversation(conversation: dict, *, is_new: bool) -> None:
    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        _conversations[conversation["conversation_id"]] = dict(conversation)
        _messages.setdefault(conversation["conversation_id"], [])
        return
    try:
        db.collection(COLLECTION).document(conversation["conversation_id"]).set(conversation, timeout=5.0)
    except Exception as exc:
        logger.exception("Falha ao criar conversa do tutor.")
        raise ConversationStoreError("Nao foi possivel criar a conversa do tutor.") from exc
    if is_new:
        return


async def update_conversation(
    conversation_id: str,
    uid: str,
    *,
    title: str | None = None,
    archived: bool | None = None,
) -> dict | None:
    conversation = await get_conversation(conversation_id, uid)
    if conversation is None:
        return None
    if title is not None:
        conversation["title"] = " ".join(title.split())[:80]
        conversation["title_custom"] = True
    if archived is not None:
        conversation["archived"] = bool(archived)
    conversation["updated_at"] = _now()
    conversation["user_id"] = uid
    conversation["tutor_mode"] = conversation.get("mode")
    await _save_conversation(conversation, is_new=False)
    if firebase_service.get_db() is None:
        _conversations[conversation_id] = dict(conversation)
    return conversation
