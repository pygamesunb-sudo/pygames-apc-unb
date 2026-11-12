/**
 * peca de tela dos tutores (TutorFocusToggle.jsx).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
import { useState } from 'react';
import { readTutorFocusMode, writeTutorFocusMode } from '../tutorFocus';

export default function TutorFocusToggle() {
  const [enabled, setEnabled] = useState(() => readTutorFocusMode());

  return (
    <label className="tutor-focus">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => {
          const next = event.target.checked;
          setEnabled(next);
          writeTutorFocusMode(next);
        }}
      />
      <span>
        <strong>Modo foco</strong>
        <small>Respostas menores e uma etapa por vez.</small>
      </span>
    </label>
  );
}
