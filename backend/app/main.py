"""
Aplicacao principal FastAPI do Pygame-APC.

Responsabilidades:
- Configurar CORS para o frontend (Vite local e Firebase Hosting)
- Registrar todos os routers da API
- Carregar variaveis de ambiente do Firestore no startup
- Expor endpoint de health check
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import problems, submissions, users, payments
from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

# Instancia central da API — documentacao automatica em /docs
app = FastAPI(
    title="Pygame-APC API",
    description="API para geracao de problemas de programacao via LLM.",
    version="0.1.0",
)

# Permite requisicoes do frontend React com credenciais (cookies/tokens)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://pygame-apc.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Registro de rotas por dominio ---
app.include_router(problems.router)      # Geracao e validacao de problemas
app.include_router(submissions.router)   # Execucao de codigo do usuario
app.include_router(users.router)         # Perfil, ranking e pontuacao
app.include_router(payments.router)      # Pagamentos PIX (Mercado Pago)


@app.on_event("startup")
def startup_event():
    """Carrega secrets do Firestore em background (nao bloqueia requests)."""
    logger = logging.getLogger(__name__)
    logger.info("FastAPI startup — carregando configuracoes remotas em background...")
    settings.load_from_firebase()


@app.get("/health", tags=["health"])
async def health_check():
    """Endpoint simples para monitoramento e verificacao de deploy."""
    return {"status": "ok", "version": "0.1.0"}
