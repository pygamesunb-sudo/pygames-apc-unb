"""
Agente Gerador (LLM) — cria problemas de programacao Python.

Suporta dois provedores:
- OpenRouter (padrao) — modelos gratuitos com fallback automatico
- Google Gemini (opcional) — quando o usuario fornece sua propria API key

O prompt do sistema inclui templates por dificuldade (facil → competitivo).
"""
import httpx
import json
import random
import logging

from app.config import settings
from app.models.schemas import GeneratedProblem, TestCase

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Prompt base enviado como system message — define formato JSON e regras de UX
GENERATOR_SYSTEM_PROMPT = """Você é um professor altamente experiente e criativo de programação Python.
Sua missão é criar problemas engajantes baseados estritamente no tema de interesse fornecido pelo usuário.

REGRAS DE SEGURANÇA E ADAPTAÇÃO DE TEMA (DIRETRIZ CRÍTICA):
- Se o tema sugerido pelo usuário for inadequado, vulgar, de duplo sentido ou sexualmente explícito, você NUNCA deve recusar a resposta (nunca retorne mensagens de recusa como 'I am sorry', 'Não posso ajudar com isso' ou similares).
- Em vez disso, você deve **abstrair e traduzir** o tema para um problema estritamente computacional, combinatório, matemático ou acadêmico. Use nomenclatura profissional e neutra nas chaves "topic" e "title".
- O resultado DEVE ser um problema de programação válido, didático, seguro para execução acadêmica e responder com a estrutura JSON completa.

Regras Cruciais de UX e Interface (IMPORTANTE):
- **Ocultar Palavras-chave na Descrição**: NUNCA inclua as palavras "Exemplo", "Entrada" ou "Saída" na chave "description". A interface do usuário renderizará automaticamente uma tabela HTML elegante baseada na chave "test_cases". Omitir essas palavras garante que essa UI seja ativada, gerando uma experiência melhor.
- **Formatação**: Use negrito (`**variavel**`) na descrição para destacar partes importantes. Não utilize marcações complexas.

Regras Cruciais de Estrutura e Execução:
- **Execução via Console (I/O)**: O código em "solution" DEVE rodar como um script Python completo independente. Ele deve ler os dados da entrada padrão (usando `sys.stdin.read()` ou `input()`) e imprimir a saída esperada na tela (`print()`). Se o problema for baseado em funções, você deve obrigatoriamente incluir no final da "solution" um bloco `if __name__ == "__main__":` para ler de stdin, chamar a função e imprimir o resultado no stdout. Caso contrário, a validação automática falhará com saída em branco.
- **Identação dos Blocos**: Preserve os espaços iniciais de identação em cada elemento do array "solution_blocks".
- **Limite Estrito de Blocos (6 a 12)**: O array "solution_blocks" deve conter obrigatoriamente **entre 6 e 12 blocos no máximo** para manter o minijogo arrastável fluido e possível.
- **Agrupamento Multilinha Inteligente**: Se o código da "solution" tiver mais de 10 linhas, você NÃO deve quebrar linha por linha. Em vez disso, agrupe linhas consecutivas de forma lógica em um único bloco multilinha (ex: agrupe os imports iniciais; a definição de uma função com suas primeiras linhas; um bloco inteiro de loop; ou o bloco final de execução `__main__`). Blocos muito curtos (como só `print(x)`) devem ser evitados, agrupando-os na linha anterior.
- **Sem Blocos Vazios**: Nunca inclua strings vazias `""` ou blocos duplicados no array "solution_blocks".
- O problema deve ser resolvível em Python puro (sem bibliotecas externas pesadas).

Abaixo está o modelo exato de saída esperado em JSON de acordo com a dificuldade:
"""

# Exemplos de saida JSON por nivel de dificuldade — anexados ao system prompt
DIFFICULTY_TEMPLATES = {
    "facil": '''
Você está gerando um problema FÁCIL.
- Foco: Variáveis, `if/else`, `loops` simples e leitura básica.
- Exemplo de Modelo de Saída (Retorne apenas JSON válido nesse formato):
```json
{
  "title": "Adivinhe o Número",
  "description": "Crie um programa que leia um número inteiro **N** e exiba **Par** se o número for par, ou **Impar** caso contrário. Note que a verificação matemática precisa ser exata.",
  "test_cases": [
    {"input": "2", "expected_output": "Par"},
    {"input": "3", "expected_output": "Impar"}
  ],
  "solution": "n = int(input())\\nif n % 2 == 0:\\n    print('Par')\\nelse:\\n    print('Impar')",
  "hints": ["Use o operador de módulo %", "Não esqueça de converter a entrada para inteiro com int()"],
  "solution_blocks": ["n = int(input())", "if n % 2 == 0:\\n    print('Par')", "else:\\n    print('Impar')"]
}
```
''',
    "medio": '''
Você está gerando um problema MÉDIO.
- Foco: Funções, manipulação de `listas`/`strings` e uso de `sys.stdin.read()`.
- Exemplo de Modelo de Saída (Retorne apenas JSON válido nesse formato):
```json
{
  "title": "Filtro de Vogais",
  "description": "Dada uma string de texto **S**, escreva um script que imprima apenas as vogais de **S** na mesma ordem, retirando as consoantes.",
  "test_cases": [
    {"input": "abacaxi", "expected_output": "aaai"},
    {"input": "hello", "expected_output": "eo"}
  ],
  "solution": "import sys\\n\\ndef extrair_vogais(s):\\n    return ''.join([c for c in s if c in 'aeiouAEIOU'])\\n\\nif __name__ == '__main__':\\n    s = sys.stdin.read().strip()\\n    print(extrair_vogais(s))",
  "hints": ["Crie uma string com todas as vogais possíveis para comparação.", "Você pode usar list comprehension para montar a resposta."],
  "solution_blocks": ["import sys", "def extrair_vogais(s):\\n    return ''.join([c for c in s if c in 'aeiouAEIOU'])", "if __name__ == '__main__':\\n    s = sys.stdin.read().strip()", "    print(extrair_vogais(s))"]
}
```
''',
    "dificil": '''
Você está gerando um problema DIFÍCIL.
- Foco: Algoritmos de busca, ordenação, ou matemática discreta (complexidade eficiente).
- Exemplo de Modelo de Saída (Retorne apenas JSON válido nesse formato):
```json
{
  "title": "O Maior Elemento K",
  "description": "Dado um array de **N** inteiros, e um número **K**, encontre e imprima o **K-ésimo** maior elemento no array.",
  "test_cases": [
    {"input": "6 2\\n3 2 1 5 6 4", "expected_output": "5"}
  ],
  "solution": "import sys\\n\\ndef findKthLargest(nums, k):\\n    nums.sort(reverse=True)\\n    return nums[k-1]\\n\\nif __name__ == '__main__':\\n    data = sys.stdin.read().split()\\n    if data:\\n        n, k = int(data[0]), int(data[1])\\n        nums = [int(x) for x in data[2:n+2]]\\n        print(findKthLargest(nums, k))",
  "hints": ["Tente ordenar o array em ordem decrescente primeiro.", "Acesse a posição k-1 do array."],
  "solution_blocks": ["import sys", "def findKthLargest(nums, k):\\n    nums.sort(reverse=True)\\n    return nums[k-1]", "if __name__ == '__main__':\\n    data = sys.stdin.read().split()", "    if data:\\n        n, k = int(data[0]), int(data[1])", "        nums = [int(x) for x in data[2:n+2]]\\n        print(findKthLargest(nums, k))"]
}
```
''',
    "competitivo": '''
Você está gerando um problema de PROGRAMAÇÃO COMPETITIVA.
- Foco: Estruturas de dados avançadas, Grafos (BFS/DFS), Dijkstra, DP, entradas multilinhas complexas e restrições de tempo simuladas.
- Exemplo de Modelo de Saída (Retorne apenas JSON válido nesse formato):
```json
{
  "title": "Caminho no Labirinto",
  "description": "Dado um labirinto **N** por **M**, encontre o tamanho do menor caminho de **(0,0)** a **(N-1, M-1)**. O labirinto é representado por **0** (livre) e **1** (parede). Imprima o menor caminho. Se for impossível, imprima **-1**.",
  "test_cases": [
    {"input": "3 3\\n0 0 0\\n1 1 0\\n0 0 0", "expected_output": "5"}
  ],
  "solution": "import sys\\nfrom collections import deque\\n\\ndef solve():\\n    data = sys.stdin.read().split()\\n    if not data: return\\n    n, m = int(data[0]), int(data[1])\\n    grid = []\\n    idx = 2\\n    for _ in range(n):\\n        grid.append([int(x) for x in data[idx:idx+m]])\\n        idx += m\\n    dq = deque([(0,0,1)])\\n    visited = set([(0,0)])\\n    dirs = [(0,1),(1,0),(0,-1),(-1,0)]\\n    while dq:\\n        x, y, d = dq.popleft()\\n        if x == n-1 and y == m-1: return print(d)\\n        for dx, dy in dirs:\\n            nx, ny = x+dx, y+dy\\n            if 0<=nx<n and 0<=ny<m and grid[nx][ny] == 0 and (nx,ny) not in visited:\\n                visited.add((nx,ny))\\n                dq.append((nx,ny,d+1))\\n    print(-1)\\n\\nif __name__ == '__main__':\\n    solve()",
  "hints": ["Use o algoritmo de Busca em Largura (BFS) para garantir o caminho mais curto.", "Armazene as coordenadas e a distância na fila."],
  "solution_blocks": ["import sys\\nfrom collections import deque", "def solve():\\n    data = sys.stdin.read().split()\\n    if not data: return", "    n, m = int(data[0]), int(data[1])\\n    grid = []\\n    idx = 2", "    for _ in range(n):\\n        grid.append([int(x) for x in data[idx:idx+m]])\\n        idx += m", "    dq = deque([(0,0,1)])\\n    visited = set([(0,0)])\\n    dirs = [(0,1),(1,0),(0,-1),(-1,0)]", "    while dq:\\n        x, y, d = dq.popleft()\\n        if x == n-1 and y == m-1: return print(d)", "        for dx, dy in dirs:\\n            nx, ny = x+dx, y+dy", "            if 0<=nx<n and 0<=ny<m and grid[nx][ny] == 0 and (nx,ny) not in visited:\\n                visited.add((nx,ny))\\n                dq.append((nx,ny,d+1))", "    print(-1)\\n\\nif __name__ == '__main__':\\n    solve()"]
}
```
'''
}


async def _call_gemini_api(messages: list[dict], api_key: str, temperature: float = 0.8) -> str:
    """Realiza uma chamada direta a API oficial do Google Gemini com a chave do usuario."""
    system_instruction = ""
    contents = []
    
    for msg in messages:
        if msg["role"] == "system":
            system_instruction = msg["content"]
        elif msg["role"] in ["user", "model"]:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })
            
    if not contents and system_instruction:
        contents.append({
            "role": "user",
            "parts": [{"text": "Gere o problema solicitado."}]
        })
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={api_key}"
    
    payload = {
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": temperature
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    logger.info("Chamando a API direta do Gemini 3.1 Flash-Lite com a chave do usuario.")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            logger.error("Resposta do Gemini nao estruturada como esperado: %s", data)
            raise ValueError(f"Gemini API: Resposta inesperada: {e}")


async def _call_llm(messages: list[dict], temperature: float = 0.7) -> str:
    """Realiza uma chamada a API do OpenRouter e retorna o conteudo da resposta."""
    import asyncio
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pygame-apc.web.app",
        "X-Title": "Pygame-APC",
    }
    
    # Lista de modelos para tentar em caso de falha (404, 429 ou erro de modelo inválido)
    models_to_try = [settings.openrouter_model]
    
    # Adiciona fallbacks caso o principal não seja openrouter/free
    if settings.openrouter_model != "openrouter/free":
        models_to_try.append("openrouter/free")
        
    fallback_list = [
        "nvidia/nemotron-3-super-120b-a12b:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.2-3b-instruct:free"
    ]
    for model in fallback_list:
        if model not in models_to_try:
            models_to_try.append(model)
            
    last_exception = None
    
    for model in models_to_try:
        logger.info("Tentando chamada a LLM com o modelo: %s", model)
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }
        
        max_retries = 3
        backoff_factor = 2.0
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
                    
                    # Se receber status de limite de requisicoes (429), tenta novamente com backoff
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(
                                "Modelo %s retornou 429 (Too Many Requests). Nova tentativa em %.2fs... (%d/%d)",
                                model, sleep_time, attempt + 1, max_retries
                            )
                            await asyncio.sleep(sleep_time)
                            continue
                            
                    response.raise_for_status()
                    data = response.json()
                    
                    if "error" in data:
                        error_data = data["error"]
                        error_msg = error_data.get("message", "Erro desconhecido retornado pelo OpenRouter.")
                        error_code = error_data.get("code")
                        
                        # Verifica se o erro da API do OpenRouter e um 429
                        if error_code == 429 or "429" in error_msg:
                            if attempt < max_retries - 1:
                                sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                                logger.warning(
                                    "OpenRouter reportou erro 429 para o modelo %s. Nova tentativa em %.2fs... (%d/%d)",
                                    model, sleep_time, attempt + 1, max_retries
                                )
                                await asyncio.sleep(sleep_time)
                                continue
                                
                        logger.error("Erro retornado pelo OpenRouter para o modelo %s: %s", model, error_data)
                        raise ValueError(f"OpenRouter ({model}): {error_msg}")
                        
                    if "choices" not in data or not data["choices"]:
                        logger.error("Resposta inesperada da API OpenRouter para o modelo %s: %s", model, data)
                        raise ValueError(f"OpenRouter ({model}): A resposta nao contem opcoes validas ('choices').")
                        
                    logger.info("Chamada a LLM concluida com sucesso usando o modelo: %s", model)
                    return data["choices"][0]["message"]["content"]
                    
            except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as e:
                # Se for um erro HTTPStatusError e for 429, ja foi tratado acima.
                # Para outros erros ou se as tentativas esgotaram, trata a excecao.
                if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning(
                            "Capturado HTTPStatusError 429 para %s. Nova tentativa em %.2fs... (%d/%d)",
                            model, sleep_time, attempt + 1, max_retries
                        )
                        await asyncio.sleep(sleep_time)
                        continue
                
                logger.warning("Falha na tentativa %d para o modelo %s: %s", attempt + 1, model, e)
                last_exception = e
                break  # Sai do loop de retentativas para tentar o proximo modelo
            
    raise ValueError(f"Todos os modelos da API do OpenRouter falharam. Ultimo erro: {last_exception}")


def _parse_problem_json(raw: str) -> dict:
    """Extrai e parseia o JSON da resposta da LLM."""
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        raise ValueError("A LLM nao retornou um JSON valido.")


async def generate_problem(
    topic: str, 
    difficulty: str, 
    gemini_api_key: str | None = None, 
    use_custom_key: bool = False
) -> dict:
    """
    Agente 1 (Gerador): Chama a LLM para criar o problema completo.
    Retorna um dicionario com o problema gerado.
    """
    logger.info(
        "Gerando problema: topico='%s', dificuldade='%s', use_custom_key=%s", 
        topic, difficulty, use_custom_key
    )

    user_message = (
        f"Crie um problema de programacao Python com dificuldade '{difficulty}' "
        f"com tema: '{topic}'. Seja criativo e divertido!"
    )

    difficulty_key = difficulty.lower()
    difficulty_instructions = DIFFICULTY_TEMPLATES.get(difficulty_key, DIFFICULTY_TEMPLATES["medio"])
    
    system_content = f"{GENERATOR_SYSTEM_PROMPT}\n\n{difficulty_instructions}"

    messages = [
        {"role": "system", "content": system_content},
        {"role": "user", "content": user_message},
    ]

    if use_custom_key and gemini_api_key:
        raw_response = await _call_gemini_api(messages, api_key=gemini_api_key, temperature=0.8)
    else:
        raw_response = await _call_llm(messages, temperature=0.8)

    logger.info("Raw response from LLM: %s", raw_response)
    try:
        print(f"\n--- RESPOSTA BRUTA DA LLM ---\n{raw_response}\n-----------------------------")
    except UnicodeEncodeError:
        import sys
        encoding = sys.stdout.encoding or "utf-8"
        safe_response = raw_response.encode(encoding, errors="replace").decode(encoding, errors="replace")
        print(f"\n--- RESPOSTA BRUTA DA LLM (SAFE ENCODING) ---\n{safe_response}\n-----------------------------")
    problem_data = _parse_problem_json(raw_response)

    # Garante que solution_blocks esteja embaralhado
    if "solution_blocks" in problem_data and problem_data["solution_blocks"]:
        random.shuffle(problem_data["solution_blocks"])

    logger.info("Problema gerado com sucesso: '%s'", problem_data.get("title", ""))
    return problem_data


async def _call_llm_stream(messages: list[dict], temperature: float = 0.8):
    """Realiza uma chamada a API do OpenRouter e retorna um AsyncGenerator com os chunks."""
    import asyncio
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pygame-apc.web.app",
        "X-Title": "Pygame-APC",
    }
    
    # Lista de modelos para tentar em caso de falha (404, 429 ou erro de modelo inválido)
    models_to_try = [settings.openrouter_model]
    if settings.openrouter_model != "openrouter/free":
        models_to_try.append("openrouter/free")
        
    fallback_list = [
        "nvidia/nemotron-3-super-120b-a12b:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "meta-llama/llama-3.2-3b-instruct:free"
    ]
    for model in fallback_list:
        if model not in models_to_try:
            models_to_try.append(model)
            
    last_exception = None
    
    for model in models_to_try:
        logger.info("Tentando chamada a LLM STREAM com o modelo: %s", model)
        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": True,
        }
        
        max_retries = 3
        backoff_factor = 2.0
        success = False
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    async with client.stream("POST", OPENROUTER_API_URL, headers=headers, json=payload) as response:
                        if response.status_code == 429:
                            if attempt < max_retries - 1:
                                sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                                logger.warning(
                                    "Modelo STREAM %s retornou 429 (Too Many Requests). Nova tentativa em %.2fs... (%d/%d)",
                                    model, sleep_time, attempt + 1, max_retries
                                )
                                await asyncio.sleep(sleep_time)
                                continue
                        
                        response.raise_for_status()
                        
                        success = True
                        async for chunk in response.aiter_text():
                            if chunk:
                                yield chunk
                        return
            except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as e:
                if success:
                    logger.error("Erro no meio do streaming com o modelo %s: %s", model, e)
                    raise e
                
                if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning(
                            "Capturado HTTPStatusError 429 STREAM para %s. Nova tentativa em %.2fs... (%d/%d)",
                            model, sleep_time, attempt + 1, max_retries
                        )
                        await asyncio.sleep(sleep_time)
                        continue
                
                logger.warning("Falha na tentativa %d para o modelo STREAM %s: %s", attempt + 1, model, e)
                last_exception = e
                break  # Tenta o próximo modelo
                
    raise ValueError(f"Todos os modelos da API do OpenRouter em STREAM falharam. Ultimo erro: {last_exception}")



async def generate_problem_stream(
    topic: str, 
    difficulty: str, 
    gemini_api_key: str | None = None, 
    use_custom_key: bool = False
):
    """
    Agente 1 (Gerador): Chama a LLM para criar o problema completo via STREAM.
    Cede (yields) os chunks de texto recebidos para envio via SSE.
    """
    try:
        logger.info(
            "Gerando problema (STREAM): topico='%s', dificuldade='%s', use_custom_key=%s", 
            topic, difficulty, use_custom_key
        )

        user_message = (
            f"Crie um problema de programacao Python com dificuldade '{difficulty}' "
            f"com tema: '{topic}'. Seja criativo e divertido!"
        )

        difficulty_key = difficulty.lower()
        difficulty_instructions = DIFFICULTY_TEMPLATES.get(difficulty_key, DIFFICULTY_TEMPLATES["medio"])
        
        system_content = f"{GENERATOR_SYSTEM_PROMPT}\n\n{difficulty_instructions}"

        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_message},
        ]

        if use_custom_key and gemini_api_key:
            # Nota: Gemini oficial tem endpoint de stream diferente, mas vamos apenas
            # mandar a chamada comum aqui se usar API key direta (fazer wrapper dps)
            # O ideal seria usar o aiter_lines() do stream do gemini
            logger.warning("Streaming ainda nao totalmente implementado para gemini direto. Retornando em bloco.")
            resp = await _call_gemini_api(messages, api_key=gemini_api_key, temperature=0.8)
        else:
            logger.info("Retornando em bloco para OpenRouter para garantir robustez e validacao de JSON.")
            resp = await _call_llm(messages, temperature=0.8)
            
        # Limpa e valida o JSON gerado no backend antes de empacotar
        problem_data = _parse_problem_json(resp)
        clean_resp = json.dumps(problem_data)
        
        # Simula o stream do openrouter com o JSON 100% limpo
        payload = json.dumps({"choices": [{"delta": {"content": clean_resp}}]})
        yield f"data: {payload}\n\n"
    except Exception as e:
        logger.exception("Erro durante o streaming da LLM.")
        payload = json.dumps({"error": f"Erro interno de streaming da LLM: {str(e)}"})
        yield f"data: {payload}\n\n"
