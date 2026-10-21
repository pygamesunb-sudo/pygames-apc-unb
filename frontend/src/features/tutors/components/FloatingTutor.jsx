import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import TutorChat from './TutorChat';
import '../tutors.css';

export default function FloatingTutor({ problemId = null, code = null, raised = false }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef(null);
  const hasExercise = Boolean(problemId);

  const openPanel = () => {
    setMounted(true);
    setOpen(true);
  };

  const closePanel = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className={`floating-tutor ${raised ? 'floating-tutor--raised' : ''}`}>
      {mounted && (
        <div
          id="floating-tutor-panel"
          className={`floating-tutor__panel ${open ? 'floating-tutor__panel--open' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-label="Assistente"
          hidden={!open}
        >
          <TutorChat
            mode="assistant"
            surface="floating"
            title="Assistente"
            description="Pergunte sem sair da página."
            problemId={hasExercise ? problemId : null}
            code={hasExercise ? code : null}
            contextNote={hasExercise ? 'Vou considerar o exercício aberto e o código do editor.' : null}
            onClose={closePanel}
            active={open}
          />
        </div>
      )}
      <button
        type="button"
        ref={buttonRef}
        className="floating-tutor__button"
        aria-expanded={open}
        aria-controls="floating-tutor-panel"
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente'}
        onClick={() => (open ? closePanel() : openPanel())}
      >
        <MessageCircle size={20} aria-hidden="true" />
        <span>Tutor</span>
      </button>
    </div>
  );
}
