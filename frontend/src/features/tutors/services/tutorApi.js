import api from '../../../services/api';

const LIMIT_MESSAGE = 'Você atingiu o limite de mensagens de hoje. Volte amanhã para continuar estudando.';
const UNAVAILABLE_MESSAGE = 'O tutor está temporariamente indisponível. Tente novamente em alguns instantes.';
const GENERIC_MESSAGE = 'Não foi possível falar com o tutor agora. Tente de novo em instantes.';

export function tutorErrorMessage(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  const code = detail && typeof detail === 'object' ? detail.code : '';
  if (detail === 'tutor_ai_not_configured') {
    return 'O Tutor IA ainda não está disponível neste ambiente.';
  }
  if (detail === 'tutor_exercise_invalid') {
    return 'Não consegui montar um exercício válido. Tente gerar de novo.';
  }
  if (status === 429 || code === 'tutor_daily_limit') return LIMIT_MESSAGE;
  if (code === 'tutor_provider_rate_limit') {
    return 'O tutor está com muitas solicitações agora. Tente de novo em instantes.';
  }
  if (code === 'tutor_provider_auth' || code === 'tutor_provider_permission') {
    return 'O tutor não conseguiu se conectar ao serviço de IA. Avise a equipe do projeto.';
  }
  if (code === 'tutor_model_invalid') {
    return 'O modelo do tutor não está disponível. Avise a equipe do projeto.';
  }
  if (code === 'tutor_timeout') {
    return 'O tutor demorou demais para responder. Tente de novo.';
  }
  if (status === 503) return UNAVAILABLE_MESSAGE;
  if (status === 401 || status === 403) {
    return 'Sua sessão expirou. Entre novamente para falar com o tutor.';
  }
  return GENERIC_MESSAGE;
}

function withFrontendGeminiKey(payload) {
  return {
    ...payload,
    gemini_api_key: localStorage.getItem('gemini_api_key') || null,
    use_custom_key: localStorage.getItem('use_custom_key') === 'true',
  };
}

export async function generateTutorExercise(payload) {
  const response = await api.post('/api/tutors/exercises', withFrontendGeminiKey(payload), { timeout: 70000 });
  return response.data;
}

export async function sendTutorMessage(payload) {
  const response = await api.post('/api/tutors/chat', withFrontendGeminiKey(payload), { timeout: 70000 });
  return response.data;
}

export async function listTutorConversations({ includeArchived = false, limit = 20, before } = {}) {
  const response = await api.get('/api/tutors/conversations', {
    timeout: 20000,
    params: {
      include_archived: includeArchived,
      limit,
      before: before || undefined,
    },
  });
  return response.data;
}

export async function getTutorConversation(conversationId) {
  const response = await api.get(`/api/tutors/conversations/${conversationId}`, { timeout: 20000 });
  return response.data;
}

export async function createTutorConversation(mode, surface = 'page') {
  const response = await api.post('/api/tutors/conversations', { mode, surface }, { timeout: 20000 });
  return response.data;
}

export async function updateTutorConversation(conversationId, changes) {
  const response = await api.patch(`/api/tutors/conversations/${conversationId}`, changes, { timeout: 20000 });
  return response.data;
}
