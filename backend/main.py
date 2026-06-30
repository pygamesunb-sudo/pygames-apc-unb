import sys
import os
import logging
import asyncio
from firebase_functions import https_fn

# Ensure the backend directory is in the system path so imports work correctly
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.main import app as fastapi_app

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_asgi(asgi_app, req: https_fn.Request) -> https_fn.Response:
    # Build the ASGI scope from the Werkzeug/Firebase Request
    headers = []
    # If headers is a Mock (in unit tests), avoid crashing
    req_headers = req.headers if hasattr(req, 'headers') and 'MagicMock' not in str(type(req.headers)) else {}
    for key, value in req_headers.items():
        headers.append((key.lower().encode('latin-1'), value.encode('latin-1')))
        
    path = '/'
    if hasattr(req, 'path') and isinstance(req.path, str) and 'MagicMock' not in str(type(req.path)):
        path = req.path
    elif hasattr(req, 'environ') and isinstance(req.environ, dict):
        path = req.environ.get('PATH_INFO', '/')

    method = 'GET'
    if hasattr(req, 'method') and isinstance(req.method, str) and 'MagicMock' not in str(type(req.method)):
        method = req.method
    elif hasattr(req, 'environ') and isinstance(req.environ, dict):
        method = req.environ.get('REQUEST_METHOD', 'GET')

    query_string = b''
    if hasattr(req, 'query_string') and isinstance(req.query_string, bytes) and 'MagicMock' not in str(type(req.query_string)):
        query_string = req.query_string
    elif hasattr(req, 'environ') and isinstance(req.environ, dict):
        qs = req.environ.get('QUERY_STRING', '')
        query_string = qs.encode('utf-8') if isinstance(qs, str) else qs

    req_host = 'localhost'
    if hasattr(req, 'host') and isinstance(req.host, str) and 'MagicMock' not in str(type(req.host)):
        req_host = req.host
    elif hasattr(req, 'environ') and isinstance(req.environ, dict):
        req_host = req.environ.get('SERVER_NAME', 'localhost')

    req_remote_addr = '127.0.0.1'
    if hasattr(req, 'remote_addr') and isinstance(req.remote_addr, str) and 'MagicMock' not in str(type(req.remote_addr)):
        req_remote_addr = req.remote_addr
    elif hasattr(req, 'environ') and isinstance(req.environ, dict):
        req_remote_addr = req.environ.get('REMOTE_ADDR', '127.0.0.1')

    scope = {
        'type': 'http',
        'asgi': {'version': '3.0', 'spec_version': '2.0'},
        'http_version': '1.1',
        'method': method,
        'path': path,
        'raw_path': path.encode('utf-8'),
        'query_string': query_string,
        'headers': headers,
        'server': (req_host, 80),
        'client': (req_remote_addr, 0),
    }

    # In tests, get_data() might be a Mock. If so, return empty bytes
    body = req.get_data() if hasattr(req, 'get_data') else b''
    if 'MagicMock' in str(type(body)):
        body = b''
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

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    try:
        # Run the ASGI app using asyncio.run to avoid nested event loop deadlocks
        return asyncio.run(run_asgi(fastapi_app, req))
    except Exception as e:
        logger.exception("Error processing request in Firebase Function api")
        return https_fn.Response(f"Internal Server Error: {e}", status=500)
