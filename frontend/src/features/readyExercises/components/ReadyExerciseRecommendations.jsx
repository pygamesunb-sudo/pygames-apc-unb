import ReadyExerciseCard from './ReadyExerciseCard';

export default function ReadyExerciseRecommendations({ exercises, onOpen }) {
  if (!exercises?.length) return null;
  return (
    <section aria-labelledby="ready-recommendations-title">
      <h2 id="ready-recommendations-title" style={{ fontSize: '1.15rem', marginBottom: 12 }}>
        Para você
      </h2>
      <div className="ready-exercises-grid">
        {exercises.map((exercise) => (
          <ReadyExerciseCard key={exercise.id} exercise={exercise} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
