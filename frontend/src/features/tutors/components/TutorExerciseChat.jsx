/**
 * peca de tela dos tutores (TutorExerciseChat.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import { useEffect, useId, useRef } from 'react';
import { Send } from 'lucide-react';
import TutorMessage from './TutorMessage';

export default function TutorExerciseChat({
  messages,
  isSending,
  disabled,
  error,
  onDismissError,
  onSend,
  inputRef: inputRefProp,
}) {
  const inputId = useId();
  const localRef = useRef(null);
  const inputRef = inputRefProp || localRef;
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const input = inputRef.current;
    if (!input || disabled || isSending) return;
    const sent = await onSend(input.value);
    if (sent) input.value = '';
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="tutor-exercise__chat">
      <div
        className="tutor-chat__log"
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={isSending}
      >
        {messages.length === 0 && (
          <p className="tutor-chat__status">Gere um exercício para começar a conversa.</p>
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
          <button type="button" onClick={onDismissError} aria-label="Fechar aviso">
            x
          </button>
        </div>
      )}

      <form className="tutor-chat__form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor={inputId}>Mensagem para o tutor</label>
        <textarea
          id={inputId}
          ref={inputRef}
          rows={3}
          maxLength={4000}
          placeholder={disabled ? 'Gere um exercício para conversar' : 'Escreva sua dúvida ou cole seu código Python'}
          disabled={disabled || isSending}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={disabled || isSending}
          aria-label="Enviar mensagem"
        >
          <Send size={16} aria-hidden="true" />
          Enviar
        </button>
      </form>
    </div>
  );
}
