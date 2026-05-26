import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 300s (5 min) - LLM e revisores paralelos demoram
});

/**
 * Gera um problema via pipeline LLM.
 * @param {string} topic - Tema de interesse do usuario.
 * @param {string} difficulty - 'facil' | 'medio' | 'dificil' | 'competitivo'
 */
export async function generateProblem(topic, difficulty) {
  const response = await api.post('/api/problems/generate', { topic, difficulty });
  return response.data;
}

/**
 * Submete o codigo do usuario para avaliacao.
 * @param {string} problemId
 * @param {string} code
 */
export async function submitCode(problemId, code) {
  const response = await api.post('/api/submissions/submit', {
    problem_id: problemId,
    code,
  });
  return response.data;
}

export async function listProblems() {
  const response = await api.get('/api/problems');
  return response.data;
}

export default api;
