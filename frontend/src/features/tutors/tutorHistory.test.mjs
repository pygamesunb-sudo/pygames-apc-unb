import test from 'node:test';
import assert from 'node:assert/strict';
import { groupConversations } from './tutorHistory.js';

const now = new Date('2026-10-21T15:00:00Z');

test('agrupa conversas em hoje, ontem, semana e mais antigas', () => {
  const groups = groupConversations([
    { conversation_id: 'a', last_message_at: '2026-10-21T12:00:00+00:00' },
    { conversation_id: 'b', last_message_at: '2026-10-20T12:00:00+00:00' },
    { conversation_id: 'c', last_message_at: '2026-10-16T12:00:00+00:00' },
    { conversation_id: 'd', last_message_at: '2026-09-01T12:00:00+00:00' },
  ], now);
  const labels = groups.map((group) => group.label);
  assert.deepEqual(labels, ['Hoje', 'Ontem', 'Últimos 7 dias', 'Mais antigas']);
  assert.equal(groups[0].items[0].conversation_id, 'a');
});
