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
  },
  {
    id: 'tutor-chat',
    tag: 'tutors',
    version: 'v2',
    method: 'POST',
    path: '/api/tutors/chat',
    summary: 'Conversa com um agente de aprendizagem',
    description: 'Envia uma mensagem para um tutor. O prompt fica no servidor. Modos: apc (Tutor APC, LOGAN), python (Tutor Python, CAIO), debug (Debugador, DEBI), practice (Treinador de Exercícios, TITO), exercise_generator (Tutor de Exercícios, MIRA), assistant (assistente flutuante) e exercise (exercício já fixado). focus_mode deixa a resposta em uma etapa. Se use_custom_key for verdadeiro e gemini_api_key vier preenchida, essa chave vale; senão o servidor usa a chave do ambiente. A ação generate, só no modo exercise_generator, pede theme, topic, difficulty, input_type e output_type e devolve o exercício sem a solução de referência. Limite diário responde 429. Sem chave configurada, 503 com tutor_ai_not_configured.',
    authRequired: true,
    params: [
      { name: 'mode', type: 'string', required: true, description: 'apc, python, debug, practice, exercise_generator, assistant ou exercise.' },
      { name: 'message', type: 'string', required: false, description: 'Fala do aluno. Obrigatória no chat. Não é usada para gerar o exercício.' },
      { name: 'action', type: 'string', required: false, description: 'chat (padrão) ou generate. generate só existe na MIRA.' },
      { name: 'conversation_id', type: 'string', required: false, description: 'Conversa já aberta. No chat da MIRA, precisa existir e ter o exercício gerado.' },
      { name: 'surface', type: 'string', required: false, description: 'page ou floating.' },
      { name: 'code', type: 'string', required: false, description: 'Código atual do aluno. O tutor não devolve a solução pronta.' },
      { name: 'focus_mode', type: 'boolean', required: false, description: 'Uma etapa e uma pergunta por resposta.' },
      { name: 'problem_id', type: 'string', required: false, description: 'Exercício da plataforma, quando a conversa está ligada a um problema.' },
      { name: 'theme', type: 'string', required: false, description: 'Tema livre da MIRA, obrigatório em action generate.' },
      { name: 'topic', type: 'string', required: false, description: 'Conteúdo: condicionais, while, for, listas, funcoes e os demais rótulos do gerador.' },
      { name: 'difficulty', type: 'string', required: false, description: 'facil, medio ou dificil.' },
      { name: 'input_type', type: 'string', required: false, description: 'inteiro, decimal, string, varios_numeros, lista ou automatico.' },
      { name: 'output_type', type: 'string', required: false, description: 'numero, texto, booleano, lista ou automatico.' },
      { name: 'gemini_api_key', type: 'string', required: false, description: 'Chave do navegador. Só é usada quando use_custom_key é verdadeiro.' },
      { name: 'use_custom_key', type: 'boolean', required: false, description: 'Se verdadeiro, a chave enviada tem prioridade sobre a do ambiente.' }
    ],
    defaultPayload: {
      mode: 'apc',
      message: 'Como eu começo a pensar neste exercício?',
      surface: 'page',
      focus_mode: false,
      use_custom_key: false,
      gemini_api_key: ''
    },
    pythonSnippet: (url, payload) => `import requests

url = "${url}/api/tutors/chat"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "mode": "${payload.mode || 'apc'}",
    "message": "${payload.message || 'oi'}",
    "surface": "${payload.surface || 'page'}",
    "focus_mode": ${payload.focus_mode ? 'True' : 'False'},
    "use_custom_key": ${payload.use_custom_key ? 'True' : 'False'},
    "gemini_api_key": "${payload.gemini_api_key || ''}"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    dados = response.json()
    print(dados.get("reply"))
    print("Conversa:", dados.get("conversation_id"))
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/tutors/chat" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/tutors/chat";

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
    id: 'tutor-exercises',
    tag: 'tutors',
    version: 'v2',
    method: 'POST',
    path: '/api/tutors/exercises',
    summary: 'Gera um exercício do tutor',
    description: 'Cria um exercício original de APC a partir do conteúdo e da dificuldade. A resposta pública não inclui a solução. O chat da MIRA usa POST /api/tutors/chat com action generate; esta rota permanece para o gerador direto.',
    authRequired: true,
    params: [
      { name: 'topic', type: 'string', required: true, description: 'entrada_saida, variaveis, strings, condicionais, while, for, listas, funcoes ou recursao.' },
      { name: 'difficulty', type: 'string', required: true, description: 'facil, medio ou dificil.' },
      { name: 'gemini_api_key', type: 'string', required: false, description: 'Chave do navegador, usada só com use_custom_key.' },
      { name: 'use_custom_key', type: 'boolean', required: false, description: 'Prioriza a chave enviada.' }
    ],
    defaultPayload: {
      topic: 'condicionais',
      difficulty: 'facil',
      gemini_api_key: '',
      use_custom_key: false
    },
    pythonSnippet: (url, payload) => `import requests

url = "${url}/api/tutors/exercises"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "topic": "${payload.topic || 'condicionais'}",
    "difficulty": "${payload.difficulty || 'facil'}",
    "gemini_api_key": "${payload.gemini_api_key || ''}",
    "use_custom_key": ${payload.use_custom_key ? 'True' : 'False'}
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    dados = response.json()
    print(dados.get("titulo") or dados.get("title"))
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/tutors/exercises" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/tutors/exercises";

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
    id: 'tutor-conversations',
    tag: 'tutors',
    version: 'v2',
    method: 'GET',
    path: '/api/tutors/conversations',
    summary: 'Lista conversas dos tutores',
    description: 'Devolve só os metadados das conversas do usuário autenticado, da mais recente para a mais antiga. As mensagens completas vêm ao abrir uma conversa. Sem a credencial do Firestore no ambiente local, a lista fica na memória deste processo.',
    authRequired: true,
    params: [
      { name: 'include_archived', type: 'boolean', required: false, description: 'Inclui conversas arquivadas. Padrão: false.' },
      { name: 'limit', type: 'integer', required: false, description: 'Quantidade, de 1 a 50. Padrão: 20.' },
      { name: 'before', type: 'string', required: false, description: 'Cursor da página anterior, no formato da data da última mensagem.' }
    ],
    defaultPayload: null,
    pythonSnippet: (url) => `import requests

url = "${url}/api/tutors/conversations"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN"
}

params = {
    "include_archived": False,
    "limit": 20
}

try:
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    for conversa in response.json():
        print(conversa.get("title"), conversa.get("mode"), conversa.get("conversation_id"))
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url) => `curl -X GET "${url}/api/tutors/conversations?include_archived=false&limit=20" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"`,
    jsSnippet: (url) => `const url = "${url}/api/tutors/conversations?include_archived=false&limit=20";

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
    id: 'tutor-conversation-create',
    tag: 'tutors',
    version: 'v2',
    method: 'POST',
    path: '/api/tutors/conversations',
    summary: 'Abre uma conversa de tutor',
    description: 'Cria uma conversa vazia para o modo escolhido. O dono é o uid do token. O cliente não envia o id do usuário.',
    authRequired: true,
    params: [
      { name: 'mode', type: 'string', required: true, description: 'apc, python, debug, practice, exercise_generator, assistant ou exercise.' },
      { name: 'surface', type: 'string', required: false, description: 'page ou floating. Padrão: page.' }
    ],
    defaultPayload: {
      mode: 'python',
      surface: 'page'
    },
    pythonSnippet: (url, payload) => `import requests

url = "${url}/api/tutors/conversations"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "mode": "${payload.mode || 'python'}",
    "surface": "${payload.surface || 'page'}"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    print(response.json().get("conversation_id"))
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X POST "${url}/api/tutors/conversations" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const url = "${url}/api/tutors/conversations";

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
    id: 'tutor-conversation-detail',
    tag: 'tutors',
    version: 'v2',
    method: 'GET',
    path: '/api/tutors/conversations/{conversation_id}',
    summary: 'Abre uma conversa e as mensagens',
    description: 'Carrega título, modo e mensagens de uma conversa do próprio usuário. Troque {conversation_id} pelo id retornado na lista. Conversa de outra pessoa responde 404.',
    authRequired: true,
    params: [
      { name: 'conversation_id', type: 'string', required: true, description: 'Id da conversa, no caminho da URL.' }
    ],
    defaultPayload: null,
    pythonSnippet: (url) => `import requests

conversation_id = "ID_DA_CONVERSA"
url = f"${url}/api/tutors/conversations/{conversation_id}"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN"
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    dados = response.json()
    print(dados.get("title"), len(dados.get("messages") or []))
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url) => `curl -X GET "${url}/api/tutors/conversations/ID_DA_CONVERSA" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN"`,
    jsSnippet: (url) => `const conversationId = "ID_DA_CONVERSA";
const url = "${url}/api/tutors/conversations/" + conversationId;

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
    id: 'tutor-conversation-update',
    tag: 'tutors',
    version: 'v2',
    method: 'PATCH',
    path: '/api/tutors/conversations/{conversation_id}',
    summary: 'Renomeia ou arquiva uma conversa',
    description: 'Altera o título, de até 80 caracteres, ou marca a conversa como arquivada. Não apaga a conversa. Envie ao menos um dos campos.',
    authRequired: true,
    params: [
      { name: 'conversation_id', type: 'string', required: true, description: 'Id da conversa, no caminho da URL.' },
      { name: 'title', type: 'string', required: false, description: 'Novo título, no máximo 80 caracteres.' },
      { name: 'archived', type: 'boolean', required: false, description: 'true arquiva. false devolve a conversa para a lista.' }
    ],
    defaultPayload: {
      title: 'Loop while',
      archived: false
    },
    pythonSnippet: (url, payload) => `import requests

conversation_id = "ID_DA_CONVERSA"
url = f"${url}/api/tutors/conversations/{conversation_id}"

headers = {
    "Authorization": "Bearer SEU_FIREBASE_ID_TOKEN",
    "Content-Type": "application/json"
}

payload = {
    "title": "${payload.title || 'Loop while'}",
    "archived": ${payload.archived ? 'True' : 'False'}
}

try:
    response = requests.patch(url, json=payload, headers=headers)
    response.raise_for_status()
    print(response.json().get("title"))
except requests.exceptions.HTTPError as err:
    print(f"Erro HTTP {response.status_code}: {response.text}")`,
    curlSnippet: (url, payload) => `curl -X PATCH "${url}/api/tutors/conversations/ID_DA_CONVERSA" \\
  -H "Authorization: Bearer SEU_FIREBASE_ID_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`,
    jsSnippet: (url, payload) => `const conversationId = "ID_DA_CONVERSA";
const url = "${url}/api/tutors/conversations/" + conversationId;

const response = await fetch(url, {
  method: 'PATCH',
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
  { id: 'gemini-config', label: 'Chaves do Gemini' },
  { id: 'tutors', label: 'Tutores v2' }
];
