from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import beecrowd, problems, ready_exercises, submissions, tutors, users
from app.config import settings

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

app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(users.router)
app.include_router(tutors.router)
app.include_router(beecrowd.router)
app.include_router(ready_exercises.router)

@app.on_event("startup")
def startup_event():
    logger = logging.getLogger(__name__)
    logger.info("FastAPI startup event triggered. Settings loaded from environment/local .env.")

@app.get("/health", tags=["health"])
@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
