import httpx
import json
import random
import logging

from app.models.schemas import GeneratedProblem, TestCase
from app.services.ai.client import chat_completion

logger = logging.getLogger(__name__)

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
    return await chat_completion(
        messages,
        temperature=temperature,
        timeout=300.0,
        use_generation_fallbacks=True,
        missing_key_message=(
            "OPENROUTER_API_KEY nao configurada na Function. "
            "Defina o segredo antes de gerar exercicios."
        ),
        failure_message="Todos os modelos da API do OpenRouter falharam.",
        log_label="Gerador",
    )


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
