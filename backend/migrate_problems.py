import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from google.oauth2.credentials import Credentials as GoogleCredentials
import random

# Dicionário mapeando os drivers de console de I/O específicos para cada questão baseada em função
DRIVERS = {
    "filtrar_classicos": """

if __name__ == "__main__":
    import sys
    import ast
    input_data = sys.stdin.read().strip()
    if input_data:
        try:
            # ast.literal_eval avalia listas de tuplas de forma segura e robusta em Python
            filmes = ast.literal_eval(input_data)
            res = filtrar_classicos(filmes)
            print(res)
        except Exception as e:
            print([])
""",
    "derivar_polinomio": """

if __name__ == "__main__":
    import sys
    import ast
    input_data = sys.stdin.read().strip()
    if input_data:
        try:
            coefs = ast.literal_eval(input_data)
            res = derivar_polinomio(coefs)
            print(res)
        except Exception as e:
            print([])
""",
    "contar_vogais": """

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().strip()
    if input_data:
        # Se vier cercado por aspas simples/duplas de strings de teste, limpa
        if (input_data.startswith("'") and input_data.endswith("'")) or (input_data.startswith('"') and input_data.endswith('"')):
            input_data = input_data[1:-1]
        res = contar_vogais(input_data)
        print(res)
""",
    "is_valid_sudoku": """

if __name__ == "__main__":
    import sys
    import ast
    input_data = sys.stdin.read().strip()
    if input_data:
        try:
            board = ast.literal_eval(input_data)
            res = is_valid_sudoku(board)
            print(res)
        except Exception as e:
            print(False)
""",
    "verificar_interacao": """

if __name__ == "__main__":
    import sys
    input_data = sys.stdin.read().strip()
    if input_data:
        try:
            n, m = map(int, input_data.split(","))
            res = verificar_interacao(n, m)
            print(res)
        except Exception as e:
            print(False)
"""
}

def generate_blocks_from_solution(solution_code, max_blocks=9):
    """
    Divide o código da solução em blocos multilinhas de tamanho ideal (6 a 9 blocos).
    Isso substitui o quebra-cabeça de 37 linhas em algo altamente solúvel e lógico.
    """
    raw_lines = solution_code.split("\n")
    # Filtra linhas vazias
    lines = [l for l in raw_lines if l.strip() != ""]
    
    if len(lines) <= max_blocks:
        blocks = lines
    else:
        # Agrupa linhas consecutivas em blocos lógicos multilinha
        chunk_size = int(len(lines) / max_blocks) + (1 if len(lines) % max_blocks > 0 else 0)
        blocks = []
        for i in range(0, len(lines), chunk_size):
            chunk = lines[i:i+chunk_size]
            blocks.append("\n".join(chunk))
            
    # Cria uma cópia, embaralha e retorna
    shuffled = list(blocks)
    random.shuffle(shuffled)
    return shuffled

def main():
    print("=== MIGRANDO E SANITIZANDO QUESTÕES NO FIRESTORE ===")
    
    # 1. Carrega access token diretamente do config do Firebase CLI
    user_profile = os.environ.get("USERPROFILE")
    config_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
    
    if not os.path.exists(config_path):
        print("Erro: Arquivo do Firebase CLI não encontrado!")
        return
        
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    access_token = config["tokens"]["access_token"]
    print("Token OAuth2 autenticado! Inicializando Firebase Admin SDK...")
    
    # 2. Inicializa o Admin SDK
    project_id = os.environ.get("FIREBASE_PROJECT_ID", "").strip()
    if not project_id:
        print("Defina FIREBASE_PROJECT_ID com o ID do novo projeto Firebase.")
        return

    creds = GoogleCredentials(access_token)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(
            credential=creds,
            options={"projectId": project_id}
        )
        
    db = firestore.client()
    print("Conectado com sucesso ao Firestore! Carregando problemas...")
    
    # 3. Busca todas as questões da coleção
    docs = db.collection("problems").get()
    print(f"Sucesso! Encontrados {len(docs)} problemas para atualizar.")
    
    updated_count = 0
    
    for doc in docs:
        p_id = doc.id
        p_data = doc.to_dict()
        title = p_data.get("title", "Sem título")
        topic = p_data.get("topic", "")
        solution = p_data.get("solution", "")
        solution_blocks = p_data.get("solution_blocks", [])
        description = p_data.get("description", "")
        
        print(f"\nProcessando: '{title}' (ID: {p_id})")
        modified = False
        
        # A) Saneamento do Tópico Vulgar
        if "suruba" in topic.lower() or "bunda" in topic.lower() or "comer" in topic.lower():
            print(f"  [MODERAÇÃO]: Tópico vulgar detectado ('{topic}'). Alterando para 'Combinatória e Lógica'...")
            p_data["topic"] = "Combinatória e Lógica"
            modified = True
            
        # B) Correção do Bug de Execução Crítico (Drivers I/O de console)
        # Verifica se alguma função de interesse está declarada no código e se o driver ainda não foi incluído
        for func_name, driver_code in DRIVERS.items():
            if f"def {func_name}" in solution and "if __name__ ==" not in solution:
                print(f"  [BUG FIX]: Injetando driver de console I/O para a função '{func_name}' no código da solução...")
                solution = solution + driver_code
                p_data["solution"] = solution
                modified = True
                break
                
        # C) Reconstrução e Chunking Inteligente de Blocos (Task/Move Lines Fix)
        # Limpa os blocos vazios, duplicados e reduz o pile de blocos gigantes (como o de 37 blocos)
        lines_count = len([l for l in solution.split("\n") if l.strip() != ""])
        current_block_count = len(solution_blocks)
        
        # Sempre reconstruímos a partir do campo 'solution' correto para garantir que:
        # 1. Tenha identação perfeita.
        # 2. Não possua blocos vazios "".
        # 3. Esteja na quantidade correta (6 a 9 blocos multilinha).
        print(f"  [BLOCK REBUILD]: Código de {lines_count} linhas. Vetor anterior: {current_block_count} blocos.")
        new_blocks = generate_blocks_from_solution(solution, max_blocks=9)
        p_data["solution_blocks"] = new_blocks
        print(f"  [BLOCK REBUILD]: Vetor atualizado para: {len(new_blocks)} blocos multilinha lógicos.")
        modified = True
        
        # D) Correções extras nas revisões salvas
        if "reviews" in p_data and p_data["reviews"]:
            for r in p_data["reviews"]:
                if r.get("corrected_problem"):
                    corr = r["corrected_problem"]
                    corr_sol = corr.get("solution", "")
                    corr_topic = corr.get("topic", "")
                    corr_modified = False
                    
                    # Limpa tópicos vulgares nas correções de revisão também
                    if "suruba" in corr_topic.lower() or "bunda" in corr_topic.lower() or "comer" in corr_topic.lower():
                        corr["topic"] = "Combinatória e Lógica"
                        corr_modified = True
                        
                    # Adiciona driver de console nas soluções de revisão
                    for func_name, driver_code in DRIVERS.items():
                        if f"def {func_name}" in corr_sol and "if __name__ ==" not in corr_sol:
                            corr_sol = corr_sol + driver_code
                            corr["solution"] = corr_sol
                            corr_modified = True
                            break
                            
                    # Reconstrói os blocos das correções de revisão
                    corr["solution_blocks"] = generate_blocks_from_solution(corr_sol, max_blocks=9)
                    
        # Salva o documento atualizado de volta no Firestore
        if modified:
            doc_ref = db.collection("problems").document(p_id)
            doc_ref.set(p_data)
            print(f"  [SUCESSO]: Documento de '{title}' atualizado com sucesso no Firestore!")
            updated_count += 1
            
    print(f"\n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO! {updated_count} questões saneadas no total. ===")

if __name__ == "__main__":
    main()
