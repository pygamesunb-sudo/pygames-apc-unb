export default function ReadyExerciseSkeleton({ count = 6 }) {
  return (
    <div className="ready-exercises-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="card ready-card" key={index}>
          <div className="skeleton" style={{ height: 18, width: '72%' }} />
          <div className="skeleton" style={{ height: 14, width: '46%' }} />
          <div className="skeleton" style={{ height: 14, width: '58%' }} />
          <div className="skeleton" style={{ height: 42, width: '100%' }} />
        </div>
      ))}
    </div>
  );
}
