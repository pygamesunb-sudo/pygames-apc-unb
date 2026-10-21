"""Erros do catalogo de Exercicios Prontos. Nao incluem segredo de fonte."""


class ReadyExercisesUnavailable(Exception):
    code = "ready_exercises_unavailable"


class ReadyExercisesSourceError(Exception):
    code = "ready_exercises_source_error"


class ReadyExerciseNotFound(Exception):
    code = "ready_exercise_not_found"


class ReadyProgressError(Exception):
    code = "ready_exercises_progress_unavailable"
