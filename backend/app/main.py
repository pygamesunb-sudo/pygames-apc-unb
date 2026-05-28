from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import problems, submissions, users
from app.config import settings

# Padrao de logs usado por toda a API para facilitar leitura no console.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    # Metadados exibidos na documentacao automatica (/docs).
    title="Pygame-APC API",
    description="API para geracao de problemas de programacao via LLM.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    # Permite frontend local e hospedado consumirem a API no navegador.
    allow_origins=["http://localhost:5173", "https://pygame-apc.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registro das rotas separadas por dominio de negocio.
app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(users.router)

@app.on_event("startup")
def startup_event():
    # Apenas log informativo para confirmar boot e carregamento de configuracoes.
    logger = logging.getLogger(__name__)
    logger.info("FastAPI startup event triggered. Settings loaded from environment/local .env.")

@app.get("/health", tags=["health"])
async def health_check():
    # Endpoint simples para monitoramento e teste rapido de disponibilidade.
    return {"status": "ok", "version": "0.1.0"}
