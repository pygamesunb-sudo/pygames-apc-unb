"""Rotas BeeCrowd. A regra de negocio fica no service."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_current_user
from app.models.beecrowd import BeeCrowdProblem, BeeCrowdQuery, BeeCrowdStatus
from app.services.beecrowd.exceptions import (
    BeeCrowdNotFound,
    BeeCrowdTimeout,
    BeeCrowdUnauthorized,
    BeeCrowdUpstreamError,
    IntegrationNotConfigured,
    InvalidExternalId,
)
from app.services.beecrowd.service import get_beecrowd_service

router = APIRouter(prefix="/api/beecrowd", tags=["beecrowd"])


def _not_configured(exc: IntegrationNotConfigured) -> HTTPException:
    return HTTPException(status_code=503, detail=exc.code)


@router.get("/status", response_model=BeeCrowdStatus)
async def status(user: dict = Depends(get_current_user)):
    del user
    return get_beecrowd_service().status()


@router.get("/problems", response_model=list[BeeCrowdProblem])
async def list_problems(
    topic: str | None = None,
    difficulty: str | None = None,
    category: str | None = None,
    page: int = Query(default=1, ge=1, le=500),
    limit: int = Query(default=20, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    del user
    query = BeeCrowdQuery(
        topic=topic,
        difficulty=difficulty,
        category=category,
        page=page,
        limit=limit,
    )
    try:
        return await get_beecrowd_service().list_problems(query)
    except IntegrationNotConfigured as exc:
        raise _not_configured(exc) from exc
    except BeeCrowdTimeout as exc:
        raise HTTPException(status_code=504, detail="beecrowd_timeout") from exc
    except BeeCrowdUnauthorized as exc:
        raise HTTPException(status_code=502, detail="beecrowd_upstream_unauthorized") from exc
    except BeeCrowdUpstreamError as exc:
        raise HTTPException(status_code=502, detail="beecrowd_upstream_error") from exc


@router.get("/problems/{external_id}", response_model=BeeCrowdProblem)
async def get_problem(external_id: str, user: dict = Depends(get_current_user)):
    del user
    try:
        return await get_beecrowd_service().get_problem(external_id)
    except InvalidExternalId as exc:
        raise HTTPException(status_code=422, detail="beecrowd_invalid_external_id") from exc
    except IntegrationNotConfigured as exc:
        raise _not_configured(exc) from exc
    except BeeCrowdNotFound as exc:
        raise HTTPException(status_code=404, detail="beecrowd_problem_not_found") from exc
    except BeeCrowdTimeout as exc:
        raise HTTPException(status_code=504, detail="beecrowd_timeout") from exc
    except BeeCrowdUnauthorized as exc:
        raise HTTPException(status_code=502, detail="beecrowd_upstream_unauthorized") from exc
    except BeeCrowdUpstreamError as exc:
        raise HTTPException(status_code=502, detail="beecrowd_upstream_error") from exc


@router.get("/recommendations", response_model=list[BeeCrowdProblem])
async def recommendations(
    topic: str | None = None,
    difficulty: str | None = None,
    category: str | None = None,
    page: int = Query(default=1, ge=1, le=500),
    limit: int = Query(default=20, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    query = BeeCrowdQuery(
        topic=topic,
        difficulty=difficulty,
        category=category,
        page=page,
        limit=limit,
    )
    try:
        return await get_beecrowd_service().recommendations(query, uid=user.get("uid"))
    except IntegrationNotConfigured as exc:
        raise _not_configured(exc) from exc
    except BeeCrowdTimeout as exc:
        raise HTTPException(status_code=504, detail="beecrowd_timeout") from exc
    except BeeCrowdUnauthorized as exc:
        raise HTTPException(status_code=502, detail="beecrowd_upstream_unauthorized") from exc
    except BeeCrowdUpstreamError as exc:
        raise HTTPException(status_code=502, detail="beecrowd_upstream_error") from exc
