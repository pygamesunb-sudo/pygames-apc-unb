import httpx
import json
import random
import logging

from app.config import settings
from app.models.schemas import GeneratedProblem, TestCase

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

GENERATOR_SYSTEM_PROMPT = """Você é um professor altamente experiente e criativo de programação Python.
Sua missão é criar problemas engajantes baseados estritamente no tema de interesse fornecido pelo usuário.

REGRAS DE SEGURANÇA E ADAPTAÇÃO DE TEMA (DIRETRIZ CRÍTICA):
- Se o tema sugerido pelo usuário for inadequado, vulgar, de duplo sentido ou sexualmente explícito, você NUNCA deve recusar a resposta (nunca retorne mensagens de recusa como 'I am sorry', 'Não posso ajudar com isso' ou similares).
- Em vez disso, você deve **abstrair e traduzir** o tema para um problema estritamente computacional, combinatório, matemático ou acadêmico (ex: "Combinatória e Lógica", "Ordenação de Conjuntos"). Use nomenclatura profissional e neutra nas chaves "topic" e "title".
- O resultado DEVE ser um problema de programação válido, didático, seguro para execução acadêmica e responder com a estrutura JSON completa.

Sempre responda em formato JSON válido com a seguinte estrutura exata:
{
  "title": "Titulo do problema",
  "description": "Enunciado completo do problema, com exemplos de entrada e saida em formato de texto simples (evite markdown complexo ou tabelas com barras verticais)",
  "test_cases": [
    {"input": "valor de entrada", "expected_output": "saida esperada"},
    {"input": "valor de entrada 2", "expected_output": "saida esperada 2"},
    {"input": "valor de entrada 3", "expected_output": "saida esperada 3"}
  ],
  "solution": "codigo Python completo que resolve o problema",
  "hints": ["dica 1", "dica 2"],
  "solution_blocks": ["bloco 1 da solucao", "bloco 2 da solucao"]
}

Regras Cruciais de Estrutura e Execução:
- **Execução via Console (I/O)**: O código em "solution" DEVE rodar como um script Python completo independente. Ele deve ler os dados da entrada padrão (usando `sys.stdin.read()` ou `input()`) e imprimir a saída esperada na tela (`print()`). Se o problema for baseado em funções, você deve obrigatoriamente incluir no final da "solution" um bloco `if __name__ == "__main__":` para ler de stdin, chamar a função e imprimir o resultado no stdout. Caso contrário, a validação automática falhará com saída em branco.
- **Identação dos Blocos**: Preserve os espaços iniciais de identação em cada elemento do array "solution_blocks".
- **Limite Estrito de Blocos (6 a 12)**: O array "solution_blocks" deve conter obrigatoriamente **entre 6 e 12 blocos no máximo** para manter o minijogo arrastável fluido e possível.
- **Agrupamento Multilinha Inteligente**: Se o código da "solution" tiver mais de 10 linhas, você NÃO deve quebrar linha por linha. Em vez disso, agrupe linhas consecutivas de forma lógica em um único bloco multilinha (ex: agrupe os imports iniciais; a definição de uma função com suas primeiras linhas; um bloco inteiro de loop; ou o bloco final de execução `__main__`).
- **Sem Blocos Vazios**: Nunca inclua strings vazias `""` ou blocos duplicados no array "solution_blocks".
- O problema deve ser resolvivel em Python puro (sem bibliotecas externas).
- Os casos de teste devem cobrir casos gerais e casos extremos.
- Para dificuldade 'facil': loops e condicionais simples.
- Para dificuldade 'medio': funcoes, listas, strings.
- Para dificuldade 'dificil': algoritmos classicos, complexidade O(n log n).
- Para dificuldade 'competitivo': estruturas de dados avancadas, grafos, DP."""


async def _call_gemini_api(messages: list[dict], api_key: str, temperature: float = 0.7) -> str:
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
    if not (settings.openrouter_api_key or "").strip():
        raise RuntimeError(
            "OPENROUTER_API_KEY nao configurada na Function. "
            "Defina o segredo antes de gerar exercicios."
        )
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": settings.openrouter_referer(),
        "X-Title": "Pygame-APC",
    }
    
    # Lista de modelos para tentar em caso de falha (404, 429 ou erro de modelo inválido)
    models_to_try = [settings.openrouter_model]
    
    # Adiciona fallbacks caso o principal não seja openrouter/free
    if settings.openrouter_model != "openrouter/free":
        models_to_try.append("openrouter/free")
        
    fallback_list = [
        "openai/gpt-oss-120b:free",
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

    messages = [
        {"role": "system", "content": GENERATOR_SYSTEM_PROMPT},
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
