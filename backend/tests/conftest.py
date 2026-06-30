import os
import json
import pytest
import firebase_admin
from google.oauth2.credentials import Credentials

# Configure environment variables before FastAPI gets loaded/initialized
os.environ["TESTING_BYPASS_AUTH"] = "true"
os.environ["GOOGLE_CLOUD_PROJECT"] = "pygames-apc"

@pytest.fixture(scope="session", autouse=True)
def setup_firebase():
    """Inicializa o firebase_admin para testes reais usando credenciais de arquivo ou OAuth token local."""
    # Garante que as configuracoes do app usem bypass de autenticacao
    from app.config import settings
    settings.testing_bypass_auth = True
    
    if not firebase_admin._apps:
        cred_path = settings.fb_credentials_path
        if os.path.exists(cred_path):
            from firebase_admin import credentials as fb_credentials
            cred = fb_credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            print("\n[conftest] Firebase inicializado com arquivo de credenciais.")
        else:
            firebase_tools_path = r"C:\Users\jheff\.config\configstore\firebase-tools.json"
            if os.path.exists(firebase_tools_path):
                try:
                    with open(firebase_tools_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    tokens = data.get("tokens", {})
                    refresh_token = tokens.get("refresh_token")
                    access_token = tokens.get("access_token")
                    client_id = data.get("user", {}).get("aud")
                    
                    creds = Credentials(
                        token=access_token,
                        refresh_token=refresh_token,
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=client_id,
                    )
                    firebase_admin.initialize_app(credential=creds, options={
                        'projectId': 'pygames-apc'
                    })
                    print("\n[conftest] Firebase inicializado via token OAuth do firebase-tools.json.")
                except Exception as e:
                    print(f"\n[conftest] Falha ao ler token OAuth: {e}. Tentando inicializar padrao.")
                    firebase_admin.initialize_app()
            else:
                print("\n[conftest] firebase-tools.json nao encontrado. Tentando inicializar padrao.")
                firebase_admin.initialize_app()
