export const API_EXERCISES = {
  'gen-problem': [
    {
      id: 'ex-gen-1',
      title: 'Desafio 1.1: Criar Payload de Geração',
      desc: 'Escreva uma função criar_payload(topic, difficulty) que retorne um dicionário Python contendo as chaves "topic" e "difficulty" com os respectivos valores passados como argumentos.',
      initialCode: 'def criar_payload(topic, difficulty):\n    # Escreva seu codigo aqui\n    return {\n        "topic": topic,\n        "difficulty": difficulty\n    }',
      functionName: 'criar_payload',
      testCases: [
        { input: ['Estruturas', 'medio'], expected: { topic: 'Estruturas', difficulty: 'medio' }, inputStr: '"Estruturas", "medio"', expectedStr: '{"topic": "Estruturas", "difficulty": "medio"}' },
        { input: ['Loops', 'facil'], expected: { topic: 'Loops', difficulty: 'facil' }, inputStr: '"Loops", "facil"', expectedStr: '{"topic": "Loops", "difficulty": "facil"}' },
        { input: ['Recursão', 'dificil'], expected: { topic: 'Recursão', difficulty: 'dificil' }, inputStr: '"Recursão", "dificil"', expectedStr: '{"topic": "Recursão", "difficulty": "dificil"}' }
      ]
    },
    {
      id: 'ex-gen-2',
      title: 'Desafio 1.2: Validar Níveis de Dificuldade',
      desc: 'Crie uma função validar_dificuldade(diff) que retorne True caso a dificuldade fornecida seja "facil", "medio", "dificil" ou "competitivo". Caso contrário, retorne False.',
      initialCode: 'def validar_dificuldade(diff):\n    # Retorne True se diff for uma dificuldade valida, senao False\n    ',
      functionName: 'validar_dificuldade',
      testCases: [
        { input: ['medio'], expected: true, inputStr: '"medio"', expectedStr: 'True' },
        { input: ['iniciante'], expected: false, inputStr: '"iniciante"', expectedStr: 'False' },
        { input: ['competitivo'], expected: true, inputStr: '"competitivo"', expectedStr: 'True' }
      ]
    },
    {
      id: 'ex-gen-3',
      title: 'Desafio 1.3: Concatenação da URL do Endpoint',
      desc: 'Escreva uma função obter_url_gerador(base_url) que receba a URL base do servidor e retorne o caminho completo do endpoint "/api/problems/generate" (garanta que não haja barras duplicadas ou faltando entre a base e o caminho).',
      initialCode: 'def obter_url_gerador(base_url):\n    # Remova barra no final de base_url se houver, e adicione o caminho correto\n    ',
      functionName: 'obter_url_gerador',
      testCases: [
        { input: ['http://localhost:8000'], expected: 'http://localhost:8000/api/problems/generate', inputStr: '"http://localhost:8000"', expectedStr: '"http://localhost:8000/api/problems/generate"' },
        { input: ['https://api.apc.com/'], expected: 'https://api.apc.com/api/problems/generate', inputStr: '"https://api.apc.com/"', expectedStr: '"https://api.apc.com/api/problems/generate"' },
        { input: ['http://127.0.0.1:8000'], expected: 'http://127.0.0.1:8000/api/problems/generate', inputStr: '"http://127.0.0.1:8000"', expectedStr: '"http://127.0.0.1:8000/api/problems/generate"' }
      ]
    },
    {
      id: 'ex-gen-4',
      title: 'Desafio 1.4: Inserção de API Key Customizada',
      desc: 'Escreva uma função payload_customizado(topic, key) que retorne o dicionário payload completo contendo as chaves "topic": topic, "difficulty": "medio", "gemini_api_key": key e "use_custom_key": True.',
      initialCode: 'def payload_customizado(topic, key):\n    # Escreva seu codigo aqui\n    ',
      functionName: 'payload_customizado',
      testCases: [
        { input: ['Listas', 'AIza123'], expected: { topic: 'Listas', difficulty: 'medio', gemini_api_key: 'AIza123', use_custom_key: true }, inputStr: '"Listas", "AIza123"', expectedStr: '{"topic": "Listas", "difficulty": "medio", "gemini_api_key": "AIza123", "use_custom_key": True}' },
        { input: ['Matrizes', 'AIza456'], expected: { topic: 'Matrizes', difficulty: 'medio', gemini_api_key: 'AIza456', use_custom_key: true }, inputStr: '"Matrizes", "AIza456"', expectedStr: '{"topic": "Matrizes", "difficulty": "medio", "gemini_api_key": "AIza456", "use_custom_key": True}' },
        { input: ['Dicionários', ''], expected: { topic: 'Dicionários', difficulty: 'medio', gemini_api_key: '', use_custom_key: true }, inputStr: '"Dicionários", ""', expectedStr: '{"topic": "Dicionários", "difficulty": "medio", "gemini_api_key": "", "use_custom_key": True}' }
      ]
    },
    {
      id: 'ex-gen-5',
      title: 'Desafio 1.5: Validar Chaves do Payload',
      desc: 'Escreva uma função is_valid_payload(payload) que receba um dicionário payload e retorne True se as chaves "topic" e "difficulty" estiverem presentes no dicionário. Caso contrário, retorne False.',
      initialCode: 'def is_valid_payload(payload):\n    # Valide se as chaves estao presentes\n    ',
      functionName: 'is_valid_payload',
      testCases: [
        { input: [{ topic: 'Arrays', difficulty: 'facil' }], expected: true, inputStr: '{"topic": "Arrays", "difficulty": "facil"}', expectedStr: 'True' },
        { input: [{ topic: 'Arrays' }], expected: false, inputStr: '{"topic": "Arrays"}', expectedStr: 'False' },
        { input: [{ difficulty: 'medio' }], expected: false, inputStr: '{"difficulty": "medio"}', expectedStr: 'False' }
      ]
    }
  ],
  'list-problems': [
    {
      id: 'ex-list-1',
      title: 'Desafio 2.1: Contar Total de Problemas',
      desc: 'Crie uma função contar_problemas(lista) que retorne a quantidade inteira de itens presentes na lista de desafios recebida.',
      initialCode: 'def contar_problemas(lista):\n    # Retorne a quantidade de itens na lista\n    ',
      functionName: 'contar_problemas',
      testCases: [
        { input: [[{ id: 1 }, { id: 2 }]], expected: 2, inputStr: '[{"id": 1}, {"id": 2}]', expectedStr: '2' },
        { input: [[]], expected: 0, inputStr: '[]', expectedStr: '0' },
        { input: [[{ id: 1 }]], expected: 1, inputStr: '[{"id": 1}]', expectedStr: '1' }
      ]
    },
    {
      id: 'ex-list-2',
      title: 'Desafio 2.2: Filtrar por Dificuldade',
      desc: 'Crie uma função filtrar_por_dificuldade(lista, diff) que receba uma lista de dicionários de problemas e retorne uma nova lista contendo apenas os problemas cujo campo "difficulty" seja exatamente igual ao argumento diff.',
      initialCode: 'def filtrar_por_dificuldade(lista, diff):\n    # Filtre a lista pelo campo "difficulty"\n    ',
      functionName: 'filtrar_por_dificuldade',
      testCases: [
        { input: [[{ title: 'A', difficulty: 'facil' }, { title: 'B', difficulty: 'medio' }], 'facil'], expected: [{ title: 'A', difficulty: 'facil' }], inputStr: '[{"title": "A", "difficulty": "facil"}, {"title": "B", "difficulty": "medio"}], "facil"', expectedStr: '[{"title": "A", "difficulty": "facil"}]' },
        { input: [[{ title: 'A', difficulty: 'facil' }, { title: 'B', difficulty: 'medio' }], 'dificil'], expected: [], inputStr: '[{"title": "A", "difficulty": "facil"}, {"title": "B", "difficulty": "medio"}], "dificil"', expectedStr: '[]' },
        { input: [[{ title: 'A', difficulty: 'dificil' }, { title: 'B', difficulty: 'dificil' }], 'dificil'], expected: [{ title: 'A', difficulty: 'dificil' }, { title: 'B', difficulty: 'dificil' }], inputStr: '[{"title": "A", "difficulty": "dificil"}, {"title": "B", "difficulty": "dificil"}], "dificil"', expectedStr: '[{"title": "A", ...}, {"title": "B", ...}]' }
      ]
    },
    {
      id: 'ex-list-3',
      title: 'Desafio 2.3: Extrair IDs Únicos',
      desc: 'Crie uma função extrair_ids(lista) que extraia o campo "problem_id" de cada dicionário da lista de problemas e os retorne em uma nova lista.',
      initialCode: 'def extrair_ids(lista):\n    # Extraia problem_id de cada dicionario na lista\n    ',
      functionName: 'extrair_ids',
      testCases: [
        { input: [[{ problem_id: 'p1' }, { problem_id: 'p2' }]], expected: ['p1', 'p2'], inputStr: '[{"problem_id": "p1"}, {"problem_id": "p2"}]', expectedStr: '["p1", "p2"]' },
        { input: [[]], expected: [], inputStr: '[]', expectedStr: '[]' },
        { input: [[{ problem_id: 'ex-1' }]], expected: ['ex-1'], inputStr: '[{"problem_id": "ex-1"}]', expectedStr: '["ex-1"]' }
      ]
    },
    {
      id: 'ex-list-4',
      title: 'Desafio 2.4: Formatar Títulos Separados por Vírgula',
      desc: 'Escreva uma função obter_titulos(lista) que retorne uma única string concatenando os títulos ("title") de todos os problemas da lista, separados por vírgula e espaço (ex: "Soma, Subtração"). Se a lista for vazia, retorne string vazia "".',
      initialCode: 'def obter_titulos(lista):\n    # Concatene todos os campos "title" separados por ", "\n    ',
      functionName: 'obter_titulos',
      testCases: [
        { input: [[{ title: 'Loops' }, { title: 'Arrays' }]], expected: 'Loops, Arrays', inputStr: '[{"title": "Loops"}, {"title": "Arrays"}]', expectedStr: '"Loops, Arrays"' },
        { input: [[]], expected: '', inputStr: '[]', expectedStr: '""' },
        { input: [[{ title: 'Soma' }]], expected: 'Soma', inputStr: '[{"title": "Soma"}]', expectedStr: '"Soma"' }
      ]
    },
    {
      id: 'ex-list-5',
      title: 'Desafio 2.5: Buscar Título por ID',
      desc: 'Escreva uma função buscar_problema(lista, prob_id) que vasculhe a lista de problemas e retorne o valor do campo "title" correspondente ao "problem_id" passado. Se não encontrar, retorne "Não encontrado".',
      initialCode: 'def buscar_problema(lista, prob_id):\n    # Busque o problema pelo id e retorne seu titulo\n    ',
      functionName: 'buscar_problema',
      testCases: [
        { input: [[{ problem_id: '1', title: 'Loops' }, { problem_id: '2', title: 'Vetores' }], '2'], expected: 'Vetores', inputStr: '[{"problem_id": "1", "title": "Loops"}, ...], "2"', expectedStr: '"Vetores"' },
        { input: [[{ problem_id: '1', title: 'Loops' }], '3'], expected: 'Não encontrado', inputStr: '[{"problem_id": "1", "title": "Loops"}], "3"', expectedStr: '"Não encontrado"' },
        { input: [[], '1'], expected: 'Não encontrado', inputStr: '[], "1"', expectedStr: '"Não encontrado"' }
      ]
    }
  ],
  'submit-code': [
    {
      id: 'ex-sub-1',
      title: 'Desafio 3.1: Validar Limite de Caracteres',
      desc: 'Escreva uma função validar_limite_caracteres(code) que retorne True caso a string "code" tenha menos ou exatamente 10000 caracteres, senão False.',
      initialCode: 'def validar_limite_caracteres(code):\n    # Valide o tamanho do codigo\n    ',
      functionName: 'validar_limite_caracteres',
      testCases: [
        { input: ['print("Olá")'], expected: true, inputStr: '"print(\\"Olá\\")"', expectedStr: 'True' },
        { input: ['x' * 10001], expected: false, inputStr: '"(string com 10001 caracteres)"', expectedStr: 'False' },
        { input: ['x' * 10000], expected: true, inputStr: '"(string com 10000 caracteres)"', expectedStr: 'True' }
      ]
    },
    {
      id: 'ex-sub-2',
      title: 'Desafio 3.2: Montar Payload de Envio',
      desc: 'Escreva uma função montar_submissao(prob_id, code) que retorne um dicionário contendo as chaves obrigatórias "problem_id" e "code" com seus respectivos valores.',
      initialCode: 'def montar_submissao(prob_id, code):\n    # Monte o dicionario de submissao\n    ',
      functionName: 'montar_submissao',
      testCases: [
        { input: ['p-99', 'def soma(): pass'], expected: { problem_id: 'p-99', code: 'def soma(): pass' }, inputStr: '"p-99", "def soma(): pass"', expectedStr: '{"problem_id": "p-99", "code": "def soma(): pass"}' },
        { input: ['ex-2', 'print()'], expected: { problem_id: 'ex-2', code: 'print()' }, inputStr: '"ex-2", "print()"', expectedStr: '{"problem_id": "ex-2", "code": "print()"}' },
        { input: ['', ''], expected: { problem_id: '', code: '' }, inputStr: '"", ""', expectedStr: '{"problem_id": "", "code": ""}' }
      ]
    },
    {
      id: 'ex-sub-3',
      title: 'Desafio 3.3: Verificar Sucesso de Compilação',
      desc: 'Escreva uma função verificar_aprovacao(resultado) que receba o dicionário de resposta da API de submissão e retorne True se a flag booleana "all_passed" for True, caso contrário retorne False.',
      initialCode: 'def verificar_aprovacao(resultado):\n    # Retorne se all_passed e verdadeiro\n    ',
      functionName: 'verificar_aprovacao',
      testCases: [
        { input: [{ all_passed: true, score: 100 }], expected: true, inputStr: '{"all_passed": True, "score": 100}', expectedStr: 'True' },
        { input: [{ all_passed: false, score: 60 }], expected: false, inputStr: '{"all_passed": False, "score": 60}', expectedStr: 'False' },
        { input: [{ score: 0 }], expected: false, inputStr: '{"score": 0}', expectedStr: 'False' }
      ]
    },
    {
      id: 'ex-sub-4',
      title: 'Desafio 3.4: Média de Score de Tentativas',
      desc: 'Escreva uma função obter_score_medio(submissoes) que receba uma lista de dicionários de tentativas (onde cada uma tem a chave "score" de 0 a 100) e calcule a média aritmética inteira das notas. Se a lista for vazia, retorne 0.',
      initialCode: 'def obter_score_medio(submissoes):\n    # Calcule a media inteira dos scores\n    ',
      functionName: 'obter_score_medio',
      testCases: [
        { input: [[{ score: 80 }, { score: 90 }, { score: 70 }]], expected: 80, inputStr: '[{"score": 80}, {"score": 90}, {"score": 70}]', expectedStr: '80' },
        { input: [[]], expected: 0, inputStr: '[]', expectedStr: '0' },
        { input: [[{ score: 50 }, { score: 100 }]], expected: 75, inputStr: '[{"score": 50}, {"score": 100}]', expectedStr: '75' }
      ]
    },
    {
      id: 'ex-sub-5',
      title: 'Desafio 3.5: Formatar Resultado do Corretor',
      desc: 'Crie uma função formatar_resultado(res) que receba o dicionário de resposta da API de submissão e retorne a string "Sucesso" se "all_passed" for True. Caso contrário, retorne "Falha (X%)", onde X é o valor correspondente ao "score" obtido.',
      initialCode: 'def formatar_resultado(res):\n    # Formate a string de retorno conforme all_passed e score\n    ',
      functionName: 'formatar_resultado',
      testCases: [
        { input: [{ all_passed: true, score: 100 }], expected: 'Sucesso', inputStr: '{"all_passed": True, "score": 100}', expectedStr: '"Sucesso"' },
        { input: [{ all_passed: false, score: 80 }], expected: 'Falha (80%)', inputStr: '{"all_passed": False, "score": 80}', expectedStr: '"Falha (80%)"' },
        { input: [{ all_passed: false, score: 0 }], expected: 'Falha (0%)', inputStr: '{"all_passed": False, "score": 0}', expectedStr: '"Falha (0%)"' }
      ]
    }
  ],
  'submissions-history': [
    {
      id: 'ex-hist-1',
      title: 'Desafio 4.1: Limitar Histórico Recente',
      desc: 'Crie uma função obter_historico_recente(logs, limite) que receba uma lista de logs e retorne apenas os primeiros "limite" itens dessa lista.',
      initialCode: 'def obter_historico_recente(logs, limite):\n    # Retorne a fatia correspondente ao limite\n    ',
      functionName: 'obter_historico_recente',
      testCases: [
        { input: [[1, 2, 3, 4], 2], expected: [1, 2], inputStr: '[1, 2, 3, 4], 2', expectedStr: '[1, 2]' },
        { input: [[1, 2], 5], expected: [1, 2], inputStr: '[1, 2], 5', expectedStr: '[1, 2]' },
        { input: [[], 3], expected: [], inputStr: '[], 3', expectedStr: '[]' }
      ]
    },
    {
      id: 'ex-hist-2',
      title: 'Desafio 4.2: Filtrar Envios por Usuário',
      desc: 'Escreva uma função filtrar_por_usuario(logs, email) que receba uma lista de logs de submissões e retorne uma nova lista contendo apenas as tentativas enviadas pelo usuário com o campo "email" correspondente.',
      initialCode: 'def filtrar_por_usuario(logs, email):\n    # Filtre os logs pelo email correspondente\n    ',
      functionName: 'filtrar_por_usuario',
      testCases: [
        { input: [[{ email: 'a@gmail.com', score: 100 }, { email: 'b@gmail.com', score: 90 }], 'a@gmail.com'], expected: [{ email: 'a@gmail.com', score: 100 }], inputStr: '[{"email": "a@gmail.com", ...}, {"email": "b@gmail.com", ...}], "a@gmail.com"', expectedStr: '[{"email": "a@gmail.com", "score": 100}]' },
        { input: [[{ email: 'a@gmail.com', score: 100 }], 'c@gmail.com'], expected: [], inputStr: '[{"email": "a@gmail.com", ...}], "c@gmail.com"', expectedStr: '[]' },
        { input: [[], 'a@gmail.com'], expected: [], inputStr: '[], "a@gmail.com"', expectedStr: '[]' }
      ]
    },
    {
      id: 'ex-hist-3',
      title: 'Desafio 4.3: Contar Submissões Perfeitas',
      desc: 'Escreva uma função contar_sucessos(logs) que receba os logs e retorne a contagem de submissões que atingiram uma pontuação ("score") exatamente igual a 100.',
      initialCode: 'def contar_sucessos(logs):\n    # Conte quantas submissoes tem score == 100\n    ',
      functionName: 'contar_sucessos',
      testCases: [
        { input: [[{ score: 100 }, { score: 90 }, { score: 100 }]], expected: 2, inputStr: '[{"score": 100}, {"score": 90}, {"score": 100}]', expectedStr: '2' },
        { input: [[{ score: 50 }]], expected: 0, inputStr: '[{"score": 50}]', expectedStr: '0' },
        { input: [[]], expected: 0, inputStr: '[]', expectedStr: '0' }
      ]
    },
    {
      id: 'ex-hist-4',
      title: 'Desafio 4.4: Encontrar Maior Placar',
      desc: 'Escreva uma função maior_pontuacao(logs) que retorne o maior valor numérico de "score" encontrado na lista de logs. Se a lista for vazia, retorne 0.',
      initialCode: 'def maior_pontuacao(logs):\n    # Retorne a nota score maxima na lista de logs\n    ',
      functionName: 'maior_pontuacao',
      testCases: [
        { input: [[{ score: 40 }, { score: 95 }, { score: 70 }]], expected: 95, inputStr: '[{"score": 40}, {"score": 95}, {"score": 70}]', expectedStr: '95' },
        { input: [[]], expected: 0, inputStr: '[]', expectedStr: '0' },
        { input: [[{ score: 100 }]], expected: 100, inputStr: '[{"score": 100}]', expectedStr: '100' }
      ]
    },
    {
      id: 'ex-hist-5',
      title: 'Desafio 4.5: Resumir Registro de Histórico',
      desc: 'Escreva uma função resumir_tentativa(sub) que receba um dicionário descrevendo uma submissão e retorne a string formatada no padrão "Nome - Titulo: Score%", onde os respectivos valores devem ser extraídos de "name", "problem_title" e "score" (ex: "Alice - Vetores: 100%").',
      initialCode: 'def resumir_tentativa(sub):\n    # Formate a string com os dados da submissao\n    ',
      functionName: 'resumir_tentativa',
      testCases: [
        { input: [{ name: 'Alice', problem_title: 'Soma', score: 100 }], expected: 'Alice - Soma: 100%', inputStr: '{"name": "Alice", "problem_title": "Soma", "score": 100}', expectedStr: '"Alice - Soma: 100%"' },
        { input: [{ name: 'Bob', problem_title: 'Loops', score: 50 }], expected: 'Bob - Loops: 50%', inputStr: '{"name": "Bob", "problem_title": "Loops", "score": 50}', expectedStr: '"Bob - Loops: 50%"' },
        { input: [{ name: 'Gael', problem_title: 'Arrays', score: 0 }], expected: 'Gael - Arrays: 0%', inputStr: '{"name": "Gael", "problem_title": "Arrays", "score": 0}', expectedStr: '"Gael - Arrays: 0%"' }
      ]
    }
  ],
  'user-profile': [
    {
      id: 'ex-prof-1',
      title: 'Desafio 5.1: Carregar Recorde de Fliperama',
      desc: 'Crie uma função extrair_recorde(perfil, game) que receba o dicionário "perfil" e retorne a pontuação alta (highscore) do jogo indicado, que fica localizado no dicionário interno sob a chave "games". Se o jogo não existir ou não houver recorde, retorne 0.',
      initialCode: 'def extrair_recorde(perfil, game):\n    # Retorne o score do game de dentro do dicionario "games"\n    ',
      functionName: 'extrair_recorde',
      testCases: [
        { input: [{ games: { snake: 250, doodle: 180 } }, 'snake'], expected: 250, inputStr: '{"games": {"snake": 250, "doodle": 180}}, "snake"', expectedStr: '250' },
        { input: [{ games: { snake: 250 } }, 'invaders'], expected: 0, inputStr: '{"games": {"snake": 250}}, "invaders"', expectedStr: '0' },
        { input: [{ games: {} }, 'snake'], expected: 0, inputStr: '{"games": {}}, "snake"', expectedStr: '0' }
      ]
    },
    {
      id: 'ex-prof-2',
      title: 'Desafio 5.2: Somar Conquistas Totais do Fliperama',
      desc: 'Escreva uma função somar_pontos_perfil(perfil) que some todos os pontos do perfil. A pontuação é igual a "coding_points" (desafios de código) somada a todos os recordes individuais de jogos presentes no dicionário de "games".',
      initialCode: 'def somar_pontos_perfil(perfil):\n    # Some coding_points aos valores de cada jogo em "games"\n    ',
      functionName: 'somar_pontos_perfil',
      testCases: [
        { input: [{ coding_points: 500, games: { snake: 100, doodle: 200 } }], expected: 800, inputStr: '{"coding_points": 500, "games": {"snake": 100, "doodle": 200}}', expectedStr: '800' },
        { input: [{ coding_points: 300, games: {} }], expected: 300, inputStr: '{"coding_points": 300, "games": {}}', expectedStr: '300' },
        { input: [{ coding_points: 0, games: { invaders: 50 } }], expected: 50, inputStr: '{"coding_points": 0, "games": {"invaders": 50}}', expectedStr: '50' }
      ]
    },
    {
      id: 'ex-prof-3',
      title: 'Desafio 5.3: Validar Domínio do Email do Jogador',
      desc: 'Escreva uma função validar_email(perfil) que receba o perfil do jogador e retorne True se seu "email" cadastrado pertencer ao domínio do Google, ou seja, terminar com "@gmail.com". Caso contrário, retorne False.',
      initialCode: 'def validar_email(perfil):\n    # Valide se o email termina com @gmail.com\n    ',
      functionName: 'validar_email',
      testCases: [
        { input: [{ email: 'player@gmail.com' }], expected: true, inputStr: '{"email": "player@gmail.com"}', expectedStr: 'True' },
        { input: [{ email: 'dev@outlook.com' }], expected: false, inputStr: '{"email": "dev@outlook.com"}', expectedStr: 'False' },
        { input: [{ email: 'google@gmail.com.br' }], expected: false, inputStr: '{"email": "google@gmail.com.br"}', expectedStr: 'False' }
      ]
    },
    {
      id: 'ex-prof-4',
      title: 'Desafio 5.4: Calcular Categoria de Nível',
      desc: 'Escreva uma função obter_nivel_xp(total_score) que receba o score total geral do perfil e retorne a string "Iniciante" se XP for menor que 500, "Pro" se for menor que 1500, ou "Lenda" caso contrário.',
      initialCode: 'def obter_nivel_xp(total_score):\n    # Retorne a categoria do nivel do jogador\n    ',
      functionName: 'obter_nivel_xp',
      testCases: [
        { input: [450], expected: 'Iniciante', inputStr: '450', expectedStr: '"Iniciante"' },
        { input: [1200], expected: 'Pro', inputStr: '1200', expectedStr: '"Pro"' },
        { input: [2000], expected: 'Lenda', inputStr: '2000', expectedStr: '"Lenda"' }
      ]
    },
    {
      id: 'ex-prof-5',
      title: 'Desafio 5.5: Obter Resumo Consolidado',
      desc: 'Escreva uma função resumir_perfil(perfil) que retorne uma string descrevendo o perfil no formato "Jogador (Email) - Score: X pts" extraídos das chaves "name", "email" e "total_score" (ex: "Alex (alex@gmail.com) - Score: 850 pts").',
      initialCode: 'def resumir_perfil(perfil):\n    # Formate a string descritiva do perfil\n    ',
      functionName: 'resumir_perfil',
      testCases: [
        { input: [{ name: 'Alex', email: 'alex@gmail.com', total_score: 850 }], expected: 'Alex (alex@gmail.com) - Score: 850 pts', inputStr: '{"name": "Alex", "email": "alex@gmail.com", "total_score": 850}', expectedStr: '"Alex (alex@gmail.com) - Score: 850 pts"' },
        { input: [{ name: 'Bia', email: 'bia@hotmail.com', total_score: 0 }], expected: 'Bia (bia@hotmail.com) - Score: 0 pts', inputStr: '{"name": "Bia", "email": "bia@hotmail.com", "total_score": 0}', expectedStr: '"Bia (bia@hotmail.com) - Score: 0 pts"' },
        { input: [{ name: 'Dani', email: 'dani@gmail.com', total_score: 1500 }], expected: 'Dani (dani@gmail.com) - Score: 1500 pts', inputStr: '{"name": "Dani", "email": "dani@gmail.com", "total_score": 1500}', expectedStr: '"Dani (dani@gmail.com) - Score: 1500 pts"' }
      ]
    }
  ],
  'update-score': [
    {
      id: 'ex-score-1',
      title: 'Desafio 6.1: Montar JSON de Sincronização',
      desc: 'Escreva uma função criar_payload_score(game, score) que monte o dicionário JSON payload adequado contendo as chaves "game" e "score" com os respectivos argumentos fornecidos.',
      initialCode: 'def criar_payload_score(game, score):\n    # Monte o payload do recorde do jogo\n    ',
      functionName: 'criar_payload_score',
      testCases: [
        { input: ['snake', 180], expected: { game: 'snake', score: 180 }, inputStr: '"snake", 180', expectedStr: '{"game": "snake", "score": 180}' },
        { input: ['doodle', 450], expected: { game: 'doodle', score: 450 }, inputStr: '"doodle", 450', expectedStr: '{"game": "doodle", "score": 450}' },
        { input: ['invaders', 0], expected: { game: 'invaders', score: 0 }, inputStr: '"invaders", 0', expectedStr: '{"game": "invaders", "score": 0}' }
      ]
    },
    {
      id: 'ex-score-2',
      title: 'Desafio 6.2: Validar Mini-game Homologado',
      desc: 'Escreva uma função validar_game(game) que retorne True caso o mini-game passado seja exatamente "snake", "doodle" ou "invaders". Senão, retorne False.',
      initialCode: 'def validar_game(game):\n    # Verifique se e um jogo homologado\n    ',
      functionName: 'validar_game',
      testCases: [
        { input: ['snake'], expected: true, inputStr: '"snake"', expectedStr: 'True' },
        { input: ['tetris'], expected: false, inputStr: '"tetris"', expectedStr: 'False' },
        { input: ['invaders'], expected: true, inputStr: '"invaders"', expectedStr: 'True' }
      ]
    },
    {
      id: 'ex-score-3',
      title: 'Desafio 6.3: Comparar e Atualizar Recorde',
      desc: 'Crie uma função comparar_recorde(novo_score, recorde_atual) que compare a pontuação da partida recente com o recorde atual do jogador e retorne o maior valor absoluto encontrado.',
      initialCode: 'def comparar_recorde(novo_score, recorde_atual):\n    # Retorne o maior valor entre eles\n    ',
      functionName: 'comparar_recorde',
      testCases: [
        { input: [250, 180], expected: 250, inputStr: '250, 180', expectedStr: '250' },
        { input: [120, 300], expected: 300, inputStr: '120, 300', expectedStr: '300' },
        { input: [0, 0], expected: 0, inputStr: '0, 0', expectedStr: '0' }
      ]
    },
    {
      id: 'ex-score-4',
      title: 'Desafio 6.4: Mensagem de Nova Conquista',
      desc: 'Escreva uma função obter_mensagem_highscore(is_new) que receba um booleano e retorne a string "Novo recorde!" se True, senão retorne "Tente novamente!".',
      initialCode: 'def obter_mensagem_highscore(is_new):\n    # Retorne a frase conforme a flag booleana\n    ',
      functionName: 'obter_mensagem_highscore',
      testCases: [
        { input: [true], expected: 'Novo recorde!', inputStr: 'True', expectedStr: '"Novo recorde!"' },
        { input: [false], expected: 'Tente novamente!', inputStr: 'False', expectedStr: '"Tente novamente!"' }
      ]
    },
    {
      id: 'ex-score-5',
      title: 'Desafio 6.5: Calcular Placar Incremental Esperado',
      desc: 'Crie uma função score_total_esperado(pontos_atuais, novo_score, recorde_atual) que calcule a nova pontuação geral do perfil do jogador. Se "novo_score" for maior que o "recorde_atual", o saldo de pontuação aumenta pela diferença obtida (ex: se tinha 500, o recorde era 100 e fez 150, ganha +50 totalizando 550). Caso contrário, a pontuação permanece igual.',
      initialCode: 'def score_total_esperado(pontos_atuais, novo_score, recorde_atual):\n    # Calcule a pontuacao geral considerando a quebra de recorde\n    ',
      functionName: 'score_total_esperado',
      testCases: [
        { input: [500, 150, 100], expected: 550, inputStr: '500, 150, 100', expectedStr: '550' },
        { input: [400, 80, 100], expected: 400, inputStr: '400, 80, 100', expectedStr: '400' },
        { input: [300, 200, 200], expected: 300, inputStr: '300, 200, 200', expectedStr: '300' }
      ]
    }
  ],
  'leaderboard': [
    {
      id: 'ex-lead-1',
      title: 'Desafio 7.1: Carregar Líder do Placar',
      desc: 'Escreva uma função obter_top_1(leaderboard) que vasculhe a lista de jogadores classificados e retorne a chave "name" do primeiro jogador. Se a lista for vazia, retorne a string "Vazio".',
      initialCode: 'def obter_top_1(leaderboard):\n    # Retorne o nome do primeiro colocado do ranking\n    ',
      functionName: 'obter_top_1',
      testCases: [
        { input: [[{ name: 'Ana', total_score: 900 }, { name: 'Bob', total_score: 800 }]], expected: 'Ana', inputStr: '[{"name": "Ana", "total_score": 900}, ...]', expectedStr: '"Ana"' },
        { input: [[]], expected: 'Vazio', inputStr: '[]', expectedStr: '"Vazio"' },
        { input: [[{ name: 'Caio', total_score: 50 }]], expected: 'Caio', inputStr: '[{"name": "Caio"}]', expectedStr: '"Caio"' }
      ]
    },
    {
      id: 'ex-lead-2',
      title: 'Desafio 7.2: Ordenação Descrescente de Placar',
      desc: 'Crie uma função ordenar_leaderboard(jogadores) que ordene os dicionários de jogadores na lista pela chave "total_score" em ordem decrescente (do maior pontuador ao menor) e retorne a lista ordenada.',
      initialCode: 'def ordenar_leaderboard(jogadores):\n    # Ordene a lista em ordem decrescente com base na pontuacao total_score\n    ',
      functionName: 'ordenar_leaderboard',
      testCases: [
        { input: [[{ name: 'A', total_score: 10 }, { name: 'B', total_score: 50 }]], expected: [{ name: 'B', total_score: 50 }, { name: 'A', total_score: 10 }], inputStr: '[{"name": "A", "total_score": 10}, {"name": "B", "total_score": 50}]', expectedStr: '[{"name": "B", "total_score": 50}, {"name": "A", "total_score": 10}]' },
        { input: [[]], expected: [], inputStr: '[]', expectedStr: '[]' }
      ]
    },
    {
      id: 'ex-lead-3',
      title: 'Desafio 7.3: Buscar Classificação de Usuário',
      desc: 'Crie uma função buscar_posicao(leaderboard, email) que receba a lista de líderes ordenada e procure pelo email correspondente. Retorne a classificação numérica (1 para 1º lugar, 2 para 2º, etc.). Se não encontrar, retorne 0.',
      initialCode: 'def buscar_posicao(leaderboard, email):\n    # Encontre a posicao do jogador na lista com base no email\n    ',
      functionName: 'buscar_posicao',
      testCases: [
        { input: [[{ email: 'a@gmail.com' }, { email: 'b@gmail.com' }], 'b@gmail.com'], expected: 2, inputStr: '[{"email": "a@gmail.com"}, {"email": "b@gmail.com"}], "b@gmail.com"', expectedStr: '2' },
        { input: [[{ email: 'a@gmail.com' }], 'c@gmail.com'], expected: 0, inputStr: '[{"email": "a@gmail.com"}], "c@gmail.com"', expectedStr: '0' },
        { input: [[], 'a@gmail.com'], expected: 0, inputStr: '[], "a@gmail.com"', expectedStr: '0' }
      ]
    },
    {
      id: 'ex-lead-4',
      title: 'Desafio 7.4: Pontuação Média do Placar',
      desc: 'Escreva uma função pontuacao_media_lideres(leaderboard) que retorne a média aritmética inteira do total_score obtido pelos líderes no ranking global. Se estiver vazio, retorne 0.',
      initialCode: 'def pontuacao_media_lideres(leaderboard):\n    # Calcule a media inteira de total_score do ranking\n    ',
      functionName: 'pontuacao_media_lideres',
      testCases: [
        { input: [[{ total_score: 1000 }, { total_score: 2000 }]], expected: 1500, inputStr: '[{"total_score": 1000}, {"total_score": 2000}]', expectedStr: '1500' },
        { input: [[]], expected: 0, inputStr: '[]', expectedStr: '0' },
        { input: [[{ total_score: 500 }]], expected: 500, inputStr: '[{"total_score": 500}]', expectedStr: '500' }
      ]
    },
    {
      id: 'ex-lead-5',
      title: 'Desafio 7.5: Extrair Nome dos Líderes',
      desc: 'Crie uma função obter_nomes_lideres(leaderboard) que extraia o campo "name" de cada jogador no placar de líderes e retorne uma lista contendo todos eles.',
      initialCode: 'def obter_nomes_lideres(leaderboard):\n    # Extraia os nomes dos lideres para uma lista\n    ',
      functionName: 'obter_nomes_lideres',
      testCases: [
        { input: [[{ name: 'Ana' }, { name: 'Bia' }]], expected: ['Ana', 'Bia'], inputStr: '[{"name": "Ana"}, {"name": "Bia"}]', expectedStr: '["Ana", "Bia"]' },
        { input: [[]], expected: [], inputStr: '[]', expectedStr: '[]' },
        { input: [[{ name: 'Caio' }]], expected: ['Caio'], inputStr: '[{"name": "Caio"}]', expectedStr: '["Caio"]' }
      ]
    }
  ],
  'gemini-config': [
    {
      id: 'ex-gem-1',
      title: 'Desafio 8.1: Mascarar Chave Privada',
      desc: 'Escreva uma função mascarar_chave(key) que oculte todos os caracteres da chave geradora secreta retornando os 6 primeiros seguidos por "..." (ex: se for "AIzaSySecretKey", retorna "AIzaSy..."). Se a chave for vazia ou menor que 6 caracteres, retorne a própria chave.',
      initialCode: 'def mascarar_chave(key):\n    # Mascare a chave secreta mantendo apenas os 6 primeiros caracteres\n    ',
      functionName: 'mascarar_chave',
      testCases: [
        { input: ['AIzaSySecretKey'], expected: 'AIzaSy...', inputStr: '"AIzaSySecretKey"', expectedStr: '"AIzaSy..."' },
        { input: ['AIzaSy'], expected: 'AIzaSy', inputStr: '"AIzaSy"', expectedStr: '"AIzaSy"' },
        { input: ['AIza'], expected: 'AIza', inputStr: '"AIza"', expectedStr: '"AIza"' }
      ]
    },
    {
      id: 'ex-gem-2',
      title: 'Desafio 8.2: Montar JSON de Configuração',
      desc: 'Escreva uma função criar_config_gemini(key, active) que monte o dicionário payload adequado contendo a chave de criptografia secreta "gemini_api_key" e a flag de validação "use_custom_key".',
      initialCode: 'def criar_config_gemini(key, active):\n    # Monte o dicionario de configuracao do Gemini\n    ',
      functionName: 'criar_config_gemini',
      testCases: [
        { input: ['AIza123', true], expected: { gemini_api_key: 'AIza123', use_custom_key: true }, inputStr: '"AIza123", True', expectedStr: '{"gemini_api_key": "AIza123", "use_custom_key": True}' },
        { input: ['AIza456', false], expected: { gemini_api_key: 'AIza456', use_custom_key: false }, inputStr: '"AIza456", False', expectedStr: '{"gemini_api_key": "AIza456", "use_custom_key": False}' }
      ]
    },
    {
      id: 'ex-gem-3',
      title: 'Desafio 8.3: Validar API Key do Gemini',
      desc: 'Crie uma função validar_chave_gemini(key) que retorne True se a string da chave key iniciar exatamente com os caracteres "AIzaSy", que é a assinatura padrão do Google Gemini API Key. Senão, retorne False.',
      initialCode: 'def validar_chave_gemini(key):\n    # Valide a assinatura da chave secreta\n    ',
      functionName: 'validar_chave_gemini',
      testCases: [
        { input: ['AIzaSySecret123'], expected: true, inputStr: '"AIzaSySecret123"', expectedStr: 'True' },
        { input: ['AIzaSecret123'], expected: false, inputStr: '"AIzaSecret123"', expectedStr: 'False' },
        { input: [''], expected: false, inputStr: '""', expectedStr: 'False' }
      ]
    },
    {
      id: 'ex-gem-4',
      title: 'Desafio 8.4: Obter Preferência Customizada',
      desc: 'Escreva uma função preferencia_customizada(config) que receba o dicionário de configurações Gemini e retorne o valor booleano da chave "use_custom_key". Se a chave não existir, retorne False.',
      initialCode: 'def preferencia_customizada(config):\n    # Retorne o valor correspondente ao uso de chave customizada\n    ',
      functionName: 'preferencia_customizada',
      testCases: [
        { input: [{ gemini_api_key: 'AIzaSy', use_custom_key: true }], expected: true, inputStr: '{"use_custom_key": True}', expectedStr: 'True' },
        { input: [{ gemini_api_key: 'AIzaSy', use_custom_key: false }], expected: false, inputStr: '{"use_custom_key": False}', expectedStr: 'False' },
        { input: [{ gemini_api_key: 'AIzaSy' }], expected: false, inputStr: '{"gemini_api_key": "AIzaSy"}', expectedStr: 'False' }
      ]
    },
    {
      id: 'ex-gem-5',
      title: 'Desafio 8.5: Gerar Cabeçalho de Autorização Bearer',
      desc: 'Escreva uma função obter_headers_autenticados(token) que retorne um dicionário contendo o cabeçalho correto de segurança da API: a chave "Authorization" associada ao valor "Bearer " seguido pelo token fornecido (ex: se token for "xyz", retorna "Bearer xyz").',
      initialCode: 'def obter_headers_autenticados(token):\n    # Monte o cabeçalho Bearer com o token fornecido\n    ',
      functionName: 'obter_headers_autenticados',
      testCases: [
        { input: ['token123'], expected: { Authorization: 'Bearer token123' }, inputStr: '"token123"', expectedStr: '{"Authorization": "Bearer token123"}' },
        { input: ['JWT-xyz'], expected: { Authorization: 'Bearer JWT-xyz' }, inputStr: '"JWT-xyz"', expectedStr: '{"Authorization": "Bearer JWT-xyz"}' },
        { input: [''], expected: { Authorization: 'Bearer ' }, inputStr: '""', expectedStr: '{"Authorization": "Bearer "}' }
      ]
    }
  ]
};
