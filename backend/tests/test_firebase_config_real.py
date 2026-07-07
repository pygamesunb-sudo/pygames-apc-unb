import os
import json
import pytest
import firebase_admin
from firebase_admin import credentials, firestore
from google.oauth2.credentials import Credentials as GoogleCredentials

def get_direct_access_token():
    user_profile = os.environ.get("USERPROFILE")
    config_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
    if not os.path.exists(config_path):
        pytest.skip("Firebase CLI não está logado ou instalado localmente.")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    return config["tokens"]["access_token"]

@pytest.mark.asyncio
async def test_system_config_env_exists_in_firestore():
    """Garante que a coleção system_config e o documento env existam no Firestore real."""
    token = get_direct_access_token()
    creds = GoogleCredentials(token)
    
    if not firebase_admin._apps:
        firebase_admin.initialize_app(
            credential=creds,
            options={"projectId": "pygames-apc"}
        )
        
    db = firestore.client()
    
    doc_ref = db.collection("system_config").document("env").get(timeout=10.0)
    
    # Este assert vai falhar se o documento não existir no Firestore real,
    # revelando o problema real no backend do Firebase.
    assert doc_ref.exists, "O documento 'system_config/env' não existe no Firestore real!"
    
    data = doc_ref.to_dict()
    assert "OPENROUTER_API_KEY" in data, "OPENROUTER_API_KEY está ausente no Firestore!"
    assert data["OPENROUTER_API_KEY"], "OPENROUTER_API_KEY está vazia no Firestore!"
