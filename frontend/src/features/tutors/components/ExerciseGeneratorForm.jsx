import { useId } from 'react';
import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_TOPICS,
  INPUT_TYPES,
  OUTPUT_TYPES,
  THEME_SUGGESTIONS,
} from '../tutorExerciseModel';

export default function ExerciseGeneratorForm({
  theme,
  topic,
  difficulty,
  inputType,
  outputType,
  busy,
  onTheme,
  onTopic,
  onDifficulty,
  onInputType,
  onOutputType,
  onGenerate,
}) {
  const themeId = useId();
  const topicId = useId();
  const inputId = useId();
  const outputId = useId();
  const canGenerate = theme.trim() && topic && difficulty && inputType && outputType && !busy;

  return (
    <form
      className="card tutor-exercise__setup"
      onSubmit={(event) => {
        event.preventDefault();
        if (canGenerate) onGenerate();
      }}
    >
      <label htmlFor={themeId}>Tema</label>
      <input
        id={themeId}
        className="tutor-exercise__select"
        value={theme}
        maxLength={80}
        placeholder="Digite um tema, como parque de diversões"
        onChange={(event) => onTheme(event.target.value)}
        disabled={busy}
      />
      <div className="tutor-exercise__quick" role="group" aria-label="Sugestões de tema">
        {THEME_SUGGESTIONS.map((item) => (
          <button
            key={item}
            type="button"
            className={`suggestion-filter-btn ${theme === item ? 'suggestion-filter-btn--active' : ''}`}
            onClick={() => onTheme(item)}
            disabled={busy}
          >
            {item}
          </button>
        ))}
      </div>

      <label htmlFor={topicId}>Conteúdo de APC</label>
      <select
        id={topicId}
        className="tutor-exercise__select"
        value={topic}
        onChange={(event) => onTopic(event.target.value)}
        disabled={busy}
      >
        {EXERCISE_TOPICS.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>

      <p className="tutor-exercise__label" id="tutor-exercise-difficulty">Dificuldade</p>
      <div className="tutor-exercise__difficulties" role="group" aria-labelledby="tutor-exercise-difficulty">
        {EXERCISE_DIFFICULTIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`suggestion-filter-btn ${difficulty === item.id ? 'suggestion-filter-btn--active' : ''}`}
            aria-pressed={difficulty === item.id}
            onClick={() => onDifficulty(item.id)}
            disabled={busy}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label htmlFor={inputId}>Tipo de entrada</label>
      <select
        id={inputId}
        className="tutor-exercise__select"
        value={inputType}
        onChange={(event) => onInputType(event.target.value)}
        disabled={busy}
      >
        {INPUT_TYPES.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>

      <label htmlFor={outputId}>Tipo de saída</label>
      <select
        id={outputId}
        className="tutor-exercise__select"
        value={outputType}
        onChange={(event) => onOutputType(event.target.value)}
        disabled={busy}
      >
        {OUTPUT_TYPES.map((item) => (
          <option key={item.id} value={item.id}>{item.label}</option>
        ))}
      </select>

      <button type="submit" className="btn-primary" disabled={!canGenerate}>
        {busy ? 'Gerando exercício...' : 'Gerar exercício'}
      </button>
    </form>
  );
}
