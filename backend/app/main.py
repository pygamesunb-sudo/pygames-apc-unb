"""Sobe a API FastAPI, libera o CORS do frontend e registra as rotas.

Branch comment: leitura academica do codigo, sem mudar o comportamento.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from app.routers import beecrowd, problems, ready_exercises, submissions, tutors, users
from app.config import ENV_PATH, settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Pygame-APC API",
    description="API para geracao de problemas de programacao via LLM.",
    version="0.1.0",
)


def _cors_origins() -> list[str]:
    """Localhost para desenvolvimento. Origens extras vem de CORS_ORIGINS.

    No Firebase Hosting, o frontend e /api/** ficam no mesmo dominio, entao o
    navegador nao exige CORS para essas chamadas.
    """
    local_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://pygamesapcprojeto.web.app",
        "https://pygamesapcprojeto.firebaseapp.com",
    ]
    extra = [
        origin.strip()
        for origin in (settings.cors_origins or "").split(",")
        if origin.strip()
    ]
    origins: list[str] = []
    for origin in local_origins + extra:
        if origin not in origins:
            origins.append(origin)
    return origins


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cada router cuida de um dominio. O prefixo de URL fica no proprio arquivo.
app.include_router(problems.router)         # geracao e validacao de exercicios
app.include_router(submissions.router)      # execucao do codigo do aluno
app.include_router(users.router)            # perfil, ranking e placar de aprendizados
app.include_router(tutors.router)           # tutores agentes de aprendizagem
app.include_router(beecrowd.router)         # fonte externa isolada
app.include_router(ready_exercises.router)  # catalogo interno de exercicios prontos

@app.on_event("startup")
def startup_event():
    logger = logging.getLogger(__name__)
    env_loaded = os.path.isfile(ENV_PATH)
    openrouter = (settings.openrouter_api_key or "").strip()
    openrouter_state = "definida" if openrouter and openrouter != "sua_chave_aqui" else "vazia"
    credentials_path = settings.resolved_credentials_path()
    credentials_state = "encontrada" if credentials_path and os.path.isfile(credentials_path) else "ausente"
    logger.info(
        "Ambiente local: env_file=%s projeto=%s openrouter=%s credencial_firebase=%s",
        "carregado" if env_loaded else "ausente",
        settings.resolved_firebase_project_id() or "ausente",
        openrouter_state,
        credentials_state,
    )

@app.get("/health", tags=["health"])
@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
