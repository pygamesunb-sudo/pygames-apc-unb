import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 300s (5 min) - LLM e revisores paralelos demoram
});

// Interceptor para anexar o token Firebase Bearer dinamicamente em cada requisição
api.interceptors.request.use(
  async (config) => {
    if (auth && auth.currentUser) {
      try {
        // Obtém o token de identificação (atualiza automaticamente se estiver expirado)
        const token = await auth.currentUser.getIdToken();
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error("Erro ao anexar Firebase ID Token:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

/**
 * Obtém o perfil do usuário logado contendo pontos de programação e recordes de jogos.
 */
export async function getUserProfile() {
  const response = await api.get('/api/users/profile');
  return response.data;
}

/**
 * Registra um score obtido nos minigames no banco de dados.
 * @param {string} gameKey - 'doodle' | 'snake' | 'invaders'
 * @param {number} score
 */
export async function updateGameScore(gameKey, score) {
  const response = await api.post('/api/users/score', {
    game: gameKey,
    score: score
  });
  return response.data;
}

/**
 * Obtém o ranking consolidado dos melhores jogadores (placar de líderes).
 */
export async function getLeaderboard() {
  const response = await api.get('/api/users/leaderboard');
  return response.data;
}

/**
 * Obtém o histórico recente de submissões de código de todos os usuários.
 */
export async function getSubmissionsHistory() {
  const response = await api.get('/api/submissions/history');
  return response.data;
}

export default api;
