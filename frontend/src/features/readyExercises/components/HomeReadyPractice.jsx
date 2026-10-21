import { useEffect, useState } from 'react';
import ReadyExerciseCard from './ReadyExerciseCard';
import ReadyExerciseSkeleton from './ReadyExerciseSkeleton';
import { READY_COPY } from '../readyExercisesModel';
import {
  getReadyExerciseRecommendations,
  getReadyExercisesStatus,
  readyExercisesErrorMessage,
} from '../services/readyExercisesApi';
import '../readyExercises.css';

export default function HomeReadyPractice({ onOpen, onSeeAll }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const status = await getReadyExercisesStatus();
        if (!active) return;
        if (!status?.available) {
          setMessage(READY_COPY.unavailable);
          setExercises([]);
          return;
        }
        const items = await getReadyExerciseRecommendations({ limit: 3 });
        if (!active) return;
        setExercises(Array.isArray(items) ? items.slice(0, 3) : []);
      } catch (error) {
        if (!active) return;
        setMessage(readyExercisesErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="ready-home card" aria-labelledby="ready-home-title" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 id="ready-home-title" className="gallery-section-title" style={{ fontSize: '1.4rem', margin: 0, textAlign: 'left', fontWeight: 700 }}>
          Exercícios para praticar
        </h2>
        <button type="button" className="btn-secondary" onClick={onSeeAll}>
          Ver exercícios prontos
        </button>
      </div>
      {loading && <ReadyExerciseSkeleton count={3} />}
      {!loading && message && <p className="ready-status" role="status">{message}</p>}
      {!loading && !message && exercises.length > 0 && (
        <div className="ready-exercises-grid">
          {exercises.map((exercise) => (
            <ReadyExerciseCard key={exercise.id} exercise={exercise} onOpen={onOpen} />
          ))}
        </div>
      )}
      {!loading && !message && exercises.length === 0 && (
        <p className="ready-status">Quando você praticar um assunto, as sugestões aparecem aqui.</p>
      )}
    </section>
  );
}
