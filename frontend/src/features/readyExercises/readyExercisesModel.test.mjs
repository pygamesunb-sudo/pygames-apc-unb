import test from 'node:test';
import assert from 'node:assert/strict';
import {
  actionLabel,
  buildReadyExerciseQuery,
  cardContent,
  matchesFilters,
  pageState,
  sourceLabel,
  statusLabel,
  toPracticeProblem,
} from './readyExercisesModel.js';

const exercise = {
  id: 'beecrowd_1001',
  external_id: '1001',
  source: 'beecrowd',
  title: 'Extremamente Básico',
  topic: 'entrada_saida',
  topics: ['variáveis', 'entrada', 'saída'],
  difficulty: 'beginner',
  level: 1,
  external_url: 'https://www.beecrowd.com.br/judge/pt/problems/view/1001',
  completed: false,
  started: false,
  statement: 'enunciado secreto que nao pode aparecer',
};

test('normaliza o card sem depender do payload da fonte', () => {
  const content = cardContent(exercise);
  assert.equal(content.title, 'Extremamente Básico');
  assert.equal(content.topic, 'Entrada e Saída');
  assert.equal(content.difficulty, 'Iniciante');
  assert.equal(content.source, 'Fonte: BeeCrowd • #1001');
  assert.equal(content.action, 'Começar exercício');
  assert.equal(sourceLabel('beecrowd'), 'BeeCrowd');
  assert.equal(JSON.stringify(content).includes('enunciado secreto'), false);
});

test('filtros de assunto, dificuldade e progresso', () => {
  const whileExercise = { ...exercise, id: 'beecrowd_1114', topic: 'while', difficulty: 'beginner', completed: false };
  const done = { ...whileExercise, id: 'beecrowd_1113', completed: true };
  const filters = { topic: 'while', difficulty: 'beginner', completed: 'false' };
  assert.equal(matchesFilters(whileExercise, filters), true);
  assert.equal(matchesFilters(exercise, filters), false);
  assert.equal(matchesFilters(done, filters), false);
  assert.deepEqual(buildReadyExerciseQuery({ ...filters, page: 1, limit: 20 }), {
    topic: 'while',
    difficulty: 'beginner',
    completed: 'false',
    page: 1,
    limit: 20,
  });
});

test('card muda acao e status quando o exercicio ja foi feito', () => {
  const started = { ...exercise, started: true };
  const completed = { ...exercise, completed: true, started: false };
  assert.equal(statusLabel(started), 'Em andamento');
  assert.equal(actionLabel(started), 'Continuar');
  assert.equal(statusLabel(completed), 'Concluído');
  assert.equal(actionLabel(completed), 'Fazer novamente');
  assert.match(cardContent(completed).status, /Concluído/);
});

test('estados de carregamento, vazio, erro e indisponivel', () => {
  assert.equal(pageState({ loading: true, unavailable: false, error: '', count: 0 }).kind, 'loading');
  assert.match(pageState({ loading: false, unavailable: true, error: '', count: 0 }).message, /temporariamente indisponíveis/);
  assert.match(pageState({ loading: false, unavailable: false, error: 'falhou', count: 0 }).message, /Não conseguimos carregar/);
  assert.match(pageState({ loading: false, unavailable: false, error: '', count: 0 }).message, /Nenhum exercício encontrado/);
  assert.equal(pageState({ loading: false, unavailable: false, error: '', count: 2 }).kind, 'ready');
});

test('abrir exercicio local reaproveita o editor com enunciado proprio', () => {
  const local = {
    id: 'pygames_es-01',
    external_id: 'es-01',
    source: 'pygames',
    title: 'Saudacao da turma',
    topic: 'entrada_saida',
    difficulty: 'beginner',
    statement: 'Leia o nome e mostre a saudacao.',
    input_description: 'Uma linha com o nome.',
    output_description: 'Ola, NOME!',
    examples: [{ input: 'Ana', output: 'Ola, Ana!' }],
    hints: ['Use input().'],
    external_url: '',
  };
  const problem = toPracticeProblem(local);
  assert.equal(problem.ready_exercise, true);
  assert.equal(problem.problem_id, 'pygames_es-01');
  assert.equal(problem.source, 'pygames');
  assert.equal(problem.source_label, 'Pygames');
  assert.equal(problem.external_id, 'es-01');
  assert.deepEqual(problem.test_cases, [{ input: 'Ana', expected_output: 'Ola, Ana!' }]);
  assert.deepEqual(problem.hints, ['Use input().']);
  assert.match(problem.description, /Leia o nome e mostre a saudacao/);
  assert.match(problem.description, /Fonte: Pygames • #es-01/);
  assert.equal(JSON.stringify(cardContent(local)).includes('Leia o nome'), false);
});

test('card do BeeCrowd continua sem copiar enunciado', () => {
  const problem = toPracticeProblem(exercise);
  assert.equal(problem.source, 'beecrowd');
  assert.equal(problem.source_label, 'BeeCrowd');
  assert.match(problem.description, /enunciado secreto/);
  assert.equal(JSON.stringify(cardContent(exercise)).includes('enunciado secreto'), false);
});
