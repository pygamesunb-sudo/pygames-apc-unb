"""Contador diario de mensagens dos tutores.

O limite e por usuario e por dia UTC. Se o Firestore nao puder ser lido,
a chamada e recusada: melhor falhar fechado do que gastar sem controle.
Em teste local, sem Firestore, o contador fica so na memoria do processo.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from app.config import settings
from app.services import firebase_service
from app.services.ai.models import UsageSnapshot

logger = logging.getLogger(__name__)

COLLECTION = "tutor_usage"
_memory: dict[str, dict] = {}


class DailyLimitExceeded(Exception):
    def __init__(self, used: int, limit: int):
        super().__init__("Limite diario de mensagens do tutor atingido.")
        self.used = used
        self.limit = limit


class UsageStoreError(Exception):
    """Nao foi possivel ler ou gravar o contador."""


def reset_memory() -> None:
    _memory.clear()


def _today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def _memory_allowed() -> bool:
    if settings.testing_bypass_auth:
        return True
    return os.getenv("TESTING_BYPASS_AUTH", "").strip().lower() == "true"


def _snapshot(uid: str, date: str, count: int) -> UsageSnapshot:
    return UsageSnapshot(
        uid=uid,
        date=date,
        count=count,
        limit=settings.tutor_daily_limit,
    )


async def consume_daily_message(uid: str) -> UsageSnapshot:
    """Reserva uma mensagem do dia. Estoura DailyLimitExceeded se o limite acabou."""
    limit = settings.tutor_daily_limit
    today = _today()
    db = firebase_service.get_db()

    if db is None:
        if not _memory_allowed():
            raise UsageStoreError(
                "Contador do tutor indisponivel porque o Firestore nao esta acessivel."
            )
        record = _memory.get(uid)
        if not record or record.get("date") != today:
            record = {"date": today, "count": 0}
        if record["count"] >= limit:
            raise DailyLimitExceeded(record["count"], limit)
        record["count"] += 1
        _memory[uid] = record
        return _snapshot(uid, today, record["count"])

    ref = db.collection(COLLECTION).document(uid)
    try:
        doc = ref.get(timeout=5.0)
        data = doc.to_dict() if doc.exists else None
        count = 0
        if data and data.get("date") == today:
            count = int(data.get("count") or 0)
        if count >= limit:
            raise DailyLimitExceeded(count, limit)
        count += 1
        ref.set({"uid": uid, "date": today, "count": count}, timeout=5.0)
        return _snapshot(uid, today, count)
    except DailyLimitExceeded:
        raise
    except Exception as exc:
        logger.exception("Falha ao atualizar o contador diario do tutor.")
        raise UsageStoreError("Nao foi possivel verificar o limite diario do tutor.") from exc
