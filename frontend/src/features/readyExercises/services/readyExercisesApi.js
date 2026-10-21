import api from '../../../services/api';
import { READY_COPY } from '../readyExercisesModel';

export function readyExercisesErrorMessage(error) {
  const status = error?.response?.status;
  if (status === 503) return READY_COPY.unavailable;
  if (status === 401 || status === 403) {
    return 'Sua sessão expirou. Entre novamente para ver os exercícios.';
  }
  return READY_COPY.error;
}

export async function getReadyExercisesStatus() {
  const response = await api.get('/api/ready-exercises/status', { timeout: 15000 });
  return response.data;
}

export async function getReadyExerciseTopics() {
  const response = await api.get('/api/ready-exercises/topics', { timeout: 15000 });
  return response.data;
}

export async function listReadyExercises(filters = {}) {
  const response = await api.get('/api/ready-exercises', { params: filters, timeout: 20000 });
  return response.data;
}

export async function getReadyExerciseRecommendations(filters = {}) {
  const response = await api.get('/api/ready-exercises/recommendations', { params: filters, timeout: 20000 });
  return response.data;
}

export async function markReadyExerciseProgress(exerciseId, status) {
  const response = await api.post(
    `/api/ready-exercises/${exerciseId}/progress`,
    { status },
    { timeout: 15000 },
  );
  return response.data;
}
