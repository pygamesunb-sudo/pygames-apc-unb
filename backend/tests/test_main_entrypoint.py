import pytest
from unittest.mock import MagicMock
import sys
import os

# Adiciona o diretorio pai ao path para permitir imports corretos do main.py
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import api

def test_firebase_function_api_entrypoint():
    # Cria um mock Request com o dicionario WSGI do FastAPI
    mock_request = MagicMock()
    mock_request.environ = {
        'REQUEST_METHOD': 'GET',
        'SCRIPT_NAME': '',
        'PATH_INFO': '/health',
        'QUERY_STRING': '',
        'SERVER_NAME': 'localhost',
        'SERVER_PORT': '80',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'http',
        'wsgi.input': MagicMock(),
        'wsgi.errors': MagicMock(),
        'wsgi.multithread': False,
        'wsgi.multiprocess': False,
        'wsgi.run_once': False,
    }
    
    # Executa a funcao de entrada do Firebase Functions
    response = api(mock_request)
    
    # Verifica se respondeu corretamente utilizando o app FastAPI
    assert response is not None
    assert response.status_code == 200
    assert b"ok" in response.data
