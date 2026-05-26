import os
import sys
import subprocess
import importlib

def print_section(title):
    print("\n" + "=" * 60)
    print(f" {title.upper()} ")
    print("=" * 60)

def print_result(status, message, details=None):
    status_str = f"[{status}]"
    print(f"{status_str:<12} {message}")
    if details:
        print(f"             Details: {details}")

def main():
    print("============================================================")
    print("      PYGAME-APC - SISTEMA DE DIAGNOSTICO DE AMBIENTE       ")
    print("============================================================")

    # 1. Verificacao de Diretorios e Estrutura
    print_section("1. Estrutura de Diretorios")
    
    root_dirs = ["backend", "frontend", "docs"]
    for d in root_dirs:
        if os.path.isdir(d):
            print_result("OK", f"Diretorio '{d}' encontrado.")
        else:
            print_result("ERRO", f"Diretorio '{d}' nao encontrado.", f"Crie a pasta '{d}' na raiz do projeto.")

    # 2. Verificacao do Firebase
    print_section("2. Configuracao do Firebase")
    
    # firebase.json
    if os.path.isfile("firebase.json"):
        print_result("OK", "Arquivo 'firebase.json' encontrado.")
    else:
        print_result("PENDENTE", "Arquivo 'firebase.json' nao encontrado.", "Crie o arquivo na raiz ou rode 'firebase init hosting'.")

    # .firebaserc
    if os.path.isfile(".firebaserc"):
        print_result("OK", "Arquivo '.firebaserc' encontrado.")
    else:
        print_result("PENDENTE", "Arquivo '.firebaserc' nao encontrado.", "Crie o arquivo para vincular o projeto ao Firebase CLI.")

    # Firebase CLI
    import shutil
    firebase_path = shutil.which("firebase")
    if firebase_path:
        print_result("OK", "Firebase CLI instalado e acessivel.", f"Caminho: {firebase_path}")
    else:
        print_result("PENDENTE", "Firebase CLI nao encontrado no PATH.", "Certifique-se de que o firebase-tools esta instalado globalmente (npm install -g firebase-tools).")

    # 3. Verificacao do Backend (Python & Variaveis de Ambiente)
    print_section("3. Backend (FastAPI)")
    
    # backend/.env
    env_path = os.path.join("backend", ".env")
    if os.path.isfile(env_path):
        print_result("OK", "Arquivo 'backend/.env' encontrado.")
        # Ler e verificar chaves
        keys = {}
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    keys[k.strip()] = v.strip().strip('"').strip("'")
        
        # OPENROUTER_API_KEY
        if "OPENROUTER_API_KEY" in keys and keys["OPENROUTER_API_KEY"]:
            print_result("OK", "Chave OPENROUTER_API_KEY esta definida no backend/.env.")
        else:
            print_result("ERRO", "OPENROUTER_API_KEY esta vazia ou ausente no backend/.env.", "Insira sua chave do OpenRouter para a LLM funcionar.")
            
        # FIREBASE_CREDENTIALS_JSON
        if "FIREBASE_CREDENTIALS_JSON" in keys and keys["FIREBASE_CREDENTIALS_JSON"]:
            print_result("OK", "FIREBASE_CREDENTIALS_JSON configurado no backend/.env.")
        else:
            print_result("AVISO", "FIREBASE_CREDENTIALS_JSON nao configurado.", "O Firestore usará fallback com banco local/temporario (sem persistencia real).")
    else:
        print_result("PENDENTE", "Arquivo 'backend/.env' nao encontrado.", "Copie 'backend/.env.example' para 'backend/.env' e configure as chaves.")

    # Dependencias do Python
    required_packages = {
        "fastapi": "fastapi",
        "uvicorn": "uvicorn",
        "pydantic": "pydantic",
        "httpx": "httpx",
        "firebase_admin": "firebase-admin",
        "pytest": "pytest",
        "pytest_asyncio": "pytest-asyncio"
    }
    
    missing_packages = []
    for module_name, pip_name in required_packages.items():
        try:
            importlib.import_module(module_name)
            print_result("OK", f"Modulo Python '{pip_name}' importado com sucesso.")
        except ImportError:
            print_result("ERRO", f"Modulo Python '{pip_name}' nao encontrado.", f"Execute: pip install {pip_name}")
            missing_packages.append(pip_name)

    if missing_packages:
        print_result("PENDENTE", "Dependencias do backend estao incompletas.", f"Instale as dependencias em falta usando: pip install -r backend/requirements.txt")

    # 4. Verificacao do Executor de Codigo (Subprocesso Python)
    print_section("4. Seguranca e Executor de Codigo (Subprocess)")
    
    test_code = "print(10 + 20)"
    try:
        proc = subprocess.run(
            [sys.executable, "-c", test_code],
            capture_output=True,
            text=True,
            timeout=3
        )
        if proc.stdout.strip() == "30":
            print_result("OK", "Executor de subprocessos Python esta funcionando perfeitamente.")
        else:
            print_result("ERRO", "Subprocesso Python retornou valor incorreto.", f"Retorno: {proc.stdout.strip()}")
    except Exception as e:
        print_result("ERRO", "Falha ao rodar subprocesso Python de teste.", str(e))

    # 5. Verificacao do Frontend (Vite & React)
    print_section("5. Frontend (Vite & React)")
    
    # frontend/.env
    fe_env_path = os.path.join("frontend", ".env")
    if os.path.isfile(fe_env_path):
        print_result("OK", "Arquivo 'frontend/.env' encontrado.")
        with open(fe_env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "VITE_API_URL" in line:
                    print_result("OK", f"Configuracao encontrada: {line.strip()}")
                    break
            else:
                print_result("AVISO", "VITE_API_URL nao configurada explicitamente no frontend/.env.")
    else:
        print_result("PENDENTE", "Arquivo 'frontend/.env' nao encontrado.", "Copie 'frontend/.env.example' para 'frontend/.env'.")

    # node_modules
    node_modules_path = os.path.join("frontend", "node_modules")
    if os.path.isdir(node_modules_path):
        print_result("OK", "Diretorio 'frontend/node_modules' existe.")
    else:
        print_result("PENDENTE", "Pasta 'frontend/node_modules' nao encontrada.", "Execute: npm install dentro da pasta frontend/ (ou rode a partir da raiz: npm install --prefix frontend)")

    print("\n" + "=" * 60)
    print(" DIAGNOSTICO CONCLUIDO! ")
    print(" Revise os avisos de status [PENDENTE] ou [ERRO] acima para concluir sua implementacao.")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
