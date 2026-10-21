"""Persistencia das conversas do tutor.

Firestore:
  tutor_conversations/{conversationId}
  tutor_conversations/{conversationId}/messages/{messageId}

Sem Firestore, a memoria local so e usada quando o bypass de teste esta ligado.
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


def _memory_allowed() -> bool:
    if settings.testing_bypass_auth:
        return True
    return os.getenv("TESTING_BYPASS_AUTH", "").strip().lower() == "true"


def _preview(text: str) -> str:
    compact = " ".join((text or "").split())
    if len(compact) <= 80:
        return compact
    return compact[:77] + "..."


async def create_conversation(
    *,
    uid: str,
    mode: str,
    surface: str,
    problem_id: str | None,
    preview: str,
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
    await _save_conversation(conversation, is_new=True)
    return conversation


async def get_conversation(conversation_id: str, uid: str) -> dict | None:
    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        found = _conversations.get(conversation_id)
        if not found or found.get("uid") != uid:
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
    if data.get("uid") != uid:
        return None
    data["conversation_id"] = conversation_id
    return data


async def list_conversations(uid: str) -> list[dict]:
    db = firebase_service.get_db()
    if db is None:
        if not _memory_allowed():
            raise ConversationStoreError("Historico do tutor indisponivel.")
        rows = [dict(item) for item in _conversations.values() if item.get("uid") == uid]
    else:
        try:
            docs = db.collection(COLLECTION).where("uid", "==", uid).get(timeout=5.0)
        except Exception as exc:
            logger.exception("Falha ao listar conversas do tutor.")
            raise ConversationStoreError("Nao foi possivel listar as conversas do tutor.") from exc
        rows = []
        for doc in docs:
            data = doc.to_dict() or {}
            data["conversation_id"] = doc.id
            rows.append(data)
    rows.sort(key=lambda item: item.get("updated_at") or "", reverse=True)
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
