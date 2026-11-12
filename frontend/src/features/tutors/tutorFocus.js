/**
 * tutores agentes de aprendizagem no frontend (tutorFocus.js).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
const STORAGE_KEY = 'tutor_focus_mode';

export function readTutorFocusMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function writeTutorFocusMode(enabled) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // A preferencia fica só neste navegador. Sem ela, o tutor segue o modo normal.
  }
}
