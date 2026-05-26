# Pygame-APC

Aplicativo de desafios de programacao com geracao de problemas via LLM, do nivel iniciante ao competitivo.

## Visao Geral

O Pygame-APC gera problemas de programacao personalizados com base nos interesses do usuario, usando uma pipeline com tres agentes LLM (gerador + 2 revisores). A interface oferece tres modalidades de resolucao: blocos pre-montados, blocos livres e digitacao livre.

## Tecnologias

- **Backend:** Python 3.11+, FastAPI, Firebase Admin SDK
- **Frontend:** React (Vite), Monaco Editor
- **LLM:** OpenRouter (nvidia/llama-3.1-nemotron-ultra-253b:free)
- **Banco de Dados:** Firebase Firestore

## Estrutura de Pastas

```
pygame-apc/
├── docs/          # Documentacao, sprints e design
├── backend/       # API FastAPI
└── frontend/      # Interface React
```

## Como Rodar Localmente

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env      # Preencha as variaveis
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env      # Preencha a URL da API
npm run dev
```

## Variaveis de Ambiente

Consulte os arquivos `.env.example` no `backend/` e no `frontend/`.
