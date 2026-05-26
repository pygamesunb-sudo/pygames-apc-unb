import os
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve o caminho do arquivo .env dinamicamente baseado na localizacao do config.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ENV_PATH, env_file_encoding="utf-8")

    openrouter_api_key: str = ""
    openrouter_model: str = "nvidia/llama-3.1-nemotron-ultra-253b:free"
    firebase_credentials_path: str = "./firebase_credentials.json"
    api_host: str = "0.0.0.0"
    api_port: int = 8000


settings = Settings()
