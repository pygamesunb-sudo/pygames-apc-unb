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
            # 1. Tenta usar as credenciais padrão do Google (ADC)
            import google.auth
            try:
                creds, project = google.auth.default()
                firebase_admin.initialize_app(credential=creds, options={'projectId': 'pygames-apc'})
                print("\n[conftest] Firebase inicializado com Application Default Credentials (ADC) com sucesso.")
            except Exception as adc_err:
                print(f"\n[conftest] Falha no ADC: {adc_err}. Tentando gcloud CLI...")
                # 2. Tenta gcloud CLI para obter token do usuario logado
                try:
                    import subprocess
                    token = subprocess.check_output(
                        ["gcloud", "auth", "print-access-token"], 
                        text=True, 
                        shell=True
                    ).strip()
                    from google.oauth2.credentials import Credentials
                    creds = Credentials(token=token)
                    firebase_admin.initialize_app(credential=creds, options={'projectId': 'pygames-apc'})
                    print("\n[conftest] Firebase inicializado via token do gcloud CLI.")
                except Exception as gcloud_err:
                    print(f"\n[conftest] Falha no gcloud CLI: {gcloud_err}. Tentando firebase-tools.json...")
                    # 3. Fallback para o firebase-tools.json se o gcloud CLI falhar
                    firebase_tools_path = r"C:\Users\jheff\.config\configstore\firebase-tools.json"
                    if os.path.exists(firebase_tools_path):
                        try:
                            with open(firebase_tools_path, "r", encoding="utf-8") as f:
                                data = json.load(f)
                            tokens = data.get("tokens", {})
                            refresh_token = tokens.get("refresh_token")
                            access_token = tokens.get("access_token")
                            client_id = data.get("user", {}).get("aud")
                            
                            from google.auth.transport.requests import Request
                            from google.oauth2.credentials import Credentials
                            creds = Credentials(
                                token=access_token,
                                refresh_token=refresh_token,
                                token_uri="https://oauth2.googleapis.com/token",
                                client_id=client_id,
                            )
                            try:
                                creds.refresh(Request())
                                print("\n[conftest] Token do Firebase de firebase-tools.json renovado.")
                            except Exception as refresh_err:
                                print(f"\n[conftest] Nao foi possivel renovar o token: {refresh_err}")
                            
                            firebase_admin.initialize_app(credential=creds, options={
                                'projectId': 'pygames-apc'
                            })
                            print("\n[conftest] Firebase inicializado via token do firebase-tools.json.")
                        except Exception as fb_tools_err:
                            print(f"\n[conftest] Falha no firebase-tools.json: {fb_tools_err}. Inicializando padrao...")
                            firebase_admin.initialize_app()
                    else:
                        print("\n[conftest] firebase-tools.json nao encontrado. Inicializando padrao...")
                        firebase_admin.initialize_app()


@pytest.fixture(autouse=True)
def reset_firebase_service_state():
    """Reseta flags de erro/fallback e limpa caches em memoria do firebase_service para isolar os testes."""
    from app.services import firebase_service
    firebase_service._use_local_fallback = False
    firebase_service._in_memory_users.clear()
    firebase_service._in_memory_submissions.clear()
    firebase_service._in_memory_db.clear()
    yield
    firebase_service._use_local_fallback = False
    firebase_service._in_memory_users.clear()
    firebase_service._in_memory_submissions.clear()
    firebase_service._in_memory_db.clear()

