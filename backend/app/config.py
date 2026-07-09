"""
Configuracoes centralizadas (Pydantic Settings).

Carrega backend/.env e, em producao, sobrescreve secrets do Firestore system_config/env.
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve o caminho do arquivo .env dinamicamente baseado na localizacao do config.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

_firebase_loaded = False  # Evita recarregar configs do Firestore mais de uma vez


class Settings(BaseSettings):
    """Variaveis de ambiente tipadas — mapeiam chaves do .env automaticamente."""

    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8")

    # --- LLM (OpenRouter) ---
    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/nemotron-3-super-120b-a12b:free"

    # --- Firebase ---
    fb_credentials_path: str = "./firebase_credentials.json"
    firebase_project_id: str = "pygames-apc"
    firebase_web_api_key: str = ""  # Chave publica do Web SDK (validacao REST de tokens)

    # --- Servidor ---
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    testing_bypass_auth: bool = False  # True apenas em testes locais
    skip_firestore_bootstrap: bool = False  # True em dev local sem service account

    def load_from_firebase(self):
        """
        Carrega configuracoes do .env direto do Firebase Firestore para permitir
        armazenamento de variaveis confidenciais na nuvem de forma segura.
        """
        global _firebase_loaded
        if _firebase_loaded:
            return
        _firebase_loaded = True

        if self.skip_firestore_bootstrap or not os.path.exists(self.fb_credentials_path):
            print("[Config] Bootstrap do Firestore ignorado (dev local). Usando .env local.")
            return

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

                        # Em dev local sem service account, nao tenta ADC/gcloud (evita travamento gRPC)
                        if not initialized:
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

        # Carrega em background para nao bloquear o startup do Uvicorn
        threading.Thread(target=run_load, daemon=True).start()

settings = Settings()  # Singleton importado por toda a aplicacao
