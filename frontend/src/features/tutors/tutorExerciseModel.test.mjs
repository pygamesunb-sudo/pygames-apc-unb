import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExerciseChatPayload,
  extractPythonCode,
  isTutorExercise,
} from './tutorExerciseModel.js';

const exercise = {
  titulo: 'Ultima carta',
  tema: 'Listas',
  dificuldade: 'Fácil',
  enunciado: 'Guarde cinco inteiros e mostre o ultimo.',
  entrada: 'Cinco inteiros.',
  saida: 'O quinto inteiro.',
  exemploEntrada: '1\n2\n3\n4\n9',
  exemploSaida: '9',
  conceitos: ['listas'],
};

test('aceita somente exercicio completo', () => {
  assert.equal(isTutorExercise(exercise), true);
  assert.equal(isTutorExercise({ ...exercise, enunciado: '  ' }), false);
  assert.equal(isTutorExercise({ ...exercise, conceitos: [] }), false);
});

test('payload do chat leva o exercicio fixado e o codigo colado', () => {
  const message = 'Meu codigo:\n```python\ndef dobro(n):\n    return n\n```';
  const payload = buildExerciseChatPayload({
    conversationId: 'conv-1',
    exercise,
    message,
  });
  assert.equal(payload.mode, 'exercise');
  assert.equal(payload.exercise.titulo, 'Ultima carta');
  assert.equal(payload.conversation_id, 'conv-1');
  assert.match(payload.code, /def dobro/);
  assert.equal(extractPythonCode('Não entendi o enunciado'), '');
});
