import api from '../../../services/api';

const LIMIT_MESSAGE = 'Você atingiu o limite de mensagens de hoje. Volte amanhã para continuar estudando.';
const UNAVAILABLE_MESSAGE = 'O tutor está temporariamente indisponível. Tente novamente em alguns instantes.';
const GENERIC_MESSAGE = 'Não foi possível falar com o tutor agora. Tente de novo em instantes.';

export function tutorErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 429) return LIMIT_MESSAGE;
  if (status === 503) return UNAVAILABLE_MESSAGE;
  if (status === 401 || status === 403) {
    return 'Sua sessão expirou. Entre novamente para falar com o tutor.';
  }
  return GENERIC_MESSAGE;
}

export async function sendTutorMessage(payload) {
  const response = await api.post('/api/tutors/chat', payload, { timeout: 70000 });
  return response.data;
}

export async function listTutorConversations() {
  const response = await api.get('/api/tutors/conversations', { timeout: 20000 });
  return response.data;
}

export async function getTutorConversation(conversationId) {
  const response = await api.get(`/api/tutors/conversations/${conversationId}`, { timeout: 20000 });
  return response.data;
}
