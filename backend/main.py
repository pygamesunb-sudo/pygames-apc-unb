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

from a2wsgi import ASGIMiddleware

# Convert ASGI app to WSGI to run inside Firebase Functions (which uses WSGI/Flask under the hood)
wsgi_app = ASGIMiddleware(fastapi_app)

@https_fn.on_request()
def api(req: https_fn.Request) -> https_fn.Response:
    try:
        # Use Werkzeug's from_app to run the WSGI application and get the Response,
        # preserving streaming capabilities (buffered=False by default).
        return https_fn.Response.from_app(wsgi_app, req.environ)
    except Exception as e:
        logger.exception("Error processing request in Firebase Function api")
        return https_fn.Response(f"Internal Server Error: {e}", status=500)

