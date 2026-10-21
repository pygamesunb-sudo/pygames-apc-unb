import { EXERCISE_QUICK_ACTIONS } from '../tutorExerciseModel';

export default function TutorExerciseQuickActions({ onSend, disabled }) {
  return (
    <div className="tutor-exercise__quick" aria-label="Sugestões de mensagem">
      {EXERCISE_QUICK_ACTIONS.map((label) => (
        <button
          key={label}
          type="button"
          className="suggestion-filter-btn"
          onClick={() => onSend(label)}
          disabled={disabled}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
