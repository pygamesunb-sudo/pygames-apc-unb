import sys
import os
import logging
import asyncio
from firebase_functions import https_fn
from firebase_functions.options import MemoryOption
from firebase_functions.params import SecretParam

# Valor fica no Secret Manager. Nao entra no codigo, no Git nem no frontend.
OPENROUTER_API_KEY = SecretParam("OPENROUTER_API_KEY")

# Ensure the backend directory is in the system path so imports work correctly
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app as fastapi_app

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_asgi(asgi_app, req: https_fn.Request) -> https_fn.Response:
    # Build the ASGI scope from the Werkzeug/Firebase Request
    headers = []
    for key, value in req.headers.items():
        headers.append((key.lower().encode('latin-1'), value.encode('latin-1')))

    query_string = req.query_string or b""
    if isinstance(query_string, str):
        query_string = query_string.encode("latin-1")

    scope = {
        'type': 'http',
        'asgi': {'version': '3.0', 'spec_version': '2.0'},
        'http_version': '1.1',
        'method': req.method,
        'path': req.path,
        'raw_path': req.path.encode('utf-8'),
        'query_string': query_string,
        'headers': headers,
        'server': (req.host or 'localhost', 80),
        'client': (req.remote_addr or '127.0.0.1', 0),
    }

    body = req.get_data()
    body_received = False

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

    async def send(message):
        nonlocal response_status, response_headers
        if message['type'] == 'http.response.start':
            response_status = message['status']
            for key, val in message.get('headers', []):
                response_headers.append((key.decode('latin-1'), val.decode('latin-1')))
        elif message['type'] == 'http.response.body':
            response_body.append(message.get('body', b''))

    await asgi_app(scope, receive, send)

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

@https_fn.on_request(
    timeout_sec=300,
    memory=MemoryOption.MB_512,
    invoker="public",
    secrets=[OPENROUTER_API_KEY],
)
def api(req: https_fn.Request) -> https_fn.Response:
    try:
        # Run the ASGI app using asyncio.run to avoid nested event loop deadlocks
        return asyncio.run(run_asgi(fastapi_app, req))
    except Exception as e:
        logger.exception("Error processing request in Firebase Function api")
        return https_fn.Response(f"Internal Server Error: {e}", status=500)
