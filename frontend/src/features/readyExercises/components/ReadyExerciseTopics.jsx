export default function ReadyExerciseTopics({ topics, selected, onSelect }) {
  return (
    <div className="ready-filters__row" role="group" aria-label="Assunto">
      {topics.map((item) => (
        <button
          key={item.id}
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
