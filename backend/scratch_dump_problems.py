import asyncio
import json
import os
import sys

# Ensure backend directory is in the import path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.config import settings
from app.services import firebase_service

async def main():
    print("Iniciando conexão com Firestore...")
    db = firebase_service.get_db()
    if db is None:
        print("Erro: Não foi possível conectar ao Firestore. O fallback local está ativo.")
        return

    print("Buscando problemas da coleção 'problems'...")
    try:
        docs = db.collection("problems").get(timeout=10.0)
        problems = []
        for doc in docs:
            p_data = doc.to_dict()
            p_data["problem_id"] = doc.id
            problems.append(p_data)
        
        print(f"Sucesso! Encontrados {len(problems)} problemas.")
        
        # Salva em JSON local
        dump_path = os.path.join(os.path.dirname(__file__), "problems_dump.json")
        with open(dump_path, "w", encoding="utf-8") as f:
            json.dump(problems, f, indent=2, ensure_ascii=False)
        print(f"Os problemas foram salvos em: {dump_path}")
        
    except Exception as e:
        print(f"Ocorreu um erro ao obter os problemas: {e}")

if __name__ == "__main__":
    asyncio.run(main())
