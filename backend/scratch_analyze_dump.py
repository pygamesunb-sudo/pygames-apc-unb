import json
import os

def main():
    dump_path = os.path.join(os.path.dirname(__file__), "problems_dump.json")
    if not os.path.exists(dump_path):
        print("Erro: problems_dump.json não encontrado.")
        return
        
    with open(dump_path, "r", encoding="utf-8") as f:
        problems = json.load(f)
        
    print(f"=== ANALISANDO {len(problems)} QUESTÕES DO BANCO DE DADOS ===\n")
    
    for idx, p in enumerate(problems):
        title = p.get("title", "Sem título")
        p_id = p.get("problem_id", "Sem ID")
        topic = p.get("topic", "Sem tópico")
        difficulty = p.get("difficulty", "Sem dificuldade")
        description = p.get("description", "")
        test_cases = p.get("test_cases", [])
        solution = p.get("solution", "")
        solution_blocks = p.get("solution_blocks", [])
        hints = p.get("hints", [])
        
        print(f"Questão #{idx+1}: {title} (ID: {p_id})")
        print(f"  - Tópico: {topic}")
        print(f"  - Dificuldade: {difficulty}")
        
        # 1. Checagem de complexidade de blocos
        block_count = len(solution_blocks)
        print(f"  - Blocos de solução: {block_count}")
        if block_count > 12:
            print(f"    [ALERTA]: Muito complexo! Possui {block_count} blocos de solução. O ideal é entre 6 e 12.")
        elif block_count == 0:
            print(f"    [ERRO]: Não possui blocos de solução!")
            
        # 2. Checagem de blocos vazios ou duplicados
        empty_blocks = sum(1 for b in solution_blocks if b == "")
        stripped_blocks = [b.strip() for b in solution_blocks]
        duplicate_blocks = len(stripped_blocks) - len(set(stripped_blocks))
        if empty_blocks > 0:
            print(f"    [ERRO]: Possui {empty_blocks} blocos completamente vazios (caixas invisíveis na tela).")
        if duplicate_blocks > 0:
            print(f"    [ALERTA]: Possui {duplicate_blocks} blocos com código duplicado.")
            
        # 3. Identação em blocos
        indented_blocks = sum(1 for b in solution_blocks if b.startswith("    ") or b.startswith("\t"))
        print(f"    - Blocos identados: {indented_blocks} de {block_count}")
        
        # 4. Checagem de vazamento de markdown
        markdown_tables = "|" in description
        triple_backticks = "```" in description
        if markdown_tables:
            print(f"    [ALERTA]: Possui tabelas markdown (|) na descrição. Pode quebrar a visualização.")
        if triple_backticks:
            print(f"    [ALERTA]: Possui blocos de código com crases (```) na descrição.")
            
        # 5. Checagem de casos de teste
        print(f"  - Casos de teste: {len(test_cases)}")
        for tc_idx, tc in enumerate(test_cases):
            tc_input = tc.get("input", "")
            tc_output = tc.get("expected_output", "")
            # Checa se são strings ou se têm formatos esquisitos
            if tc_input.startswith("[") and tc_input.endswith("]"):
                print(f"    - Caso {tc_idx+1}: Entrada é representação de lista: '{tc_input}' (Pode causar problemas na leitura standard)")
            if tc_output.startswith("[") and tc_output.endswith("]"):
                print(f"    - Caso {tc_idx+1}: Saída é representação de lista: '{tc_output}'")
                
        print("-" * 50)

if __name__ == "__main__":
    main()
