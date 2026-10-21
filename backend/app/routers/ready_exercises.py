"""Rotas de Exercicios Prontos. A fonte externa nao aparece no contrato."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.models.ready_exercises import (
    ReadyExercise,
    ReadyExerciseList,
    ReadyExercisesStatus,
    ReadyProgressUpdate,
    ReadyTopic,
)
from app.services.ready_exercises.service import (
    DIFFICULTIES,
    TOPIC_IDS,
    ReadyExerciseNotFound,
    ReadyExercisesSourceError,
    ReadyExercisesUnavailable,
    ReadyProgressError,
    get_ready_exercises_service,
)

router = APIRouter(prefix="/api/ready-exercises", tags=["ready-exercises"])


def _unavailable() -> HTTPException:
    return HTTPException(status_code=503, detail=ReadyExercisesUnavailable.code)


def _source_error() -> HTTPException:
    return HTTPException(status_code=502, detail=ReadyExercisesSourceError.code)


def _validate_filters(topic: str | None, difficulty: str | None, source: str | None) -> None:
    if topic and topic not in TOPIC_IDS:
        raise HTTPException(status_code=422, detail="ready_exercises_invalid_filter")
    if difficulty and difficulty not in DIFFICULTIES:
        raise HTTPException(status_code=422, detail="ready_exercises_invalid_filter")
    if source and source not in {"pygames", "beecrowd"}:
        raise HTTPException(status_code=422, detail="ready_exercises_invalid_filter")


@router.get("/status", response_model=ReadyExercisesStatus)
async def ready_status(user: dict = Depends(get_current_user)):
    del user
    return get_ready_exercises_service().status()


@router.get("/topics", response_model=list[ReadyTopic])
async def ready_topics(user: dict = Depends(get_current_user)):
    del user
    return get_ready_exercises_service().topics()


@router.get("/recommendations", response_model=list[ReadyExercise])
async def ready_recommendations(
    topic: str | None = None,
    difficulty: str | None = None,
    limit: int = Query(6, ge=1, le=12),
    user: dict = Depends(get_current_user),
):
    _validate_filters(topic, difficulty, None)
    try:
        return await get_ready_exercises_service().recommendations(
            uid=user["uid"],
            topic=topic,
            difficulty=difficulty,
            limit=limit,
        )
    except ReadyExercisesUnavailable:
        raise _unavailable()
    except ReadyExercisesSourceError:
        raise _source_error()


@router.get("", response_model=ReadyExerciseList)
async def list_ready_exercises(
    topic: str | None = None,
    difficulty: str | None = None,
    source: str | None = None,
    page: int = Query(1, ge=1, le=500),
    limit: int = Query(20, ge=1, le=50),
    completed: bool | None = None,
    user: dict = Depends(get_current_user),
):
    _validate_filters(topic, difficulty, source)
    try:
        return await get_ready_exercises_service().list_exercises(
            uid=user["uid"],
            topic=topic,
            difficulty=difficulty,
            source=source,
            page=page,
            limit=limit,
            completed=completed,
        )
    except ReadyExercisesUnavailable:
        raise _unavailable()
    except ReadyExercisesSourceError:
        raise _source_error()


@router.get("/{exercise_id}", response_model=ReadyExercise)
async def get_ready_exercise(exercise_id: str, user: dict = Depends(get_current_user)):
    try:
        return await get_ready_exercises_service().get_exercise(exercise_id, user["uid"])
    except ReadyExerciseNotFound:
        raise HTTPException(status_code=404, detail=ReadyExerciseNotFound.code)
    except ReadyExercisesUnavailable:
        raise _unavailable()
    except ReadyExercisesSourceError:
        raise _source_error()


@router.post("/{exercise_id}/progress", response_model=ReadyExercise)
async def mark_ready_progress(
    exercise_id: str,
    payload: ReadyProgressUpdate,
    user: dict = Depends(get_current_user),
):
    try:
        return await get_ready_exercises_service().mark_progress(
            exercise_id,
            user["uid"],
            payload.status,
        )
    except ReadyExerciseNotFound:
        raise HTTPException(status_code=404, detail=ReadyExerciseNotFound.code)
    except ReadyExercisesUnavailable:
        raise _unavailable()
    except ReadyExercisesSourceError:
        raise _source_error()
    except ReadyProgressError:
        raise HTTPException(status_code=503, detail=ReadyProgressError.code)
