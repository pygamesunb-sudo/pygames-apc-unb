import { DIFFICULTY_FILTERS, PROGRESS_FILTERS } from '../readyExercisesModel';

function FilterRow({ label, options, selected, onSelect }) {
  return (
    <div className="ready-filters__row" role="group" aria-label={label}>
      {options.map((item) => (
        <button
          key={`${label}-${item.id || 'all'}`}
          type="button"
          className={`suggestion-filter-btn ${selected === item.id ? 'suggestion-filter-btn--active' : ''}`}
          aria-pressed={selected === item.id}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default function ReadyExerciseFilters({ difficulty, completed, onDifficulty, onCompleted }) {
  return (
    <div className="ready-filters">
      <FilterRow label="Dificuldade" options={DIFFICULTY_FILTERS} selected={difficulty} onSelect={onDifficulty} />
      <FilterRow label="Progresso" options={PROGRESS_FILTERS} selected={completed} onSelect={onCompleted} />
    </div>
  );
}
