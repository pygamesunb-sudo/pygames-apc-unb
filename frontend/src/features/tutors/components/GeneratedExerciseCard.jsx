/**
 * peca de tela dos tutores (GeneratedExerciseCard.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
export default function GeneratedExerciseCard({ exercise }) {
  if (!exercise) return null;
  const example = exercise.examples?.[0];
  return (
    <article className="card tutor-exercise__pinned" aria-live="polite">
      <p className="tutor-exercise__kicker">Exercício atual</p>
      <h3>{exercise.title}</h3>
      <p className="tutor-exercise__meta">
        <span>{exercise.topic}</span>
        <span>{exercise.difficulty}</span>
      </p>
      <details className="tutor-exercise__details">
        <summary>Ver enunciado completo</summary>
        <p>{exercise.story}</p>
        <p>{exercise.statement}</p>
        <p><strong>Entrada:</strong> {exercise.input?.description}</p>
        <p><strong>Saída:</strong> {exercise.output?.description}</p>
        {example && (
          <div className="tutor-exercise__example">
            <span>Exemplo</span>
            <pre>{`Entrada:\n${example.input}\n\nSaída:\n${example.output}`}</pre>
          </div>
        )}
        {exercise.hints?.length > 0 && (
          <p className="tutor-exercise__concepts">Dicas guardadas para o tutor usar aos poucos.</p>
        )}
      </details>
    </article>
  );
}
