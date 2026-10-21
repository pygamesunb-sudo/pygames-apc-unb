"""Comunicacao HTTP com a API oficial BeeCrowd.

Caminhos usados:
POST /applications/token
GET /categories
GET /problems

O usuario nao escolhe a URL. Email, senha e token nao entram em mensagens de erro.
"""

from __future__ import annotations

import time
from typing import Protocol
from urllib.parse import urlparse

import httpx

from app.models.beecrowd import BeeCrowdQuery
from app.services.beecrowd.cache import cache_document_id
from app.services.beecrowd.exceptions import (
    BeeCrowdNotFound,
    BeeCrowdTimeout,
    BeeCrowdUnauthorized,
    BeeCrowdUpstreamError,
    IntegrationNotConfigured,
    InvalidExternalId,
)
from app.services.beecrowd.token import TOKEN_TTL_SECONDS, MemoryTokenCache, expiry_from_now

OFFICIAL_BASE_URL = "https://api.beecrowd.com.br"
DEFAULT_TIMEOUT_SECONDS = 10.0
HOURLY_LIMIT = 100
_TOKEN_PATH = "/applications/token"
_CATEGORIES_PATH = "/categories"
_PROBLEMS_PATH = "/problems"
_DROP_KEYS = {
    "statement",
    "description",
    "description_html",
    "html",
    "samples",
    "sample",
    "input",
    "output",
    "password",
    "token",
}
_request_marks: list[float] = []


class BeeCrowdClient(Protocol):
    async def list_problems(self, query: BeeCrowdQuery) -> list[dict]:
        """Devolve itens crus da API oficial, ainda nao normalizados."""

    async def get_problem(self, external_id: str) -> dict:
        """Devolve um item cru da API oficial."""


class UnconfiguredBeeCrowdClient:
    async def list_problems(self, query: BeeCrowdQuery) -> list[dict]:
        raise IntegrationNotConfigured(
            "Integracao BeeCrowd nao configurada. Nenhuma chamada externa foi feita."
        )

    async def get_problem(self, external_id: str) -> dict:
        raise IntegrationNotConfigured(
            "Integracao BeeCrowd nao configurada. Nenhuma chamada externa foi feita."
        )


def reset_request_budget() -> None:
    _request_marks.clear()


def _consume_budget(now: float | None = None) -> None:
    current = time.time() if now is None else now
    cutoff = current - 3600
    while _request_marks and _request_marks[0] < cutoff:
        _request_marks.pop(0)
    if len(_request_marks) >= HOURLY_LIMIT:
        raise BeeCrowdUpstreamError("Limite horario da fonte atingido.")
    _request_marks.append(current)


def _safe_base_url(base_url: str) -> str:
    cleaned = (base_url or "").strip().rstrip("/") or OFFICIAL_BASE_URL
    parsed = urlparse(cleaned)
    if parsed.scheme != "https" or not parsed.netloc:
        raise IntegrationNotConfigured("BEECROWD_API_BASE_URL invalida.")
    if parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise IntegrationNotConfigured("BEECROWD_API_BASE_URL invalida.")
    return cleaned


def _items(payload) -> list[dict]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("problems", "categories", "items", "data", "results"):
            value = payload.get(key)
            if isinstance(value, list):
                return [item for item in value if isinstance(item, dict)]
    raise BeeCrowdUpstreamError("Resposta BeeCrowd inesperada.")


def _next_link(base_url: str, payload) -> str | None:
    if not isinstance(payload, dict):
        return None
    candidate = payload.get("next")
    links = payload.get("links")
    if not isinstance(candidate, str) and isinstance(links, dict):
        candidate = links.get("next")
    if not isinstance(candidate, str) or not candidate.strip():
        return None
    parsed = urlparse(candidate.strip())
    base = urlparse(base_url)
    if parsed.scheme != "https" or parsed.netloc != base.netloc:
        return None
    if parsed.path.rstrip("/") not in {_PROBLEMS_PATH.rstrip("/"), _CATEGORIES_PATH.rstrip("/")}:
        return None
    return candidate.strip()


def _clean(value):
    if isinstance(value, dict):
        return {
            key: _clean(item)
            for key, item in value.items()
            if str(key).lower() not in _DROP_KEYS
        }
    if isinstance(value, list):
        return [_clean(item) for item in value]
    return value


def _translation_name(raw: dict) -> str:
    for lang in ("pt", "es", "en"):
        block = raw.get(lang)
        if isinstance(block, dict) and str(block.get("name") or "").strip():
            return str(block["name"]).strip()
    return ""


def _category_names(payload) -> dict[str, str]:
    names = {}
    try:
        items = _items(payload)
    except BeeCrowdUpstreamError:
        return names
    for item in items:
        name = _translation_name(item)
        if item.get("id") is not None and name:
            names[str(item["id"])] = name
    return names


def _extract_token(payload) -> str:
    if not isinstance(payload, dict):
        return ""
    token = payload.get("token")
    if isinstance(token, str) and token.strip():
        return token.strip()
    data = payload.get("data")
    if isinstance(data, dict) and isinstance(data.get("token"), str) and data["token"].strip():
        return data["token"].strip()
    return ""


class HttpBeeCrowdClient:
    def __init__(
        self,
        base_url: str,
        token: str = "",
        timeout: float = DEFAULT_TIMEOUT_SECONDS,
        transport: httpx.BaseTransport | None = None,
        *,
        email: str = "",
        password: str = "",
        token_cache=None,
        catalog_ttl: int = 86400,
        token_ttl: int = TOKEN_TTL_SECONDS,
    ):
        self.base_url = _safe_base_url(base_url)
        self._email = (email or "").strip()
        self._password = password or ""
        self._static_token = (token or "").strip()
        self.timeout = timeout
        self._transport = transport
        self._tokens = token_cache if token_cache is not None else MemoryTokenCache()
        self._catalog: list[dict] = []
        self._catalog_expires = 0.0
        self._catalog_ttl = max(60, catalog_ttl)
        self._token_ttl = token_ttl
        if not self._static_token and not (self._email and self._password):
            raise IntegrationNotConfigured("Credencial BeeCrowd ausente.")

    async def list_problems(self, query: BeeCrowdQuery) -> list[dict]:
        del query
        return await self._load_catalog()

    async def get_problem(self, external_id: str) -> dict:
        try:
            cleaned = cache_document_id(external_id)
        except ValueError as exc:
            raise InvalidExternalId("external_id invalido.") from exc
        for item in await self._load_catalog():
            if str(item.get("id")) == cleaned:
                return item
        raise BeeCrowdNotFound("Exercicio BeeCrowd nao encontrado.")

    async def _load_catalog(self) -> list[dict]:
        if self._catalog and self._catalog_expires > time.time():
            return list(self._catalog)
        try:
            categories = await self._request("GET", _CATEGORIES_PATH)
            names = _category_names(categories)
        except (BeeCrowdTimeout, BeeCrowdUpstreamError, BeeCrowdNotFound):
            names = {}
        problems = await self._collect(_PROBLEMS_PATH)
        enriched = []
        for item in problems:
            cleaned = _clean(item)
            category_id = cleaned.get("category")
            if category_id is not None and names.get(str(category_id)):
                cleaned["category_name"] = names[str(category_id)]
            enriched.append(cleaned)
        self._catalog = enriched
        self._catalog_expires = time.time() + self._catalog_ttl
        return list(enriched)

    async def _collect(self, path: str) -> list[dict]:
        payload = await self._first_page(path)
        items = _items(payload)
        seen = {path, path.rstrip("/"), f"{path.rstrip('/')}/"}
        nxt = _next_link(self.base_url, payload)
        pages = 0
        while nxt and nxt not in seen and pages < 5:
            seen.add(nxt)
            pages += 1
            payload = await self._request("GET", nxt, absolute=True)
            items.extend(_items(payload))
            nxt = _next_link(self.base_url, payload)
        return items

    async def _first_page(self, path: str):
        try:
            return await self._request("GET", path)
        except BeeCrowdNotFound:
            if path.endswith("/"):
                raise
            return await self._request("GET", f"{path}/")

    async def _bearer(self, force: bool = False) -> str:
        if not force:
            cached = await self._tokens.read()
            if cached:
                return cached
            if self._static_token:
                return self._static_token
        if not (self._email and self._password):
            raise BeeCrowdUnauthorized("A API BeeCrowd recusou a credencial.")
        payload = await self._request(
            "POST",
            _TOKEN_PATH,
            json_body={"email": self._email, "password": self._password},
            allow_refresh=False,
            authenticated=False,
        )
        token = _extract_token(payload)
        if not token:
            raise BeeCrowdUnauthorized("A API BeeCrowd recusou a credencial.")
        await self._tokens.write(token, expiry_from_now(ttl_seconds=self._token_ttl))
        self._static_token = ""
        return token

    async def _request(
        self,
        method: str,
        path: str,
        *,
        json_body: dict | None = None,
        allow_refresh: bool = True,
        authenticated: bool = True,
        absolute: bool = False,
    ):
        if not absolute and (path.startswith("http://") or path.startswith("https://") or ".." in path):
            raise InvalidExternalId("Caminho BeeCrowd invalido.")
        url = path if absolute else f"{self.base_url}{path}"
        _consume_budget()
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        if authenticated:
            headers["Authorization"] = f"Bearer {await self._bearer(force=False)}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout, transport=self._transport) as client:
                response = await client.request(method, url, headers=headers, json=json_body)
        except httpx.TimeoutException as exc:
            raise BeeCrowdTimeout("A API BeeCrowd excedeu o tempo limite.") from exc
        except httpx.RequestError as exc:
            raise BeeCrowdUpstreamError("Nao foi possivel contatar a API BeeCrowd.") from exc

        if response.status_code == 401:
            if authenticated and allow_refresh and self._email and self._password:
                await self._tokens.clear()
                self._static_token = ""
                self._catalog = []
                self._catalog_expires = 0.0
                return await self._request(
                    method,
                    path,
                    json_body=json_body,
                    allow_refresh=False,
                    authenticated=authenticated,
                    absolute=absolute,
                )
            raise BeeCrowdUnauthorized("A API BeeCrowd recusou a credencial.")
        if response.status_code == 404:
            raise BeeCrowdNotFound("Exercicio BeeCrowd nao encontrado.")
        if response.status_code == 429 or response.status_code >= 400:
            raise BeeCrowdUpstreamError("A API BeeCrowd retornou um erro.")
        try:
            return response.json()
        except ValueError as exc:
            raise BeeCrowdUpstreamError("A API BeeCrowd nao retornou JSON.") from exc
