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
- Em vez disso, você deve **abstrair e traduzir** o tema para um problema estritamente computacional, combinatório, matemático ou acadêmico. Por exemplo, se o usuário sugerir uma combinação com teor de duplo sentido ou sexual, transforme-o em um problema puramente combinatório de agrupamento de elementos, conjuntos ou partição de grafos, utilizando terminologia científica, neutra e educativa (ex: "agrupamento sob restrições de adjacência" ou "combinação de subconjuntos de elementos com exclusão").
- O resultado DEVE ser um problema de programação válido, didático, seguro para execução acadêmica e responder com a estrutura JSON completa.

Sempre responda em formato JSON válido com a seguinte estrutura exata:
{
  "title": "Titulo do problema",
  "description": "Enunciado completo do problema, com exemplos de entrada e saida no texto",
  "test_cases": [
    {"input": "valor de entrada", "expected_output": "saida esperada"},
    {"input": "valor de entrada 2", "expected_output": "saida esperada 2"},
    {"input": "valor de entrada 3", "expected_output": "saida esperada 3"}
  ],
  "solution": "codigo Python completo que resolve o problema",
  "hints": ["dica 1", "dica 2"],
  "solution_blocks": ["linha 1 da solucao", "linha 2 da solucao"]
}

Regras:
- O problema deve ser resolvivel em Python puro (sem bibliotecas externas).
- Os casos de teste devem cobrir casos gerais e casos extremos.
- Os blocos de solucao devem ser linhas individuais do codigo da solucao (para o modo de blocos).
- O problema deve ser contextualizado no tema fornecido de forma adaptada, divertida e científica.
- Para dificuldade 'facil': loops e condicionais simples.
- Para dificuldade 'medio': funcoes, listas, strings.
- Para dificuldade 'dificil': algoritmos classicos, complexidade O(n log n).
- Para dificuldade 'competitivo': estruturas de dados avancadas, grafos, DP."""


async def _call_llm(messages: list[dict], temperature: float = 0.7) -> str:
    """Realiza uma chamada a API do OpenRouter e retorna o conteudo da resposta."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pygame-apc.web.app",
        "X-Title": "Pygame-APC",
    }
    payload = {
        "model": settings.openrouter_model,
        "messages": messages,
        "temperature": temperature,
    }
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Tratamento de erro detalhado caso a API do OpenRouter retorne erro de créditos, limite ou bloqueio
        if "error" in data:
            error_msg = data["error"].get("message", "Erro desconhecido retornado pelo OpenRouter.")
            logger.error("Erro retornado pelo OpenRouter: %s", data["error"])
            raise ValueError(f"OpenRouter: {error_msg}")
            
        if "choices" not in data or not data["choices"]:
            logger.error("Resposta inesperada da API OpenRouter: %s", data)
            raise ValueError("A resposta da API OpenRouter nao contem opcoes validas ('choices'). Verifique os seus creditos ou se o topico foi bloqueado por politicas de seguranca do provedor do modelo.")
            
        return data["choices"][0]["message"]["content"]


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


async def generate_problem(topic: str, difficulty: str) -> dict:
    """
    Agente 1 (Gerador): Chama a LLM para criar o problema completo.
    Retorna um dicionario com o problema gerado.
    """
    logger.info("Gerando problema: topico='%s', dificuldade='%s'", topic, difficulty)

    user_message = (
        f"Crie um problema de programacao Python com dificuldade '{difficulty}' "
        f"com tema: '{topic}'. Seja criativo e divertido!"
    )

    messages = [
        {"role": "system", "content": GENERATOR_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    raw_response = await _call_llm(messages, temperature=0.8)
    logger.info("Raw response from LLM: %s", raw_response)
    print(f"\n--- RESPOSTA BRUTA DA LLM ---\n{raw_response}\n-----------------------------")
    problem_data = _parse_problem_json(raw_response)

    # Garante que solution_blocks esteja embaralhado
    if "solution_blocks" in problem_data and problem_data["solution_blocks"]:
        random.shuffle(problem_data["solution_blocks"])

    logger.info("Problema gerado com sucesso: '%s'", problem_data.get("title", ""))
    return problem_data
