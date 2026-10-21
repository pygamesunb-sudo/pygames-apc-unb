"""Traduz o payload externo para metadados internos.

O enunciado, quando vier na resposta, e ignorado de proposito.
"""

from __future__ import annotations

from urllib.parse import urlparse

from app.models.beecrowd import BeeCrowdProblem


def _first(raw: dict, *keys: str) -> str:
    for key in keys:
        value = raw.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def _topic_names(value) -> list[str]:
    if isinstance(value, str):
        return [part.strip() for part in value.split(",") if part.strip()]
    if not isinstance(value, list):
        return []
    names = []
    for item in value:
        if isinstance(item, str) and item.strip():
            names.append(item.strip())
        elif isinstance(item, dict):
            label = item.get("name")
            nested = item.get("pt")
            if not label and isinstance(nested, dict):
                label = nested.get("name")
            if label and str(label).strip():
                names.append(str(label).strip())
    return names


def _preferred_translation(raw: dict) -> dict:
    for lang in ("pt", "es", "en"):
        block = raw.get(lang)
        if isinstance(block, dict) and str(block.get("name") or "").strip():
            return block
    return {}


def _topics(raw: dict) -> list[str]:
    translation = _preferred_translation(raw)
    if translation:
        return _topic_names(translation.get("topics") or [])
    return _topic_names(raw.get("topics") or raw.get("tags") or [])


def _category_label(raw: dict) -> str:
    named = _first(raw, "category_name")
    if named:
        return named
    category = raw.get("category")
    if isinstance(category, str) and category.strip() and not category.strip().isdigit():
        return category.strip()
    return ""


def _public_problem_url(external_id: str) -> str:
    if external_id.isdigit():
        return f"https://www.beecrowd.com.br/judge/pt/problems/view/{external_id}"
    raise ValueError("Item BeeCrowd sem URL publica.")


def _official_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme not in {"https", "http"} or not parsed.netloc:
        raise ValueError("URL BeeCrowd invalida.")
    return value


def to_problem(raw: dict) -> BeeCrowdProblem:
    if not isinstance(raw, dict):
        raise ValueError("Item BeeCrowd invalido.")
    external_id = _first(raw, "external_id", "id", "problem_id")
    translation = _preferred_translation(raw)
    title = str(translation.get("name") or "").strip() or _first(raw, "title", "name")
    url_value = _first(raw, "external_url", "url", "link")
    url = _official_url(url_value) if url_value else _public_problem_url(external_id)
    if not external_id or not title:
        raise ValueError("Item BeeCrowd sem id ou titulo.")

    available = raw.get("available", True)
    if not isinstance(available, bool):
        available = str(available).strip().lower() not in {"0", "false", "no"}

    return BeeCrowdProblem(
        external_id=external_id,
        title=title,
        difficulty=_first(raw, "difficulty", "level") or None,
        category=_category_label(raw) or None,
        topics=_topics(raw),
        source="beecrowd",
        external_url=url,
        available=available,
    )
