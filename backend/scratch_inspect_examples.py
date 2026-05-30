import json
import os
import re

def main():
    dump_path = os.path.join(os.path.dirname(__file__), "problems_dump.json")
    if not os.path.exists(dump_path):
        print("Erro: problems_dump.json não encontrado.")
        return
        
    with open(dump_path, "r", encoding="utf-8") as f:
        problems = json.load(f)
        
    print("=== ANÁLISE METICULOSA DOS EXEMPLOS EMBUTIDOS NOS ENUNCIADOS ===\n")
    
    for idx, p in enumerate(problems):
        title = p.get("title", "Sem título")
        desc = p.get("description", "")
        test_cases = p.get("test_cases", [])
        
        print(f"Questão #{idx+1}: '{title}'")
        
        # 1. Procura por seções de "Exemplo", "Exemplos", "Exemplo de Entrada" no enunciado
        # Procura usando expressões regulares sem diferenciar maiúsculas/minúsculas
        match_ex = re.search(r'(exemplo|exemplos|exemplo de entrada|exemplo de saída|exemplo 1)', desc, re.IGNORECASE)
        
        if match_ex:
            start_idx = match_ex.start()
            clean_desc = desc[:start_idx].strip()
            example_section = desc[start_idx:].strip()
            
            print("  [PRESENTE]: O enunciado contém seção de exemplo textual.")
            print(f"  - Tamanho da Descrição Principal: {len(clean_desc)} caracteres")
            print(f"  - Tamanho da Seção de Exemplo: {len(example_section)} caracteres")
            print("  - Prévia do Exemplo Embutido:")
            # Mostra as primeiras linhas do exemplo
            lines = example_section.split("\n")
            for line in lines[:6]:
                print(f"      > {line}")
            if len(lines) > 6:
                print("      > ... (truncado)")
                
            # Verifica se o primeiro caso de teste real bate com o exemplo embutido
            first_tc = test_cases[0] if test_cases else None
            if first_tc:
                tc_in = first_tc.get("input", "").strip().replace("\n", " ")
                tc_out = first_tc.get("expected_output", "").strip().replace("\n", " ")
                print(f"  - Primeiro Caso de Teste Real no Firestore:")
                print(f"      Input: '{tc_in}'")
                print(f"      Output: '{tc_out}'")
                
                # Verifica se o input do teste real está contido na seção de exemplos
                in_ex_sec = tc_in in example_section or tc_in.replace(" ", "") in example_section.replace(" ", "")
                out_ex_sec = tc_out in example_section or tc_out.replace(" ", "") in example_section.replace(" ", "")
                print(f"      -> Input coincide com texto do exemplo? {'SIM' if in_ex_sec else 'NÃO'}")
                print(f"      -> Output coincide com texto do exemplo? {'SIM' if out_ex_sec else 'NÃO'}")
        else:
            print("  [AUSENTE]: Sem exemplos embutidos na descrição!")
            
        print("-" * 60)

if __name__ == "__main__":
    main()
