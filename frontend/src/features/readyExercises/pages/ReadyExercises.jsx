import ReadyExerciseFilters from '../components/ReadyExerciseFilters';
import ReadyExerciseRecommendations from '../components/ReadyExerciseRecommendations';
import ReadyExerciseCard from '../components/ReadyExerciseCard';
import ReadyExerciseSkeleton from '../components/ReadyExerciseSkeleton';
import ReadyExerciseStatus from '../components/ReadyExerciseStatus';
import ReadyExerciseTopics from '../components/ReadyExerciseTopics';
import { useReadyExercises } from '../hooks/useReadyExercises';
import { pageState } from '../readyExercisesModel';
import '../readyExercises.css';

export default function ReadyExercises({ onOpen }) {
  const catalog = useReadyExercises();
  const state = pageState({
    loading: catalog.loading,
    unavailable: catalog.unavailable,
    error: catalog.error,
    count: catalog.exercises.length,
  });
  const lastPage = Math.max(1, Math.ceil(catalog.total / catalog.limit));

  return (
    <section className="ready-exercises animate-fade-in" aria-labelledby="ready-exercises-title">
      <header className="ready-exercises__intro">
        <h1 id="ready-exercises-title" style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          📚 Exercícios Prontos
        </h1>
        <p>Pratique programação com exercícios selecionados por conteúdo e dificuldade.</p>
        <p>Escolha um assunto e bora praticar 🚀</p>
      </header>

      <ReadyExerciseStatus status={catalog.status} />

      {state.kind === 'unavailable' && (
        <div className="card" role="status">
          <p style={{ margin: 0 }}>{state.message}</p>
        </div>
      )}

      {state.kind !== 'unavailable' && (
        <>
          <ReadyExerciseTopics
            topics={catalog.topics}
            selected={catalog.topic}
            onSelect={catalog.selectTopic}
          />
          <ReadyExerciseFilters
            difficulty={catalog.difficulty}
            completed={catalog.completed}
            onDifficulty={catalog.selectDifficulty}
            onCompleted={catalog.selectCompleted}
          />

          {state.kind === 'loading' && (
            <>
              <p className="sr-only" role="status">Carregando exercícios</p>
              <ReadyExerciseSkeleton />
            </>
          )}

          {state.kind === 'error' && (
            <div className="card" role="alert">
              <p style={{ marginTop: 0 }}>{state.message}</p>
              <button type="button" className="btn-secondary" onClick={catalog.reload}>
                Tentar de novo
              </button>
            </div>
          )}

          {state.kind === 'empty' && (
            <div className="card" role="status">
              <p style={{ margin: 0 }}>{state.message}</p>
            </div>
          )}

          {state.kind === 'ready' && (
            <>
              <ReadyExerciseRecommendations exercises={catalog.recommendations} onOpen={onOpen} />
              <div className="ready-exercises-grid">
                {catalog.exercises.map((exercise) => (
                  <ReadyExerciseCard key={exercise.id} exercise={exercise} onOpen={onOpen} />
                ))}
              </div>
              {catalog.total > catalog.limit && (
                <div className="ready-pagination">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => catalog.setPage((current) => Math.max(1, current - 1))}
                    disabled={catalog.page <= 1}
                  >
                    Anterior
                  </button>
                  <span className="ready-status">Página {catalog.page} de {lastPage}</span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => catalog.setPage((current) => current + 1)}
                    disabled={catalog.page >= lastPage}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
