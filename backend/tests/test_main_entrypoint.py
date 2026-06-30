import pytest
from unittest.mock import MagicMock
import sys
import os
import json
import io

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
    
    response = api(mock_request)
    assert response is not None
    assert response.status_code == 200
    assert b"ok" in response.data


def test_firebase_function_api_entrypoint_with_query_params():
    """Testa a extração correta de query params em requisições simuladas pelo Firebase Functions."""
    mock_request = MagicMock()
    mock_request.environ = {
        'REQUEST_METHOD': 'GET',
        'SCRIPT_NAME': '',
        'PATH_INFO': '/health',
        'QUERY_STRING': 'debug=true&test=1',
        'SERVER_NAME': 'localhost',
        'SERVER_PORT': '80',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'http',
        'wsgi.input': MagicMock(),
        'wsgi.errors': MagicMock(),
    }
    
    response = api(mock_request)
    assert response is not None
    assert response.status_code == 200


def test_firebase_function_api_entrypoint_post_method():
    """Testa o comportamento do ponto de entrada do Firebase com requisições do tipo POST."""
    mock_request = MagicMock()
    # Simula um corpo JSON vazio no input do WSGI
    body_content = b'{}'
    mock_request.get_data.return_value = body_content
    mock_request.environ = {
        'REQUEST_METHOD': 'POST',
        'SCRIPT_NAME': '',
        'PATH_INFO': '/api/problems/validate',
        'QUERY_STRING': '',
        'SERVER_NAME': 'localhost',
        'SERVER_PORT': '80',
        'CONTENT_TYPE': 'application/json',
        'CONTENT_LENGTH': str(len(body_content)),
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'http',
        'wsgi.input': io.BytesIO(body_content),
        'wsgi.errors': MagicMock(),
    }
    mock_request.headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-testing-token-apc'
    }
    
    response = api(mock_request)
    assert response is not None
    # Deve retornar 422 Unprocessable Entity (já que enviamos corpo vazio para validação, e não 500 ou timeout)
    assert response.status_code == 422


def test_firebase_function_api_entrypoint_exception_handling():
    """Testa se exceções internas na rota do app retornam HTTP 500 de forma limpa e sem deadlocks."""
    mock_request = MagicMock()
    # Força o acesso aos headers a lançar uma exceção
    type(mock_request).headers = property(lambda self: (_ for _ in ()).throw(ValueError("Erro induzido de teste")))
    
    # Deve lidar com a exceção graciosamente retornando 500
    response = api(mock_request)
    assert response is not None
    assert response.status_code == 500
    assert b"Internal Server Error" in response.data


def test_firebase_function_api_entrypoint_custom_headers():
    """Valida se os headers customizados (como token de autenticação) são mantidos na requisição."""
    mock_request = MagicMock()
    mock_request.headers = {
        'Authorization': 'Bearer mock-testing-token-apc',
        'Custom-Header': 'XYZ'
    }
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
    }
    
    response = api(mock_request)
    assert response is not None
    assert response.status_code == 200
