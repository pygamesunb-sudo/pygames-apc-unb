/**
 * peca de tela dos tutores (TutorExerciseGenerator.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import { useId, useRef } from 'react';
import TutorHeader from './TutorHeader';
import ExerciseGeneratorForm from './ExerciseGeneratorForm';
import GeneratedExerciseCard from './GeneratedExerciseCard';
import TutorQuickActions from './TutorQuickActions';
import ExerciseTutorChat from './ExerciseTutorChat';
import { useExerciseTutor } from '../hooks/useExerciseTutor';
import { extractPythonCode } from '../tutorExerciseModel';

export default function TutorExerciseGenerator({
  title,
  description,
  onBack,
  initialConversationId = null,
  onConversationChange,
}) {
  const titleId = useId();
  const chatRef = useRef(null);
  const tutor = useExerciseTutor({ initialConversationId, onConversationChange });
  const busy = tutor.isGenerating || tutor.isSending;

  const handleAction = async (action) => {
    if (action.id === 'another') {
      await tutor.generateExercise();
      return;
    }
    if (action.id === 'check') {
      const draft = chatRef.current?.readDraft() || '';
      const code = extractPythonCode(draft);
      const message = code
        ? `Verifique minha solução.\n\`\`\`python\n${code}\n\`\`\``
        : 'Verifique minha solução. Vou colar o código na próxima mensagem se ainda não estiver aqui.';
      const sent = await tutor.sendMessage(draft.trim() ? `${message}\n${draft}` : message);
      if (sent) chatRef.current?.replaceDraft('');
      return;
    }
    if (action.message) await tutor.sendMessage(action.message);
  };

  return (
    <section className="tutor-chat tutor-exercise" aria-labelledby={titleId}>
      <TutorHeader
        title={title}
        titleId={titleId}
        description={description}
        onBack={onBack}
      />
      <ExerciseGeneratorForm
        theme={tutor.theme}
        topic={tutor.topic}
        difficulty={tutor.difficulty}
        inputType={tutor.inputType}
        outputType={tutor.outputType}
        busy={busy}
        onTheme={tutor.setTheme}
        onTopic={tutor.setTopic}
        onDifficulty={tutor.setDifficulty}
        onInputType={tutor.setInputType}
        onOutputType={tutor.setOutputType}
        onGenerate={tutor.generateExercise}
      />
      <GeneratedExerciseCard exercise={tutor.currentExercise} />
      {tutor.currentExercise && (
        <TutorQuickActions disabled={busy} onAction={handleAction} />
      )}
      <ExerciseTutorChat
        ref={chatRef}
        messages={tutor.messages}
        isSending={tutor.isSending}
        disabled={!tutor.currentExercise || tutor.isGenerating}
        error={tutor.error}
        onDismissError={tutor.dismissError}
        onSend={tutor.sendMessage}
      />
    </section>
  );
}
