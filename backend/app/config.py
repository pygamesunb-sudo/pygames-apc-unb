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
            from firebase_admin import credentials, firestore

            # Verifica se o Firebase Admin SDK ja foi inicializado por este ou outro modulo
            if not firebase_admin._apps:
                try:
                    if os.path.exists(self.fb_credentials_path):
                        cred = credentials.Certificate(self.fb_credentials_path)
                        firebase_admin.initialize_app(cred)
                    else:
                        try:
                            # Tenta usar as credenciais padrão do GCP/Firebase (produção)
                            firebase_admin.initialize_app()
                        except Exception:
                            # Fallback local sem credenciais
                            import google.auth.credentials
                            firebase_admin.initialize_app(
                                credential=google.auth.credentials.AnonymousCredentials(),
                                options={
                                    'projectId': self.firebase_project_id
                                }
                            )
                except Exception as e:
                    print(f"[Config] Nao foi possivel inicializar o Firebase Admin SDK: {e}")
                    return

            try:
                db = firestore.client()
                doc_ref = db.collection("system_config").document("env").get(timeout=3.0)
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

        # Executa em uma thread separada com um timeout limite para nao bloquear a inicializacao
        t = threading.Thread(target=run_load)
        t.daemon = True
        t.start()
        t.join(timeout=3.0)
        if t.is_alive():
            print("[Config] Aviso: A busca de configuracoes no Firestore expirou (timeout de 3s). Continuando com .env local.")

settings = Settings()
