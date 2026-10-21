"""Erros controlados do provedor de IA dos tutores.

A mensagem original do provedor fica de fora: ela pode repetir URL, chave ou corpo.
"""


class TutorAINotConfigured(Exception):
    """Os tutores nao chamam a IA quando GEMINI_API_KEY nao esta configurada."""


class TutorProviderError(Exception):
    def __init__(self, code: str, status: int | None = None):
        super().__init__(code)
        self.code = code
        self.status = status
