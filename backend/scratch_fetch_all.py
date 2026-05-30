import os
import json
import httpx
import firebase_admin
from firebase_admin import credentials, firestore
from google.oauth2.credentials import Credentials as GoogleCredentials

def get_access_token():
    # 1. Carrega refresh token do config do Firebase CLI
    user_profile = os.environ.get("USERPROFILE")
    config_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
    
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
        
    refresh_token = config["tokens"]["refresh_token"]
    
    # 2. Faz o refresh do token usando a API do Google OAuth2
    # Client ID e Client Secret oficiais do Firebase CLI
    client_id = "563584335869-5stnv87v19q76pda65745963237s9ekb.apps.googleusercontent.com"
    client_secret = "j9i1rJg2ec7nFup1vVE56gCo"
    
    url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token",
        "refresh_token": refresh_token
    }
    
    print("Efetuando refresh do token OAuth2...")
    res = httpx.post(url, json=payload)
    res.raise_for_status()
    token_data = res.json()
    
    return token_data["access_token"]

def main():
    try:
        access_token = get_access_token()
        print("Token obtido com sucesso! Inicializando Firebase Admin SDK...")
        
        # 3. Inicializa Firebase Admin usando as credenciais do token
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
