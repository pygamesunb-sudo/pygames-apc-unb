export default function BeeCrowdFilters({ filters, onChange, onSubmit, disabled }) {
  const update = (field) => (event) => onChange({ ...filters, [field]: event.target.value });

  return (
    <form
      className="beecrowd-filters"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label>
        Tópico
        <input value={filters.topic} onChange={update('topic')} placeholder="while" />
      </label>
      <label>
        Dificuldade
        <input value={filters.difficulty} onChange={update('difficulty')} placeholder="easy" />
      </label>
      <label>
        Categoria
        <input value={filters.category} onChange={update('category')} placeholder="Iniciante" />
      </label>
      <button type="submit" className="btn-primary" disabled={disabled}>
        Buscar
      </button>
    </form>
  );
}
