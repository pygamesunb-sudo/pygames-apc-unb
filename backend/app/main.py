from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.routers import problems, submissions, users
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://pygame-apc.web.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(problems.router)
app.include_router(submissions.router)
app.include_router(users.router)



@app.get("/health", tags=["health"])
async def health_check():
    # Force uvicorn reload to load the new TESTING_BYPASS_AUTH from .env
    return {"status": "ok", "version": "0.1.0"}
