import { useId } from 'react';
import TutorHeader from './TutorHeader';
import TutorExercisePinnedCard from './TutorExercisePinnedCard';
import TutorExerciseQuickActions from './TutorExerciseQuickActions';
import TutorExerciseChat from './TutorExerciseChat';
import { useExerciseTutor } from '../hooks/useExerciseTutor';
import { EXERCISE_DIFFICULTIES, EXERCISE_TOPICS } from '../tutorExerciseModel';

export default function TutorExerciseGenerator({ title, description, onBack }) {
  const titleId = useId();
  const topicId = useId();
  const {
    currentExercise,
    messages,
    selectedTopic,
    difficulty,
    isGenerating,
    isSending,
    error,
    setSelectedTopic,
    setDifficulty,
    generateExercise,
    sendMessage,
    dismissError,
  } = useExerciseTutor();
  const busy = isGenerating || isSending;

  return (
    <section className="tutor-chat tutor-exercise" aria-labelledby={titleId}>
      <TutorHeader
        title={title}
        titleId={titleId}
        description={description}
        onBack={onBack}
      />

      <div className="card tutor-exercise__setup">
        <label htmlFor={topicId}>Tema</label>
        <select
          id={topicId}
          className="tutor-exercise__select"
          value={selectedTopic}
          onChange={(event) => setSelectedTopic(event.target.value)}
          disabled={busy}
        >
          {EXERCISE_TOPICS.map((topic) => (
            <option key={topic.id} value={topic.id}>{topic.label}</option>
          ))}
        </select>

        <p className="tutor-exercise__label" id="tutor-exercise-difficulty">Dificuldade</p>
        <div className="tutor-exercise__difficulties" role="group" aria-labelledby="tutor-exercise-difficulty">
          {EXERCISE_DIFFICULTIES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`suggestion-filter-btn ${difficulty === item.id ? 'suggestion-filter-btn--active' : ''}`}
              aria-pressed={difficulty === item.id}
              onClick={() => setDifficulty(item.id)}
              disabled={busy}
            >
              {item.label}
            </button>
          ))}
        </div>

        {!currentExercise && (
          <button
            type="button"
            className="btn-primary"
            onClick={generateExercise}
            disabled={busy || !selectedTopic}
          >
            {isGenerating ? 'Gerando exercício...' : 'Gerar exercício'}
          </button>
        )}
      </div>

      <TutorExercisePinnedCard
        exercise={currentExercise}
        onGenerate={generateExercise}
        generating={isGenerating}
      />

      {currentExercise && (
        <TutorExerciseQuickActions onSend={sendMessage} disabled={busy} />
      )}

      <TutorExerciseChat
        messages={messages}
        isSending={isSending}
        disabled={!currentExercise || isGenerating}
        error={error}
        onDismissError={dismissError}
        onSend={sendMessage}
      />
    </section>
  );
}
