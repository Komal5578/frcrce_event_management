"""FastAPI application entrypoint, middleware, exception handlers, and routing."""

from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app import cache
from app.db import lifespan as db_lifespan
from app.errors import STATUS, DomainError, translate
from app.routers.approvals import router as approvals_router
from app.routers.auth import router as auth_router
from app.routers.events import router as events_router
from app.routers.notifications import router as notifications_router
from app.routers.registrations import router as registrations_router
from app.routers.reports import router as reports_router
from app.routers.resources import router as resources_router
from app.routers.tasks import router as tasks_router
from app.routers.venues import router as venues_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with db_lifespan(app):
        await cache.open_cache()
        try:
            yield
        finally:
            await cache.close_cache()


app = FastAPI(
    title="College Event Management API",
    lifespan=lifespan,
    generate_unique_id_function=lambda r: f"{r.tags[0]}_{r.name}" if r.tags else r.name,
)
app.add_middleware(cache.ResponseCache)


@app.exception_handler(DomainError)
async def domain_error_handler(_: Request, exc: DomainError) -> JSONResponse:
    """Handle DomainError exceptions with mapped HTTP status and standard response body."""
    status_code = STATUS.get(exc.code, 500)
    return JSONResponse(
        status_code=status_code,
        content={"code": exc.code, "message": exc.message},
    )


@app.exception_handler(psycopg.Error)
async def psycopg_error_handler(_: Request, exc: psycopg.Error) -> JSONResponse:
    """Handle uncaught PostgreSQL errors by translating to DomainError."""
    dom_err = translate(exc)
    status_code = STATUS.get(dom_err.code, 500)
    return JSONResponse(
        status_code=status_code,
        content={"code": dom_err.code, "message": dom_err.message},
    )


@app.get("/api/health", summary="Health check", tags=["health"])
def health() -> dict[str, str]:
    """Public healthcheck endpoint."""
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(events_router)
app.include_router(registrations_router)
app.include_router(tasks_router)
app.include_router(venues_router)
app.include_router(resources_router)
app.include_router(approvals_router)
app.include_router(reports_router)
app.include_router(notifications_router)
