import { useEffect, useRef, useState } from 'react';
import BeeCrowdFilters from '../components/BeeCrowdFilters';
import BeeCrowdRecommendations from '../components/BeeCrowdRecommendations';
import BeeCrowdStatus from '../components/BeeCrowdStatus';
import BeeCrowdCard from '../components/BeeCrowdCard';
import {
  beecrowdErrorMessage,
  getBeeCrowdRecommendations,
  getBeeCrowdStatus,
  listBeeCrowdProblems,
} from '../services/beecrowdApi';
import '../beecrowd.css';

const EMPTY_FILTERS = { topic: '', difficulty: '', category: '' };

function compact(filters) {
  const params = {};
  if (filters.topic.trim()) params.topic = filters.topic.trim();
  if (filters.difficulty.trim()) params.difficulty = filters.difficulty.trim();
  if (filters.category.trim()) params.category = filters.category.trim();
  return params;
}

export default function BeeCrowd() {
  const [status, setStatus] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [problems, setProblems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const searched = useRef(false);

  useEffect(() => {
    let active = true;
    getBeeCrowdStatus()
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch((err) => {
        if (active) setError(beecrowdErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const search = async (nextFilters = filters) => {
    setLoading(true);
    setError(null);
    const params = compact(nextFilters);
    try {
      const [found, suggested] = await Promise.all([
        listBeeCrowdProblems(params),
        getBeeCrowdRecommendations(params),
      ]);
      setProblems(found || []);
      setRecommendations(suggested || []);
    } catch (err) {
      const message = beecrowdErrorMessage(err);
      if (message === 'Integração BeeCrowd em preparação.') {
        setStatus({ configured: false, provider: 'beecrowd' });
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!status?.configured || searched.current) return;
    searched.current = true;
    search(EMPTY_FILTERS);
  }, [status]);

  if (loading && !status && !error) {
    return <p className="beecrowd-page">Carregando BeeCrowd...</p>;
  }

  if (error && !status) {
    return <p className="beecrowd-page beecrowd-error" role="alert">{error}</p>;
  }

  if (!status?.configured) {
    return (
      <div className="beecrowd-page">
        <BeeCrowdStatus />
      </div>
    );
  }

  return (
    <div className="beecrowd-page animate-fade-in">
      <header>
        <h2>BeeCrowd</h2>
        <p>Metadados de exercícios autorizados. O enunciado continua no site oficial.</p>
      </header>
      <BeeCrowdFilters
        filters={filters}
        onChange={setFilters}
        onSubmit={() => search(filters)}
        disabled={loading}
      />
      {error && (
        <p className="beecrowd-error" role="alert">{error}</p>
      )}
      <section>
        <h3>Exercícios</h3>
        {problems.length === 0 ? (
          <p>Nenhum exercício encontrado para esses filtros.</p>
        ) : (
          <div className="beecrowd-grid">
            {problems.map((problem) => (
              <BeeCrowdCard key={problem.external_id} problem={problem} />
            ))}
          </div>
        )}
      </section>
      <BeeCrowdRecommendations problems={recommendations} />
    </div>
  );
}
