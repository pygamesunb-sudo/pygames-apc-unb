"""Recomendacao deterministica. Nao usa modelo de IA."""

from __future__ import annotations

from collections import Counter

from app.models.ready_exercises import ReadyExercise


def _status(progress: dict, exercise_id: str) -> str | None:
    row = progress.get(exercise_id) or {}
    status = row.get("status")
    if status in {"started", "completed"}:
        return status
    return None


def _choose_topic(exercises: list[ReadyExercise], progress: dict, topic: str | None) -> str | None:
    if topic and topic not in {"", "todos"}:
        return topic
    practiced = []
    by_id = {item.id: item for item in exercises}
    for exercise_id in progress:
        exercise = by_id.get(exercise_id)
        if exercise and _status(progress, exercise_id):
            practiced.append(exercise.topic)
    if not practiced:
        return None
    return Counter(practiced).most_common(1)[0][0]


def _target_level(exercises: list[ReadyExercise], progress: dict, topic: str | None) -> int:
    done_levels = [
        item.level
        for item in exercises
        if _status(progress, item.id) == "completed" and (topic is None or item.topic == topic)
    ]
    if not done_levels:
        return 1
    highest = max(done_levels)
    still_open = any(
        item.level == highest
        and _status(progress, item.id) != "completed"
        and (topic is None or item.topic == topic)
        for item in exercises
    )
    if still_open:
        return highest
    return min(3, highest + 1)


def _pool(
    exercises: list[ReadyExercise],
    progress: dict,
    *,
    topic: str | None,
    difficulty: str | None,
) -> list[ReadyExercise]:
    selected = [item for item in exercises if _status(progress, item.id) != "completed"]
    if difficulty:
        selected = [item for item in selected if item.difficulty == difficulty]
    if topic:
        selected = [item for item in selected if item.topic == topic]
    return selected


def recommend(
    exercises: list[ReadyExercise],
    progress: dict | None,
    *,
    topic: str | None = None,
    difficulty: str | None = None,
    limit: int = 6,
) -> list[ReadyExercise]:
    progress = progress or {}
    chosen = _choose_topic(exercises, progress, topic)
    pool = _pool(exercises, progress, topic=chosen, difficulty=difficulty)
    if chosen and not pool:
        chosen = None
        pool = _pool(exercises, progress, topic=None, difficulty=difficulty)
    target = _target_level(exercises, progress, chosen)
    pool.sort(key=lambda item: (abs(item.level - target), item.level, item.external_id))
    size = max(0, min(limit, 12))
    return [item.model_copy(update={"recommended": True}) for item in pool[:size]]
