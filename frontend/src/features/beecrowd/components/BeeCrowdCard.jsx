function officialUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export default function BeeCrowdCard({ problem }) {
  const href = officialUrl(problem.external_url);
  return (
    <article className="beecrowd-card">
      <h3>{problem.title}</h3>
      <p className="beecrowd-card__meta">
        <span>{problem.category || 'Sem categoria'}</span>
        <span>{problem.difficulty || 'Dificuldade não informada'}</span>
      </p>
      {problem.topics?.length > 0 && (
        <ul className="beecrowd-card__topics">
          {problem.topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      )}
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer">
          Abrir no BeeCrowd
        </a>
      ) : (
        <span>Link oficial indisponível</span>
      )}
    </article>
  );
}
