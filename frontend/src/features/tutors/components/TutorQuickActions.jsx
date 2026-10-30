import { EXERCISE_QUICK_ACTIONS } from '../tutorExerciseModel';

export default function TutorQuickActions({ disabled, onAction }) {
  return (
    <div className="tutor-exercise__quick" role="group" aria-label="Ações rápidas do exercício">
      {EXERCISE_QUICK_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="suggestion-filter-btn"
          onClick={() => onAction(action)}
          disabled={disabled}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
