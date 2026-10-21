import { useEffect, useId, useRef } from 'react';
import { Send } from 'lucide-react';
import { useTutorChat } from '../hooks/useTutorChat';
import TutorHeader from './TutorHeader';
import TutorMessage from './TutorMessage';

export default function TutorChat({
  mode,
  surface,
  title,
  description,
  problemId = null,
  code = null,
  onBack,
  onClose,
  active = true,
  contextNote = null,
}) {
  const inputId = useId();
  const titleId = useId();
  const inputRef = useRef(null);
  const logRef = useRef(null);
  const {
    messages,
    isSending,
    isLoadingHistory,
    error,
    sendMessage,
    startNewConversation,
    dismissError,
  } = useTutorChat({ mode, surface, problemId, code });

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active, mode]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const input = inputRef.current;
    if (!input || isSending || isLoadingHistory) return;
    const sent = await sendMessage(input.value);
    if (sent) input.value = '';
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <section className="tutor-chat" aria-labelledby={titleId}>
      <TutorHeader
        title={title}
        titleId={titleId}
        description={description}
        onBack={onBack}
        onClose={onClose}
        onNewConversation={startNewConversation}
        newConversationDisabled={isSending}
      />

      {contextNote && <p className="tutor-chat__context">{contextNote}</p>}

      <div
        className="tutor-chat__log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isSending || isLoadingHistory}
      >
        {isLoadingHistory && messages.length === 0 && (
          <p className="tutor-chat__status">Carregando conversa...</p>
        )}
        {!isLoadingHistory && messages.length === 0 && (
          <p className="tutor-chat__status">Escreva sua dúvida para começar.</p>
        )}
        {messages.map((message) => (
          <TutorMessage key={message.message_id} message={message} />
        ))}
        {isSending && (
          <p className="tutor-chat__status tutor-chat__status--thinking">Tutor está pensando...</p>
        )}
      </div>

      {error && (
        <div className="tutor-chat__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={dismissError} aria-label="Fechar aviso">
            x
          </button>
        </div>
      )}

      <form className="tutor-chat__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={inputId}>Mensagem para o tutor</label>
        <textarea
          id={inputId}
          ref={inputRef}
          rows={2}
          maxLength={4000}
          placeholder="Escreva sua dúvida"
          disabled={isSending || isLoadingHistory}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isSending || isLoadingHistory}
          aria-label="Enviar mensagem"
        >
          <Send size={16} aria-hidden="true" />
          Enviar
        </button>
      </form>
    </section>
  );
}
