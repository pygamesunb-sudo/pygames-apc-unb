export default function TutorCard({ tutor, onSelect }) {
  const Icon = tutor.icon;
  return (
    <button
      type="button"
      className="tutor-card card"
      onClick={() => onSelect(tutor)}
      aria-label={`Abrir ${tutor.title}`}
    >
      <span className="tutor-card__icon" style={{ color: tutor.color }} aria-hidden="true">
        <Icon size={22} />
      </span>
      <span className="tutor-card__title">{tutor.title}</span>
      <span className="tutor-card__description">{tutor.description}</span>
    </button>
  );
}
