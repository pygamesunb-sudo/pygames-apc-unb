// Lista de especificações de endpoints detalhados em Português com foco em Python
export const ENDPOINTS_SPEC = [
  {
    id: 'gen-problem',
    tag: 'problems',
    method: 'POST',
    path: '/api/problems/generate',
    summary: 'Gera desafio via Pipeline LLM',
    description: 'Envia um tema e nível de dificuldade para gerar um novo desafio de programação. O sistema executa um agente gerador (LLM) que cria o problema, os casos de teste e a solução ideal. Em seguida, dois revisores paralelos rodam o código contra as especificações. É persistido no Firestore se passar pela revisão.',
    authRequired: true,
    params: [
      { name: 'topic', type: 'string', required: true, description: 'Tema ou assunto específico em Python que deseja estudar (ex: loops, arrays, recursão).' },
      { name: 'difficulty', type: 'string', required: true, description: 'Nível de dificuldade: "facil", "medio", "dificil" ou "competitivo".' },
      { name: 'gemini_api_key', type: 'string', required: false, description: 'Chave customizada do Gemini, caso queira utilizar sua própria cota.' },
      { name: 'use_custom_key', type: 'boolean', required: false, description: 'Define se deve priorizar o uso da sua chave customizada.' }
    ],
    defaultPayload: {
      topic: 'Estruturas de repetição e listas dinâmicas',
      difficulty: 'medio',
      gemini_api_key: '',
      use_custom_key: false
    },
    pythonSnippet: (url, payload) => `import requests

# URL base da API Pygame-APC (local ou cloud)
url = "${url}/api/problems/generate"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "topic": "${payload.topic || 'Estruturas de repetição'}",
    "difficulty": "${payload.difficulty || 'medio'}",
    "gemini_api_key": "${payload.gemini_api_key || ''}",
    "use_custom_key": ${payload.use_custom_key ? 'True' : 'False'}
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status() # Lança erro se status não for 2xx
    
    dados = response.json()
    print("Desafio Gerado com Sucesso!")
    print(f"Título: {dados.get('title')}")
    print(f"ID do Problema: {dados.get('problem_id')}")
    print(f"Descrição: {dados.get('description')[:120]}...")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")
except Exception as e:
    print(f"Falha na conexão: {e}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/problems/generate" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/problems/generate";

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)})
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'list-problems',
    tag: 'problems',
    method: 'GET',
    path: '/api/problems',
    summary: 'Lista todos os problemas salvos',
    description: 'Recupera a lista completa de problemas que já foram gerados com sucesso pela pipeline de inteligência artificial e que estão salvos no Firestore do Pygame-APC.',
    authRequired: true,
    params: [],
    defaultPayload: null,
    pythonSnippet: (url) => `import requests

url = "${url}/api/problems"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    problemas = response.json()
    print(f"Total de problemas carregados: {len(problemas)}")
    for p in problemas[:5]: # Mostra os 5 primeiros
        print(f"- [{p.get('difficulty').upper()}] {p.get('title')} (ID: {p.get('problem_id')})")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url) => `curl -X GET "${url}/api/problems" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"`,
    jsSnippet: (url) => `const url = "${url}/api/problems";

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN'
  }
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'submit-code',
    tag: 'submissions',
    method: 'POST',
    path: '/api/submissions/submit',
    summary: 'Submete código Python para testes',
    description: 'Recebe o script escrito pelo usuário, busca a especificação do problema com os testes unitários originais do banco, executa o código em subprocesso isolado no servidor e salva o histórico da tentativa. Retorna se passou em todos os testes e atualiza os pontos de programação.',
    authRequired: true,
    params: [
      { name: 'problem_id', type: 'string', required: true, description: 'ID identificador único do problema que deseja submeter.' },
      { name: 'code', type: 'string', required: true, description: 'Script Python completo escrito para resolver o problema.' }
    ],
    defaultPayload: {
      problem_id: 'exemplo-id-de-problema',
      code: 'def soma(a, b):\n    # Escreva sua solucao aqui\n    return a + b\n\n# Exemplo de leitura de inputs do console\nimport sys\nfor line in sys.stdin:\n    partes = line.split()\n    if partes:\n        print(soma(int(partes[0]), int(partes[1])))\n'
    },
    pythonSnippet: (url, payload) => `import requests

url = "${url}/api/submissions/submit"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "problem_id": "${payload.problem_id || 'id_do_problema'}",
    "code": """${payload.code || '# Seu script Python aqui'}"""
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    resultado = response.json()
    print("Código Avaliado com sucesso!")
    print(f"Passou em tudo? {resultado.get('all_passed')}")
    print(f"Pontuação da tentativa: {resultado.get('score')}%")
    print(f"Total de Pontos de Código do Perfil: {resultado.get('coding_points')}")
    
    # Detalhes de cada caso de teste
    for i, t in enumerate(resultado.get('results', [])):
        status = "PASSED" if t.get("passed") else "FAILED"
        print(f"Teste #{i}: {status} | Saída real: '{t.get('actual_output')}' | Esperada: '{t.get('expected_output')}'")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/submissions/submit" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/submissions/submit";

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)})
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'submissions-history',
    tag: 'submissions',
    method: 'GET',
    path: '/api/submissions/history',
    summary: 'Histórico global de submissões',
    description: 'Recupera um log das últimas submissões executadas por todos os usuários da plataforma, indicando o nome do jogador, título do desafio resolvido, data e pontuação obtida.',
    authRequired: true,
    params: [],
    defaultPayload: null,
    pythonSnippet: (url) => `import requests

url = "${url}/api/submissions/history"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    historico = response.json()
    print("Histórico Recente de Submissões:")
    for h in historico[:8]:
        status = "COMPLETO" if h.get("score") == 100 else f"NOTA {h.get('score')}"
        print(f"- {h.get('name')} resolveu '{h.get('problem_title')}' -> {status}")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url) => `curl -X GET "${url}/api/submissions/history" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"`,
    jsSnippet: (url) => `const url = "${url}/api/submissions/history";

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN'
  }
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'user-profile',
    tag: 'users',
    method: 'GET',
    path: '/api/users/profile',
    summary: 'Carrega o perfil do jogador logado',
    description: 'Carrega as estatísticas consolidadas da conta logada: pontos acumulados resolvendo desafios Python (coding_points), recordes de alta pontuação nos mini-games do fliperama (doodle, snake, invaders) e o total agregador.',
    authRequired: true,
    params: [],
    defaultPayload: null,
    pythonSnippet: (url) => `import requests

url = "${url}/api/users/profile"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    profile = response.json()
    print("=== PERFIL DO JOGADOR ===")
    print(f"Nome: {profile.get('name')}")
    print(f"Email: {profile.get('email')}")
    print(f"Pontos Python (Coding): {profile.get('coding_points', 0)}")
    print(f"Pontuação Geral (Score): {profile.get('total_score', 0)}")
    
    # Recordes do Fliperama
    games = profile.get('games', {})
    print("Recordes do Fliperama:")
    print(f"- Snake.py: {games.get('snake', 0)} pts")
    print(f"- Doodle Ninja: {games.get('doodle', 0)} pts")
    print(f"- Bug Invaders: {games.get('invaders', 0)} pts")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url) => `curl -X GET "${url}/api/users/profile" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"`,
    jsSnippet: (url) => `const url = "${url}/api/users/profile";

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN'
  }
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'update-score',
    tag: 'users',
    method: 'POST',
    path: '/api/users/score',
    summary: 'Registra pontuação de mini-game',
    description: 'Salva um novo recorde obtido nos mini-games retrô integrados. O servidor compara com o recorde atual do jogador para aquela chave ("snake", "doodle" ou "invaders") e atualiza o recorde máximo e a soma total de pontuação se for maior.',
    authRequired: true,
    params: [
      { name: 'game', type: 'string', required: true, description: 'Identificador do jogo: "doodle", "snake" ou "invaders".' },
      { name: 'score', type: 'integer', required: true, description: 'Pontuação inteira obtida na partida.' }
    ],
    defaultPayload: {
      game: 'snake',
      score: 120
    },
    pythonSnippet: (url, payload) => `import requests

url = "${url}/api/users/score"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "game": "${payload.game || 'snake'}",
    "score": ${payload.score || 50}
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    dados = response.json()
    print("Pontuação sincronizada com sucesso!")
    print(f"Recorde atual no {payload.game}: {dados.get('highscore')} pts")
    print(f"Sua Pontuação Total agregada: {dados.get('total_score')} pts")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/users/score" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/users/score";

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)})
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'leaderboard',
    tag: 'users',
    method: 'GET',
    path: '/api/users/leaderboard',
    summary: 'Carrega Placar de Líderes global',
    description: 'Recupera o ranking consolidado dos melhores jogadores da plataforma ordenados em ordem decrescente pela pontuação geral acumulada (soma de conquistas Python + recordes de fliperama).',
    authRequired: true,
    params: [],
    defaultPayload: null,
    pythonSnippet: (url) => `import requests

url = "${url}/api/users/leaderboard"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    
    leaderboard = response.json()
    print("=== PLACAR GERAL DE LÍDERES ===")
    for i, jogador in enumerate(leaderboard, start=1):
        print(f"{i}º Lugar: {jogador.get('name')} | {jogador.get('total_score', 0)} pts")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url) => `curl -X GET "${url}/api/users/leaderboard" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"`,
    jsSnippet: (url) => `const url = "${url}/api/users/leaderboard";

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN'
  }
});

const data = await response.json();
console.log(data);`
  },
  {
    id: 'gemini-config',
    tag: 'users',
    method: 'POST',
    path: '/api/users/gemini-config',
    summary: 'Salva chaves do Gemini do usuário',
    description: 'Persiste as preferências de modelo de IA do jogador (chave própria do Gemini e flag de ativação) no Firestore para que as requisições geradoras usem a cota individual do usuário e sincronizem de forma transparente entre navegadores.',
    authRequired: true,
    params: [
      { name: 'gemini_api_key', type: 'string', required: false, description: 'Chave secreta de API gerada no Google AI Studio (ex: AIzaSy...).' },
      { name: 'use_custom_key', type: 'boolean', required: true, description: 'Se o pipeline do Pygame-APC deve priorizar a chave do usuário.' }
    ],
    defaultPayload: {
      gemini_api_key: 'AIzaSyYourKeyHere_example',
      use_custom_key: true
    },
    pythonSnippet: (url, payload) => `import requests

url = "${url}/api/users/gemini-config"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "gemini_api_key": "${payload.gemini_api_key || ''}",
    "use_custom_key": ${payload.use_custom_key ? 'True' : 'False'}
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    
    dados = response.json()
    print("Configurações do Gemini sincronizadas com sucesso no Firestore!")
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/users/gemini-config" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/users/gemini-config";

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer SEU_FIREBASE_ID_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${JSON.stringify(payload, null, 2)})
});

const data = await response.json();
console.log(data);`
  }
];

export const EXERCISE_TOPICS = [
  { id: 'gen-problem', label: 'Geração via LLM' },
  { id: 'list-problems', label: 'Listar Desafios' },
  { id: 'submit-code', label: 'Envio de Soluções' },
  { id: 'submissions-history', label: 'Histórico de Envios' },
  { id: 'user-profile', label: 'Perfil do Jogador' },
  { id: 'update-score', label: 'Registro de Fliperama' },
  { id: 'leaderboard', label: 'Placar de Líderes' },
  { id: 'gemini-config', label: 'Chaves do Gemini' }
];
