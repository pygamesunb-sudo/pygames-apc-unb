export const TOPIC_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'entrada_saida', label: 'Entrada e Saída' },
  { id: 'variaveis', label: 'Variáveis' },
  { id: 'condicionais', label: 'Condicionais' },
  { id: 'while', label: 'While' },
  { id: 'for', label: 'For' },
  { id: 'strings', label: 'Strings' },
  { id: 'listas', label: 'Listas' },
  { id: 'funcoes', label: 'Funções' },
];

export const DIFFICULTY_FILTERS = [
  { id: '', label: 'Todas' },
  { id: 'beginner', label: 'Iniciante' },
  { id: 'intermediate', label: 'Intermediário' },
  { id: 'challenge', label: 'Desafio' },
];

export const PROGRESS_FILTERS = [
  { id: '', label: 'Qualquer progresso' },
  { id: 'false', label: 'Em aberto' },
  { id: 'true', label: 'Concluídos' },
];

const SOURCE_LABELS = {
  pygames: 'Pygames',
  beecrowd: 'BeeCrowd',
};

const DIFFICULTY_LABELS = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  challenge: 'Desafio',
};

const SOLVER_DIFFICULTY = {
  beginner: 'facil',
  intermediate: 'medio',
  challenge: 'dificil',
};

export const READY_COPY = {
  unavailable: 'Os exercícios prontos estão temporariamente indisponíveis.',
  error: 'Não conseguimos carregar os exercícios agora.',
  empty: 'Nenhum exercício encontrado com esses filtros.',
};

export function sourceLabel(source) {
  return SOURCE_LABELS[source] || 'Fonte externa';
}

export function topicLabel(topic) {
  return TOPIC_FILTERS.find((item) => item.id === topic)?.label || 'Exercício';
}

export function difficultyLabel(difficulty) {
  return DIFFICULTY_LABELS[difficulty] || 'Iniciante';
}

export function statusLabel(exercise) {
  if (exercise?.completed) return 'Concluído';
  if (exercise?.started) return 'Em andamento';
  return '';
}

export function actionLabel(exercise) {
  if (exercise?.completed) return 'Fazer novamente';
  if (exercise?.started) return 'Continuar';
  return 'Começar exercício';
}

export function cardContent(exercise) {
  return {
    title: exercise.title,
    topic: topicLabel(exercise.topic),
    difficulty: difficultyLabel(exercise.difficulty),
    status: statusLabel(exercise),
    source: `Fonte: ${sourceLabel(exercise.source)} • #${exercise.external_id}`,
    action: actionLabel(exercise),
  };
}

export function pageState({ loading, unavailable, error, count }) {
  if (loading) return { kind: 'loading' };
  if (unavailable) return { kind: 'unavailable', message: READY_COPY.unavailable };
  if (error) return { kind: 'error', message: READY_COPY.error };
  if (!count) return { kind: 'empty', message: READY_COPY.empty };
  return { kind: 'ready', message: '' };
}

export function buildReadyExerciseQuery({ topic, difficulty, completed, page = 1, limit = 20 }) {
  const params = { page, limit };
  if (topic && topic !== 'todos') params.topic = topic;
  if (difficulty) params.difficulty = difficulty;
  if (completed === 'true' || completed === 'false') params.completed = completed;
  return params;
}

export function matchesFilters(exercise, filters = {}) {
  if (filters.topic && filters.topic !== 'todos' && exercise.topic !== filters.topic) return false;
  if (filters.difficulty && exercise.difficulty !== filters.difficulty) return false;
  if (filters.completed === 'true' && !exercise.completed) return false;
  if (filters.completed === 'false' && exercise.completed) return false;
  if (filters.source && exercise.source !== filters.source) return false;
  return true;
}

function practiceDescription(exercise) {
  const content = cardContent(exercise);
  const lines = [];
  if (exercise.statement) lines.push(exercise.statement, '');
  if (exercise.input_description) lines.push('Entrada', exercise.input_description, '');
  if (exercise.output_description) lines.push('Saída', exercise.output_description, '');
  const examples = Array.isArray(exercise.examples) ? exercise.examples : [];
  examples.forEach((example, index) => {
    lines.push(
      `Exemplo ${index + 1}`,
      example.input ?? '',
      example.output ?? '',
      '',
    );
  });
  lines.push(content.source, 'Registrar a prática não altera o ranking.');
  return lines.join('\n');
}

export function toPracticeProblem(exercise) {
  const content = cardContent(exercise);
  const examples = Array.isArray(exercise.examples) ? exercise.examples : [];
  return {
    problem_id: exercise.id,
    title: exercise.title,
    description: practiceDescription(exercise),
    difficulty: SOLVER_DIFFICULTY[exercise.difficulty] || 'facil',
    topic: content.topic,
    test_cases: examples.map((example) => ({
      input: example.input ?? '',
      expected_output: example.output ?? '',
    })),
    solution_blocks: [],
    hints: Array.isArray(exercise.hints) ? exercise.hints : [],
    source: exercise.source,
    source_label: sourceLabel(exercise.source),
    external_id: exercise.external_id,
    external_url: exercise.external_url || '',
    ready_exercise: true,
  };
}
