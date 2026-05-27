import subprocess
import sys
import tempfile
import os
import json
import logging
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

REVIEWER_SYSTEM_PROMPT = """Você é um revisor e corretor especialista de desafios de programação em Python.
Sua missão é garantir que o desafio seja perfeito, didático e esteja 100% livre de erros antes de ser entregue.

Você receberá o problema gerado e os logs de execução real da ferramenta Python que testou a solução proposta contra os casos de teste.

Se a solução falhar nos testes (campo 'all_tests_passed' for False) ou se você identificar qualquer bug nos casos de teste, enunciado ou blocos de código:
1. VOCÊ DEVE CORRIGIR o problema! Encontre o erro no código ou nos testes, reescreva-os e garanta que passem perfeitamente.
2. Defina "approved": true no retorno, pois você mesmo já consertou e validou o problema.
3. Preencha o dicionário 'corrected_problem' com todos os campos corrigidos.

Sempre responda em formato JSON válido com a seguinte estrutura exata:
{
  "approved": true ou false (true se o problema estiver correto ou se você o corrigiu com sucesso),
  "feedback": "Análise detalhada do problema e explicação de quaisquer correções feitas",
  "suggested_improvements": ["melhoria 1"],
  "corrected_problem": {
    "title": "Título (corrigido se necessário, ou mantido)",
    "description": "Enunciado (corrigido se necessário, ou mantido)",
    "test_cases": [
      {"input": "entrada", "expected_output": "saída"}
    ],
    "solution": "código Python que resolve o problema (corrigido e testado)",
    "hints": ["dicas"],
    "solution_blocks": ["linhas individuais da solução"]
  }
}

Se o problema original já estiver 100% perfeito e todos os testes passaram de primeira, defina "corrected_problem": null (mas defina "approved": true)."""


def _run_solution_against_tests(solution_code: str, test_cases: list[dict]) -> list[dict]:
    """
    Ferramenta Python: Executa a solucao em um subprocesso isolado e retorna
    os resultados de cada caso de teste.

    AVISO DE SEGURANCA: Esta implementacao e para desenvolvimento local/MVP.
    Em producao, use um ambiente Docker ou sandbox dedicado.
    """
    results = []

    for i, tc in enumerate(test_cases):
        wrapper_code = f"""
import sys
import io

# Redireciona stdin ANTES de rodar para que qualquer execucao leia os dados corretos
sys.stdin = io.StringIO({repr(tc['input'])})

solution_code = {repr(solution_code)}

solution_globals = {{
    "__name__": "__main__",
    "__builtins__": __builtins__,
    "sys": sys,
    "io": io
}}

try:
    # Executa a solucao em um namespace onde __name__ e __main__
    # para que blocos entry point (como if __name__ == '__main__') rodem sozinhos
    exec(solution_code, solution_globals)
    
    # Se o codigo nao possui um bloco '__main__' explicito no texto,
    # mas definiu uma funcao 'main', nós a chamamos explicitamente
    if "main" in solution_globals and "__main__" not in solution_code:
        solution_globals["main"]()
except Exception as e:
    print(f"ERRO: {{e}}", file=sys.stderr)
    sys.exit(1)
"""
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, encoding="utf-8"
            ) as tmp:
                tmp.write(wrapper_code)
                tmp_path = tmp.name

            proc = subprocess.run(
                [sys.executable, tmp_path],
                input=tc["input"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            actual_output = proc.stdout.strip()
            stderr_output = proc.stderr.strip()

            passed = actual_output == tc["expected_output"].strip()
            results.append(
                {
                    "test_case_index": i,
                    "passed": passed,
                    "input": tc["input"],
                    "expected_output": tc["expected_output"],
                    "actual_output": actual_output,
                    "error": stderr_output if stderr_output else None,
                }
            )
        except subprocess.TimeoutExpired:
            results.append(
                {
                    "test_case_index": i,
                    "passed": False,
                    "input": tc["input"],
                    "expected_output": tc["expected_output"],
                    "actual_output": "",
                    "error": "Tempo limite excedido (5s).",
                }
            )
        except Exception as e:
            results.append(
                {
                    "test_case_index": i,
                    "passed": False,
                    "input": tc["input"],
                    "expected_output": tc["expected_output"],
                    "actual_output": "",
                    "error": str(e),
                }
            )
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    return results


async def _call_reviewer_gemini_api(messages: list[dict], api_key: str) -> dict:
    """Chama a API do Gemini oficial direta e parseia o JSON com fallback robusto."""
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
            "parts": [{"text": "Revise o problema."}]
        })
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={api_key}"
    
    payload = {
        "contents": contents,
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.3
        }
    }
    
    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }
        
    logger.info("Revisor chamando a API direta do Gemini 3.1 Flash-Lite com a chave do usuario.")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()
        
        try:
            raw = data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as e:
            logger.error("Resposta do Gemini no Revisor nao estruturada como esperado: %s", data)
            raise ValueError(f"Gemini API Revisor: Resposta inesperada: {e}")
            
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(raw[start:end])
            raise ValueError("A LLM do Gemini no revisor nao retornou um JSON valido.")


async def _call_reviewer_llm(messages: list[dict]) -> dict:
    """Chama a LLM do revisor e parseia a resposta JSON com fallback robusto."""
    import asyncio
    import random
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pygame-apc.web.app",
        "X-Title": "Pygame-APC",
    }
    
    models_to_try = [settings.openrouter_model]
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
        logger.info("Revisor tentando chamada a LLM com o modelo: %s", model)
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
        }
        
        max_retries = 3
        backoff_factor = 2.0
        
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    response = await client.post(OPENROUTER_API_URL, headers=headers, json=payload)
                    
                    # Se receber status de limite de requisicoes (429), tenta novamente com backoff
                    if response.status_code == 429:
                        if attempt < max_retries - 1:
                            sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                            logger.warning(
                                "Revisor: Modelo %s retornou 429 (Too Many Requests). Nova tentativa em %.2fs... (%d/%d)",
                                model, sleep_time, attempt + 1, max_retries
                            )
                            await asyncio.sleep(sleep_time)
                            continue
                            
                    response.raise_for_status()
                    data = response.json()
                    
                    if "error" in data:
                        error_data = data["error"]
                        error_msg = error_data.get("message", "Erro desconhecido retornado pelo OpenRouter no Revisor.")
                        error_code = error_data.get("code")
                        
                        # Verifica se o erro da API do OpenRouter e um 429
                        if error_code == 429 or "429" in error_msg:
                            if attempt < max_retries - 1:
                                sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                                logger.warning(
                                    "Revisor: OpenRouter reportou erro 429 para o modelo %s. Nova tentativa em %.2fs... (%d/%d)",
                                    model, sleep_time, attempt + 1, max_retries
                                )
                                await asyncio.sleep(sleep_time)
                                continue
                                
                        logger.error("Erro retornado pelo OpenRouter no Revisor para o modelo %s: %s", model, error_data)
                        raise ValueError(f"OpenRouter Revisor ({model}): {error_msg}")
                        
                    if "choices" not in data or not data["choices"]:
                        logger.error("Resposta inesperada no Revisor para o modelo %s: %s", model, data)
                        raise ValueError(f"OpenRouter Revisor ({model}): O revisor nao retornou opcoes validas ('choices').")
                        
                    raw = data["choices"][0]["message"]["content"]
                    
                    try:
                        return json.loads(raw)
                    except json.JSONDecodeError:
                        start = raw.find("{")
                        end = raw.rfind("}") + 1
                        if start != -1 and end > start:
                            return json.loads(raw[start:end])
                        raise ValueError("A LLM do revisor nao retornou um JSON valido.")
                        
            except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as e:
                # Se for um erro HTTPStatusError e for 429, ja foi tratado acima.
                # Para outros erros ou se as tentativas esgotaram, trata a excecao.
                if isinstance(e, httpx.HTTPStatusError) and e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        sleep_time = backoff_factor * (2 ** attempt) + random.uniform(0.1, 0.5)
                        logger.warning(
                            "Revisor: Capturado HTTPStatusError 429 para %s. Nova tentativa em %.2fs... (%d/%d)",
                            model, sleep_time, attempt + 1, max_retries
                        )
                        await asyncio.sleep(sleep_time)
                        continue
                
                logger.warning("Revisor: Falha na tentativa %d para o modelo %s: %s", attempt + 1, model, e)
                last_exception = e
                break  # Sai do loop de retentativas para tentar o proximo modelo
            
    raise ValueError(f"Todos os modelos do Revisor da API do OpenRouter falharam. Ultimo erro: {last_exception}")


async def review_problem(
    problem_data: dict, 
    reviewer_index: int, 
    gemini_api_key: str | None = None, 
    use_custom_key: bool = False
) -> dict:
    """
    Agente Revisor (instancia reviewer_index): Recebe o problema gerado,
    executa a solucao nos testes usando a ferramenta Python e pede a LLM para avaliar.
    Retorna o resultado da revisao.
    """
    logger.info(
        "Revisor %d iniciando revisao do problema: '%s', use_custom_key=%s",
        reviewer_index,
        problem_data.get("title", ""),
        use_custom_key
    )

    test_results = _run_solution_against_tests(
        problem_data.get("solution", ""), problem_data.get("test_cases", [])
    )
    all_passed = all(r["passed"] for r in test_results)

    logger.info(
        "Revisor %d - resultados dos testes: %d/%d passaram.",
        reviewer_index,
        sum(1 for r in test_results if r["passed"]),
        len(test_results),
    )

    context = {
        "problem_title": problem_data.get("title"),
        "problem_description": problem_data.get("description"),
        "test_cases": problem_data.get("test_cases"),
        "solution": problem_data.get("solution"),
        "automated_test_results": test_results,
        "all_tests_passed": all_passed,
    }

    messages = [
        {"role": "system", "content": REVIEWER_SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"Revise este problema de programacao. "
                f"Os testes automaticos {'PASSARAM' if all_passed else 'FALHARAM'}.\n\n"
                f"Contexto completo:\n{json.dumps(context, ensure_ascii=False, indent=2)}"
            ),
        },
    ]

    if use_custom_key and gemini_api_key:
        review_result = await _call_reviewer_gemini_api(messages, api_key=gemini_api_key)
    else:
        review_result = await _call_reviewer_llm(messages)

    review_result["reviewer_index"] = reviewer_index
    review_result["tests_executed"] = test_results
    review_result["all_tests_passed"] = all_passed

    logger.info(
        "Revisor %d concluiu: aprovado=%s", reviewer_index, review_result.get("approved")
    )
    return review_result
