/**
 * tutores agentes de aprendizagem no frontend (tutorExerciseModel.js).
 * Branch comment: leitura academica do codigo, sem mudar o comportamento.
 */
export const EXERCISE_TOPICS = [
  { id: 'entrada_saida', label: 'Entrada e saída' },
  { id: 'variaveis', label: 'Variáveis' },
  { id: 'operadores', label: 'Operadores' },
  { id: 'condicionais', label: 'Condicionais' },
  { id: 'while', label: 'While' },
  { id: 'for', label: 'For' },
  { id: 'strings', label: 'Strings' },
  { id: 'listas', label: 'Listas' },
  { id: 'funcoes', label: 'Funções' },
];

export const EXERCISE_DIFFICULTIES = [
  { id: 'facil', label: 'Fácil' },
  { id: 'medio', label: 'Médio' },
  { id: 'dificil', label: 'Difícil' },
];

export const THEME_SUGGESTIONS = [
  'jogos',
  'futebol',
  'espaço',
  'gatos',
  'escola',
  'cafeteria',
  'RPG',
  'música',
  'filmes',
];

export const INPUT_TYPES = [
  { id: 'inteiro', label: 'Número inteiro' },
  { id: 'decimal', label: 'Número decimal' },
  { id: 'string', label: 'String' },
  { id: 'varios_numeros', label: 'Vários números' },
  { id: 'lista', label: 'Lista' },
  { id: 'automatico', label: 'Automático' },
];

export const OUTPUT_TYPES = [
  { id: 'numero', label: 'Número' },
  { id: 'texto', label: 'Texto' },
  { id: 'booleano', label: 'Booleano/lógico' },
  { id: 'lista', label: 'Lista' },
  { id: 'automatico', label: 'Automático' },
];

export const EXERCISE_QUICK_ACTIONS = [
  { id: 'hint', label: 'Quero uma dica', message: 'Quero uma dica.' },
  { id: 'think', label: 'Me ajude a pensar', message: 'Me ajude a pensar.' },
  { id: 'bug', label: 'Meu código está dando erro', message: 'Meu código está dando erro.' },
  { id: 'explain', label: 'Explique o exercício', message: 'Explique o exercício.' },
  { id: 'another', label: 'Gerar outro exercício' },
  { id: 'check', label: 'Verificar minha solução', message: 'Verifique minha solução.' },
];

export function isGeneratedExercise(value) {
  if (!value || typeof value !== 'object') return false;
  const textOk = ['title', 'story', 'statement', 'topic', 'difficulty'].every(
    (key) => typeof value[key] === 'string' && value[key].trim(),
  );
  const ioOk = value.input?.description && value.output?.description;
  const example = Array.isArray(value.examples) ? value.examples[0] : null;
  const exampleOk = example && String(example.input).trim() && String(example.output).trim();
  const hidden = value.reference_solution == null && value.solution_explanation == null;
  return textOk && ioOk && exampleOk && hidden;
}

export function extractPythonCode(text) {
  const source = text || '';
  const fence = source.match(/```(?:python)?\s*([\s\S]*?)```/i);
  if (fence && fence[1].trim()) return fence[1].trim();
  const looksLikeCode = /\b(def |for |while |if |elif |else:|print\(|input\(|return )/.test(source);
  if (looksLikeCode && source.includes('\n')) return source.trim();
  return '';
}

export function buildGeneratePayload({ theme, topic, difficulty, inputType, outputType, focusMode = false }) {
  return {
    mode: 'exercise_generator',
    action: 'generate',
    surface: 'page',
    message: 'Gerar exercício',
    theme,
    topic,
    difficulty,
    input_type: inputType,
    output_type: outputType,
    focus_mode: Boolean(focusMode),
  };
}

export function buildExerciseChatPayload({ conversationId, message, focusMode = false }) {
  const payload = {
    mode: 'exercise_generator',
    action: 'chat',
    surface: 'page',
    message,
    conversation_id: conversationId,
    focus_mode: Boolean(focusMode),
  };
  const code = extractPythonCode(message);
  if (code) payload.code = code;
  return payload;
}
