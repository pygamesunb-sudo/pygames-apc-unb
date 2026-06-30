import pytest
from app.config import settings

def test_load_from_firebase():
    """Testa o carregamento de variaveis de ambiente remotas do Firestore."""
    # Executa a busca real de configuracoes remotas
    settings.load_from_firebase()
    # Verifica que o objeto de settings e as propriedades continuam validas
    assert settings.firebase_project_id == "pygames-apc"
