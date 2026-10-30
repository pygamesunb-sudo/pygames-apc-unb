import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExerciseChatPayload,
  buildGeneratePayload,
  extractPythonCode,
  isGeneratedExercise,
} from './tutorExerciseModel.js';

const exercise = {
  title: 'Entrada na Montanha-Russa',
  story: 'Você trabalha no parque LoopLand.',
  statement: 'Leia a altura e decida se a pessoa pode entrar.',
  topic: 'Condicionais',
  difficulty: 'Fácil',
  input: { description: 'Um inteiro.', type: 'número inteiro' },
  output: { description: 'PODE ENTRAR ou NAO PODE ENTRAR.', type: 'texto' },
  examples: [{ input: '145', output: 'PODE ENTRAR', explanation: '145 passa de 140.' }],
  constraints: [],
  hints: ['Compare com 140.'],
};

test('aceita somente exercicio publico completo', () => {
  assert.equal(isGeneratedExercise(exercise), true);
  assert.equal(isGeneratedExercise({ ...exercise, statement: '  ' }), false);
  assert.equal(isGeneratedExercise({ ...exercise, reference_solution: 'print(1)' }), false);
});

test('payloads separam geracao e conversa do exercicio fixado', () => {
  const generated = buildGeneratePayload({
    theme: 'espaço',
    topic: 'condicionais',
    difficulty: 'facil',
    inputType: 'inteiro',
    outputType: 'texto',
  });
  assert.equal(generated.mode, 'exercise_generator');
  assert.equal(generated.action, 'generate');
  assert.equal(generated.theme, 'espaço');
  assert.equal(generated.focus_mode, false);
  assert.equal(generated.prompt, undefined);

  const message = 'Meu codigo:\n```python\ndef dobro(n):\n    return n\n```';
  const payload = buildExerciseChatPayload({ conversationId: 'conv-1', message });
  assert.equal(payload.mode, 'exercise_generator');
  assert.equal(payload.action, 'chat');
  assert.equal(payload.conversation_id, 'conv-1');
  assert.equal(payload.focus_mode, false);
  assert.equal(payload.prompt, undefined);
  assert.match(payload.code, /def dobro/);
  assert.equal(extractPythonCode('Quero uma dica'), '');
});
