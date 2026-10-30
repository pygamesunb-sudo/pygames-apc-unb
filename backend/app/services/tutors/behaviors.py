"""Cada modo escolhe o comportamento. Todos usam o mesmo cliente Gemini."""

from __future__ import annotations

from app.services.tutors.prompts import (
    APC_TUTOR_PROMPT,
    DEBUG_TUTOR_PROMPT,
    EXERCISE_GENERATOR_PROMPT,
    EXERCISE_GENERATOR_TUTOR_PROMPT,
    PRACTICE_TUTOR_PROMPT,
    PYTHON_TUTOR_PROMPT,
)


class TutorBehavior:
    mode = "assistant"
    prompt = ""
    reveals_solution_immediately = False

    def system_mode(self) -> str:
        return self.mode


class APCTutor(TutorBehavior):
    mode = "apc"
    prompt = APC_TUTOR_PROMPT


class PythonTutor(TutorBehavior):
    mode = "python"
    prompt = PYTHON_TUTOR_PROMPT


class DebugTutor(TutorBehavior):
    mode = "debug"
    prompt = DEBUG_TUTOR_PROMPT


class PracticeTutor(TutorBehavior):
    mode = "practice"
    prompt = PRACTICE_TUTOR_PROMPT


class ExerciseGeneratorTutor(TutorBehavior):
    mode = "exercise_generator"
    prompt = EXERCISE_GENERATOR_TUTOR_PROMPT
    generator_prompt = EXERCISE_GENERATOR_PROMPT


_BEHAVIORS = {
    "apc": APCTutor(),
    "python": PythonTutor(),
    "debug": DebugTutor(),
    "practice": PracticeTutor(),
    "exercise": ExerciseGeneratorTutor(),
    "exercise_generator": ExerciseGeneratorTutor(),
}


def behavior_for(mode: str) -> TutorBehavior:
    return _BEHAVIORS.get(mode) or TutorBehavior()
