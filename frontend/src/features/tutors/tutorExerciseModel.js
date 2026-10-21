export const EXERCISE_TOPICS = [
  { id: 'entrada_saida', label: 'Entrada e saída' },
  { id: 'variaveis', label: 'Variáveis' },
  { id: 'strings', label: 'Strings' },
  { id: 'condicionais', label: 'Condicionais' },
  { id: 'while', label: 'While' },
  { id: 'for', label: 'For' },
  { id: 'listas', label: 'Listas' },
  { id: 'funcoes', label: 'Funções' },
  { id: 'recursao', label: 'Recursão' },
];

export const EXERCISE_DIFFICULTIES = [
  { id: 'facil', label: 'Fácil' },
  { id: 'medio', label: 'Médio' },
  { id: 'dificil', label: 'Difícil' },
];

export const EXERCISE_QUICK_ACTIONS = [
  'Não entendi o enunciado',
  'Explique a entrada e a saída',
  'Que conteúdo preciso saber?',
  'Me dê uma dica',
  'Me ajude com a lógica',
  'Me ajude a fazer o pseudocódigo',
  'Analise meu código',
  'Explique meu erro',
  'Me dê outra dica',
];

const REQUIRED_TEXT = [
  'titulo',
  'tema',
  'dificuldade',
  'enunciado',
  'entrada',
  'saida',
  'exemploEntrada',
  'exemploSaida',
];

export function isTutorExercise(value) {
  if (!value || typeof value !== 'object') return false;
  const textOk = REQUIRED_TEXT.every((key) => typeof value[key] === 'string' && value[key].trim());
  const conceptsOk = Array.isArray(value.conceitos)
    && value.conceitos.length > 0
    && value.conceitos.every((item) => typeof item === 'string' && item.trim());
  return textOk && conceptsOk;
}

export function extractPythonCode(text) {
  const source = text || '';
  const fence = source.match(/```(?:python)?\s*([\s\S]*?)```/i);
  if (fence && fence[1].trim()) return fence[1].trim();
  const looksLikeCode = /\b(def |for |while |if |elif |else:|print\(|input\(|return )/.test(source);
  if (looksLikeCode && source.includes('\n')) return source.trim();
  return '';
}

export function buildExerciseChatPayload({ conversationId, exercise, message }) {
  const payload = {
    mode: 'exercise',
    surface: 'page',
    message,
    exercise,
  };
  if (conversationId) payload.conversation_id = conversationId;
  const code = extractPythonCode(message);
  if (code) payload.code = code;
  return payload;
}

export function introMessage(exercise) {
  return {
    message_id: `intro-${exercise.titulo}`,
    role: 'assistant',
    content: [
      'Vamos começar entendendo o problema.',
      '',
      `O exercício "${exercise.titulo}" está fixado acima.`,
      'Leia o enunciado e me diga, com suas palavras, o que o programa precisa fazer.',
    ].join('\n'),
  };
}
