"""Database connection pooling and FastAPI lifespan management."""

from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from app.config import DATABASE_URL

pool = ConnectionPool(
    DATABASE_URL,
    min_size=1,
    max_size=5,
    open=False,
    kwargs={"row_factory": dict_row},
)


@asynccontextmanager
async def lifespan(app: Any) -> AsyncIterator[None]:
    """FastAPI application lifespan manager to open and close the pool."""
    global pool
    if pool._closed and pool._opened:
        pool = ConnectionPool(
            DATABASE_URL,
            min_size=1,
            max_size=5,
            open=False,
            kwargs={"row_factory": dict_row},
        )
    pool.open(wait=True)
    try:
        yield
    finally:
        pool.close()


def get_conn() -> Iterator[psycopg.Connection[dict[str, Any]]]:
    """Dependency that yields a managed connection from the pool."""
    with pool.connection() as conn:
        yield conn
