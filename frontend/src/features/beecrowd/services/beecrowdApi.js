import api from '../../../services/api';

export function beecrowdErrorMessage(error) {
  const status = error?.response?.status;
  const detail = error?.response?.data?.detail;
  if (status === 503 && detail === 'beecrowd_integration_not_configured') {
    return 'Integração BeeCrowd em preparação.';
  }
  if (status === 401 || status === 403) {
    return 'Sua sessão expirou. Entre novamente para ver o BeeCrowd.';
  }
  return 'Não foi possível consultar o BeeCrowd agora.';
}

export async function getBeeCrowdStatus() {
  const response = await api.get('/api/beecrowd/status', { timeout: 15000 });
  return response.data;
}

export async function listBeeCrowdProblems(filters = {}) {
  const response = await api.get('/api/beecrowd/problems', { params: filters, timeout: 20000 });
  return response.data;
}

export async function getBeeCrowdRecommendations(filters = {}) {
  const response = await api.get('/api/beecrowd/recommendations', { params: filters, timeout: 20000 });
  return response.data;
}
