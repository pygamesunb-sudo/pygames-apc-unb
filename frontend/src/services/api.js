import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 300s (5 min) - LLM e revisores paralelos demoram
});

// Interceptor para anexar o token Firebase Bearer dinamicamente em cada requisição
api.interceptors.request.use(
  async (config) => {
    if (auth?.currentUser) {
      try {
        const token = await Promise.race([
          auth.currentUser.getIdToken(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout ao obter token Firebase')), 8000)
          ),
        ]);
        config.headers['Authorization'] = `Bearer ${token}`;
      } catch (error) {
        console.error('Erro ao anexar Firebase ID Token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Gera um problema via pipeline LLM de forma tradicional (bloqueante).
 * Mantido apenas por compatibilidade legado, se necessário.
 */
export async function generateProblem(topic, difficulty) {
  const gemini_api_key = localStorage.getItem('gemini_api_key') || null;
  const use_custom_key = localStorage.getItem('use_custom_key') === 'true';

  const response = await api.post('/api/problems/generate', { 
    topic, 
    difficulty,
    gemini_api_key,
    use_custom_key
  });
  return response.data;
}

/**
 * Gera um problema usando Server-Sent Events (SSE) para streaming progressivo.
 * @param {string} topic 
 * @param {string} difficulty 
 * @param {function} onChunk - Callback acionada com cada chunk de texto puro.
 */
export async function generateProblemStream(topic, difficulty, onChunk) {
  const gemini_api_key = localStorage.getItem('gemini_api_key') || null;
  const use_custom_key = localStorage.getItem('use_custom_key') === 'true';

  let headers = {
    'Content-Type': 'application/json',
  };

  if (auth && auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${api.defaults.baseURL}/api/problems/generate_stream`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      topic,
      difficulty,
      gemini_api_key,
      use_custom_key
    })
  });

  if (!response.ok) {
    let errorDetail = "Erro ao conectar ao streaming.";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch(e) {}
    throw new Error(errorDetail);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // Processamento de SSE bufferizado
    const lines = buffer.split('\n');
    buffer = lines.pop(); // O último pedaço pode estar incompleto, guarda no buffer
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('data:')) {
        const dataStr = trimmedLine.substring(5).trim();
        if (dataStr === '[DONE]') continue;
        let dataObj;
        try {
          dataObj = JSON.parse(dataStr);
        } catch (e) {
          // Ignora JSON inparseavel
          continue;
        }

        if (dataObj.error) {
          throw new Error(typeof dataObj.error === 'string' ? dataObj.error : JSON.stringify(dataObj.error));
        }

        if (dataObj.choices && dataObj.choices[0] && dataObj.choices[0].delta && dataObj.choices[0].delta.content !== undefined) {
          const content = dataObj.choices[0].delta.content;
          onChunk(content);
        }
      }
    }
  }
}

/**
 * Valida os casos de teste gerados executando localmente no backend de forma rápida.
 */
export async function validateProblem(solution, testCases) {
  const response = await api.post('/api/problems/validate', {
    solution,
    test_cases: testCases
  });
  return response.data;
}

/**
 * Aciona o agente revisor para consertar um problema reprovado na validação.
 */
export async function reviewProblem(problemData) {
  const gemini_api_key = localStorage.getItem('gemini_api_key') || null;
  const use_custom_key = localStorage.getItem('use_custom_key') === 'true';

  const response = await api.post('/api/problems/review', {
    problem_data: problemData,
    gemini_api_key,
    use_custom_key
  });
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
  const response = await api.get('/api/users/profile', { timeout: 10000 });
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

/**
 * Salva as configuracoes de API Key do Gemini do usuario no servidor.
 */
export async function saveGeminiConfig(gemini_api_key, use_custom_key) {
  const response = await api.post('/api/users/gemini-config', {
    gemini_api_key,
    use_custom_key
  });
  return response.data;
}

export default api;
