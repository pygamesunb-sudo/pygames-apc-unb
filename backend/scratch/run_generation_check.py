import asyncio
import sys
import os

# Adiciona o diretório backend ao sys.path para permitir importações corretas
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
settings.load_from_firebase()

from app.services.llm_generator import generate_problem_stream

async def run_check():
    print("Iniciando verificação de geração de problema...")
    try:
        async for chunk in generate_problem_stream("Recursão", "facil", use_custom_key=False):
            print("CHUNK RECEBIDO:")
            print(chunk)
    except Exception as e:
        print(f"Erro capturado na execução: {e}")

if __name__ == "__main__":
    asyncio.run(run_check())
