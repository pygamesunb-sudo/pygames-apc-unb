import { Code2 } from 'lucide-react';
import { cardContent } from '../readyExercisesModel';

export default function ReadyExerciseCard({ exercise, onOpen }) {
  const content = cardContent(exercise);
  return (
    <article className="card ready-card">
      <h2>
        <Code2 size={16} aria-hidden="true" style={{ marginRight: 8, verticalAlign: '-2px', color: '#a78bfa' }} />
        {content.title}
      </h2>
      <div className="ready-card__meta">
        <span className="badge">{content.topic}</span>
        <span className={`badge badge--${exercise.difficulty === 'challenge' ? 'dificil' : exercise.difficulty === 'intermediate' ? 'medio' : 'facil'}`}>
          {content.difficulty}
        </span>
        {content.status && (
          <span className="badge">
            {exercise.completed ? '✓ ' : ''}
            {content.status}
          </span>
        )}
      </div>
      <p className="ready-card__source">{content.source}</p>
      <button
        type="button"
        className="btn-primary"
        onClick={() => onOpen(exercise)}
        aria-label={`${content.action}: ${content.title}`}
      >
        {content.action}
      </button>
    </article>
  );
}
