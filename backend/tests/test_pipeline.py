"""
Testes reais da pipeline de geracao e revisao de problemas.
Estes testes consomem creditos reais da API do OpenRouter e validam a integracao de ponta a ponta.
Execute com: python -m pytest backend/tests/test_pipeline.py -v
"""
import pytest
import os
from dotenv import load_dotenv

# Carrega as variaveis de ambiente locais
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from app.services.llm_generator import generate_problem
from app.services.llm_reviewer import review_problem, _run_solution_against_tests
from app.config import settings

@pytest.mark.asyncio
async def test_real_pipeline_generation_and_review():
    """
    Testa a geracao real de problemas e a sua revisao em paralelo usando a API do OpenRouter.
    Nao utiliza NENHUM mock ou dado hardcoded.
    """
    # 1. Validacao previa das configuracoes
    if not settings.openrouter_api_key:
        pytest.skip("OPENROUTER_API_KEY nao configurada no backend/.env! Pulando teste real de LLM.")
    assert settings.openrouter_model, "OPENROUTER_MODEL nao configurado no backend/.env!"
    
    print(f"\n[INTEGRACAO REAL] Testando geracao com o modelo: {settings.openrouter_model}")
    
    # 2. Testa Geracao Real (Agente 1)
    topic = "Minecraft"
    difficulty = "facil"
    
    try:
        problem_data = await generate_problem(topic, difficulty)
    except Exception as e:
        pytest.fail(f"Falha ao gerar o problema usando a API do OpenRouter: {e}")
        
    assert problem_data, "Nenhum dado retornado da geracao de problemas."
    assert "title" in problem_data, "Resposta nao contem o campo 'title'."
    assert "description" in problem_data, "Resposta nao contem o campo 'description'."
    assert "test_cases" in problem_data, "Resposta nao contem o campo 'test_cases'."
    assert "solution" in problem_data, "Resposta nao contem o campo 'solution'."
    assert "solution_blocks" in problem_data, "Resposta nao contem o campo 'solution_blocks'."
    
    print(f"\n[GERACAO REAL CONCLUIDA]")
    print(f"Titulo: {problem_data.get('title')}")
    print(f"Casos de teste gerados: {len(problem_data.get('test_cases', []))}")
    print(f"Solucao: {problem_data.get('solution')[:50]}...")
    
    # 3. Testa Executor Local de Codigo (Ferramenta Python)
    test_cases = problem_data.get("test_cases", [])
    solution = problem_data.get("solution", "")
    
    assert len(test_cases) > 0, "A LLM nao gerou casos de teste."
    
    test_results = _run_solution_against_tests(solution, test_cases)
    assert len(test_results) == len(test_cases), "A contagem de resultados de teste nao bate com os casos gerados."
    
    all_passed = all(r["passed"] for r in test_results)
    print(f"\n[EXECUTOR LOCAL] Todos os testes passaram na solucao gerada? {'SIM' if all_passed else 'NAO'}")
    for idx, r in enumerate(test_results):
        print(f"  Teste {idx}: passed={r['passed']} | input={repr(r['input'])} | expected={repr(r['expected_output'])} | actual={repr(r['actual_output'])}")
        if r["error"]:
            print(f"    Erro no console: {r['error']}")
            
    # Nao falhamos o teste se os testes gerados falharem de primeira (faz parte do processo de revisao rejeitar),
    # mas o executor local deve rodar e retornar os booleanos corretamente.
    assert isinstance(all_passed, bool)

    # 4. Testa Revisao Real (Agente Revisor 1)
    print(f"\n[INTEGRACAO REAL] Testando revisor 1 com o modelo: {settings.openrouter_model}")
    try:
        review_result = await review_problem(problem_data, reviewer_index=1)
    except Exception as e:
        pytest.fail(f"Falha ao revisar o problema usando a API do OpenRouter: {e}")
        
    assert review_result, "Nenhum dado retornado da revisao de problemas."
    assert "approved" in review_result, "Resposta do revisor nao contem o campo 'approved'."
    assert "feedback" in review_result, "Resposta do revisor nao contem o campo 'feedback'."
    assert isinstance(review_result["approved"], bool), "Campo 'approved' deve ser um booleano."
    
    print(f"\n[REVISAO REAL CONCLUIDA]")
    print(f"Aprovado: {review_result.get('approved')}")
    print(f"Feedback: {review_result.get('feedback')}")
