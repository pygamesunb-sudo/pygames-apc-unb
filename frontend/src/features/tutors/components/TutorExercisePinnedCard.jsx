/**
 * peca de tela dos tutores (TutorExercisePinnedCard.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
export default function TutorExercisePinnedCard({ exercise, onGenerate, generating }) {
  if (!exercise) return null;
  return (
    <article className="card tutor-exercise__pinned" aria-live="polite">
      <p className="tutor-exercise__kicker">Exercício atual</p>
      <h3>{exercise.titulo}</h3>
      <p className="tutor-exercise__meta">
        <span>Tema: {exercise.tema}</span>
        <span>Dificuldade: {exercise.dificuldade}</span>
      </p>
      <p><strong>Enunciado:</strong> {exercise.enunciado}</p>
      <p><strong>Entrada:</strong> {exercise.entrada}</p>
      <p><strong>Saída:</strong> {exercise.saida}</p>
      <div className="tutor-exercise__example">
        <span>Exemplo de entrada</span>
        <pre>{exercise.exemploEntrada}</pre>
      </div>
      <div className="tutor-exercise__example">
        <span>Exemplo de saída</span>
        <pre>{exercise.exemploSaida}</pre>
      </div>
      {exercise.conceitos?.length > 0 && (
        <p className="tutor-exercise__concepts">
          Conceitos: {exercise.conceitos.join(', ')}
        </p>
      )}
      <button
        type="button"
        className="btn-secondary"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? 'Gerando exercício...' : 'Gerar novo exercício'}
      </button>
    </article>
  );
}
