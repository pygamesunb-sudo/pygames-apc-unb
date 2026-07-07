import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve o caminho do arquivo .env dinamicamente baseado na localizacao do config.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8")

    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3-super-120b-a12b:free"
    fb_credentials_path: str = "./firebase_credentials.json"
    firebase_project_id: str = "pygames-apc"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    testing_bypass_auth: bool = False

    def load_from_firebase(self):
        """
        Carrega configuracoes do .env direto do Firebase Firestore para permitir
        armazenamento de variaveis confidenciais na nuvem de forma segura.
        """
        import threading

        def run_load():
            import firebase_admin
            from firebase_admin import credentials as fb_credentials, firestore
            import os
            import json

            # Verifica se o Firebase Admin SDK ja foi inicializado por este ou outro modulo
            if not firebase_admin._apps:
                try:
                    if os.path.exists(self.fb_credentials_path):
                        cred = fb_credentials.Certificate(self.fb_credentials_path)
                        firebase_admin.initialize_app(cred)
                        print("[Config] Firebase Admin SDK inicializado via arquivo de credenciais.")
                    else:
                        initialized = False
                        
                        # 1. Tenta usar as credenciais padrão do Google (ADC)
                        import google.auth
                        try:
                            creds, project = google.auth.default()
                            firebase_admin.initialize_app(credential=creds, options={'projectId': self.firebase_project_id})
                            initialized = True
                            print("[Config] Firebase Admin SDK inicializado com Application Default Credentials (ADC).")
                        except Exception as adc_err:
                            print(f"[Config] Falha no ADC: {adc_err}. Tentando gcloud CLI...")
                            
                        # 2. Tenta gcloud CLI para obter token do usuario logado
                        if not initialized:
                            try:
                                import subprocess
                                token = subprocess.check_output(
                                    ["gcloud", "auth", "print-access-token"], 
                                    text=True, 
                                    shell=True
                                ).strip()
                                from google.oauth2.credentials import Credentials
                                creds = Credentials(token=token)
                                firebase_admin.initialize_app(credential=creds, options={'projectId': self.firebase_project_id})
                                initialized = True
                                print("[Config] Firebase Admin SDK inicializado via token do gcloud CLI.")
                            except Exception as gcloud_err:
                                print(f"[Config] Falha no gcloud CLI: {gcloud_err}. Tentando firebase-tools.json...")

                        # 3. Fallback para o firebase-tools.json com suporte a refresh token
                        if not initialized:
                            user_profile = os.environ.get("USERPROFILE") or os.path.expanduser("~")
                            firebase_tools_path = os.path.join(user_profile, ".config", "configstore", "firebase-tools.json")
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
                                        print("[Config] Token do Firebase de firebase-tools.json renovado.")
                                    except Exception as refresh_err:
                                        print(f"[Config] Nao foi possivel renovar o token: {refresh_err}. Usando access_token atual.")
                                        creds = Credentials(token=access_token)
                                        
                                    firebase_admin.initialize_app(credential=creds, options={'projectId': self.firebase_project_id})
                                    initialized = True
                                    print("[Config] Firebase Admin SDK inicializado via token do firebase-tools.json.")
                                except Exception as fb_tools_err:
                                    print(f"[Config] Falha no firebase-tools.json: {fb_tools_err}")
                                    
                        if not initialized:
                            # Fallback local sem credenciais (Anonymous)
                            import google.auth.credentials
                            firebase_admin.initialize_app(
                                credential=google.auth.credentials.AnonymousCredentials(),
                                options={
                                    'projectId': self.firebase_project_id
                                }
                            )
                            print("[Config] Firebase Admin SDK inicializado em modo Anonimo (sem acesso ao Firestore real).")
                except Exception as e:
                    print(f"[Config] Nao foi possivel inicializar o Firebase Admin SDK: {e}")
                    return

            try:
                db = firestore.client()
                doc_ref = db.collection("system_config").document("env").get(timeout=5.0)
                if doc_ref.exists:
                    firebase_env = doc_ref.to_dict()
                    for key, value in firebase_env.items():
                        key_lower = key.lower()
                        if hasattr(self, key_lower):
                            setattr(self, key_lower, value)
                        # Sincroniza também com o os.environ para consistencia no processo
                        os.environ[key.upper()] = str(value)
                    print("[Config] Variaveis de ambiente (.env) carregadas com sucesso do Firebase Firestore (colecao: system_config/env).")
                else:
                    print("[Config] Aviso: O documento 'system_config/env' nao foi encontrado no Firestore. Usando .env local.")
            except Exception as e:
                print(f"[Config] Aviso: Erro ao carregar configuracoes do Firestore (usando .env local): {e}")

        # Executa de forma sincrona para garantir que as configuracoes estejam prontas na inicializacao
        run_load()

settings = Settings()

# Evita carregar automaticamente do Firebase durante a execução de testes
import sys
if "pytest" not in sys.modules and "unittest" not in sys.modules and not os.environ.get("PYTEST_CURRENT_TEST"):
    settings.load_from_firebase()

