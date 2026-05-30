import os
import json
import firebase_admin
from firebase_admin import credentials, firestore
from google.oauth2.credentials import Credentials as GoogleCredentials

def main():
    try:
        # 1. Carrega access token diretamente do config do Firebase CLI
        user_profile = os.environ.get("USERPROFILE")
        config_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
        
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
            
        access_token = config["tokens"]["access_token"]
        print("Token carregado do config do Firebase CLI! Inicializando Firebase Admin SDK...")
        
        # 2. Inicializa Firebase Admin usando o token direto
        creds = GoogleCredentials(access_token)
        
        if not firebase_admin._apps:
            firebase_admin.initialize_app(
                credential=creds,
                options={
                    "projectId": "pygames-apc"
                }
            )
        
        db = firestore.client()
        print("Conectado ao Firestore! Buscando coleção 'problems'...")
        
        docs = db.collection("problems").get()
        problems = []
        for doc in docs:
            p_data = doc.to_dict()
            p_data["problem_id"] = doc.id
            problems.append(p_data)
            
        print(f"Sucesso! Encontrados {len(problems)} problemas no Firestore.")
        
        # Salva localmente em JSON
        dump_path = os.path.join(os.path.dirname(__file__), "problems_dump.json")
        with open(dump_path, "w", encoding="utf-8") as f:
            json.dump(problems, f, indent=2, ensure_ascii=False)
            
        print(f"Dados salvos com sucesso em: {dump_path}")
        
    except Exception as e:
        print(f"Ocorreu um erro no processo: {e}")

if __name__ == "__main__":
    main()
