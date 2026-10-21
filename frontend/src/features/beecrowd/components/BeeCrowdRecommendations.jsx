import BeeCrowdCard from './BeeCrowdCard';

export default function BeeCrowdRecommendations({ problems }) {
  return (
    <section className="beecrowd-recommendations">
      <h3>Recomendações</h3>
      {problems.length === 0 ? (
        <p>Nenhuma recomendação para esses filtros.</p>
      ) : (
        <div className="beecrowd-grid">
          {problems.map((problem) => (
            <BeeCrowdCard key={problem.external_id} problem={problem} />
          ))}
        </div>
      )}
    </section>
  );
}
