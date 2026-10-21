"""Erros da integracao BeeCrowd. Nenhum deles inclui token ou URL arbitraria."""


class IntegrationNotConfigured(Exception):
    code = "beecrowd_integration_not_configured"

    def __init__(self, message: str = "Integracao BeeCrowd nao configurada."):
        super().__init__(message)
        self.message = message


class InvalidExternalId(ValueError):
    """external_id fora do formato aceito."""


class BeeCrowdTimeout(Exception):
    """A API oficial nao respondeu dentro do tempo limite."""


class BeeCrowdUnauthorized(Exception):
    """A API oficial recusou a credencial. O token nao entra na mensagem."""


class BeeCrowdNotFound(Exception):
    """A API oficial nao tem o exercicio pedido."""


class BeeCrowdUpstreamError(Exception):
    """A API oficial respondeu de um jeito que o Pygames nao usa."""


class BeeCrowdCacheError(Exception):
    """Falha ao ler ou gravar o cache. A aplicacao pode seguir sem ele."""
