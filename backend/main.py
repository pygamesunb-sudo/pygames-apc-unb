import sys
import os
import logging
import asyncio
from firebase_functions import https_fn

# Garante que os modulos do backend possam ser importados mesmo em ambientes serverless.
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app as fastapi_app

# Configuracao basica de logs para facilitar diagnostico no Firebase.
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_asgi(asgi_app, req: https_fn.Request) -> https_fn.Response:
    # Converte a requisicao do Firebase para o formato ASGI esperado pelo FastAPI.
    headers = []
    for key, value in req.headers.items():
        headers.append((key.lower().encode('latin-1'), value.encode('latin-1')))
        
    scope = {
        'type': 'http',
        'asgi': {'version': '3.0', 'spec_version': '2.0'},
        'http_version': '1.1',
        'method': req.method,
        'path': req.path,
        'raw_path': req.path.encode('utf-8'),
        'query_string': req.query_string,
        'headers': headers,
        'server': (req.host or 'localhost', 80),
        'client': (req.remote_addr or '127.0.0.1', 0),
    }

    # Corpo bruto da requisicao HTTP recebida.
    body = req.get_data()
    body_received = False

    # Funcao ASGI que entrega o corpo da requisicao uma unica vez.
    async def receive():
        nonlocal body_received
        if not body_received:
            body_received = True
            return {
                'type': 'http.request',
                'body': body,
                'more_body': False
            }
        else:
            return {
                'type': 'http.disconnect'
            }

    response_status = 200
    response_headers = []
    response_body = []

    # Funcao ASGI que captura status, headers e corpo da resposta do FastAPI.
    async def send(message):
        nonlocal response_status, response_headers
        if message['type'] == 'http.response.start':
            response_status = message['status']
            for key, val in message.get('headers', []):
                response_headers.append((key.decode('latin-1'), val.decode('latin-1')))
        elif message['type'] == 'http.response.body':
            response_body.append(message.get('body', b''))

    await asgi_app(scope, receive, send)

    # Filtra headers que o ambiente de execucao calcula automaticamente.
    headers_dict = {}
    for k, v in response_headers:
        if k.lower() not in ['content-length', 'transfer-encoding']:
            headers_dict[k] = v

    full_body = b''.join(response_body)
    return https_fn.Response(
        response=full_body,
        status=response_status,
        headers=headers_dict
    )

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    try:
        # Executa o app ASGI de forma segura para evitar conflitos de loop assíncrono.
        return asyncio.run(run_asgi(fastapi_app, req))
    except Exception as e:
        logger.exception("Error processing request in Firebase Function api")
        return https_fn.Response(f"Internal Server Error: {e}", status=500)
