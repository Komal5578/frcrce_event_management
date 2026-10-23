"""Pytest configuration and database fixtures for backend tests."""

import sys
import uuid
from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import psycopg
import pytest
from psycopg.rows import dict_row
from pwdlib import PasswordHash

from app.config import TEST_DATABASE_URL
from app.domain.actor import Actor
from scripts.migrate import migrate


@pytest.fixture(scope="session", autouse=True)
def init_test_db() -> None:
    """Ensure test database exists and migrations are applied once per test session."""
    # Ensure test database exists
    try:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True):
            pass
    except psycopg.OperationalError:
        # Connect to template/postgres database to create app_test
        postgres_url = TEST_DATABASE_URL.rsplit("/", 1)[0] + "/postgres"
        with psycopg.connect(postgres_url, autocommit=True) as root_conn, root_conn.cursor() as cur:
            cur.execute("CREATE DATABASE app_test;")

    # Apply all migrations to test DB (without seed)
    migrate(database_url=TEST_DATABASE_URL, seed=False)


@pytest.fixture
def conn() -> Iterator[psycopg.Connection[dict[str, Any]]]:
    """Yield a connection with an active transaction that rolls back on test teardown."""
    connection = psycopg.connect(TEST_DATABASE_URL, autocommit=False, row_factory=dict_row)
    try:
        yield connection
    finally:
        connection.rollback()
        connection.close()


@pytest.fixture
def make_user(conn: psycopg.Connection[dict[str, Any]]):
    """Factory to create a profile in the current test transaction."""
    def _make(
        role: str = "student",
        name: str | None = None,
        email: str | None = None,
        is_organizer: bool = False,
    ) -> dict[str, Any]:
        user_id = str(uuid.uuid4())
        u_name = name or f"Test User {user_id[:8]}"
        u_email = email or f"{user_id[:8]}@test.local"
        ph = PasswordHash.recommended()
        p_hash = ph.hash("demo-password-2026")
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO profiles (id, email, password_hash, name, role, is_organizer)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (user_id, u_email, p_hash, u_name, role, is_organizer),
            )
            return cur.fetchone()
    return _make


@pytest.fixture
def make_venue(conn: psycopg.Connection[dict[str, Any]]):
    """Factory to create a venue in the current test transaction."""
    def _make(
        name: str | None = None,
        capacity: int = 100,
        location: str = "Campus Block",
        active: bool = True,
    ) -> dict[str, Any]:
        venue_id = str(uuid.uuid4())
        v_name = name or f"Venue {venue_id[:8]}"
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO venues (id, name, capacity, location, active)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (venue_id, v_name, capacity, location, active),
            )
            return cur.fetchone()
    return _make


@pytest.fixture
def make_resource(conn: psycopg.Connection[dict[str, Any]]):
    """Factory to create a resource in the current test transaction."""
    def _make(
        name: str | None = None,
        quantity: int = 10,
        active: bool = True,
    ) -> dict[str, Any]:
        resource_id = str(uuid.uuid4())
        r_name = name or f"Resource {resource_id[:8]}"
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO resources (id, name, quantity, active)
                VALUES (%s, %s, %s, %s)
                RETURNING *;
                """,
                (resource_id, r_name, quantity, active),
            )
            return cur.fetchone()
    return _make


@pytest.fixture
def make_event(conn: psycopg.Connection[dict[str, Any]], make_user, make_venue):
    """Factory to create an event in the current test transaction."""
    def _make(
        status: str = "draft",
        coordinator_id: str | None = None,
        venue_id: str | None = None,
        title: str = "Test Event",
        starts_at: datetime | None = None,
        ends_at: datetime | None = None,
        capacity: int | None = 50,
    ) -> dict[str, Any]:
        event_id = str(uuid.uuid4())
        c_id = coordinator_id or make_user(role="coordinator")["id"]

        if status != "draft":
            v_id = venue_id or make_venue()["id"]
            now = datetime.now(UTC)
            start = starts_at or (now + timedelta(days=1))
            end = ends_at or (start + timedelta(hours=2))
            cap = capacity or 50
        else:
            v_id = venue_id
            start = starts_at
            end = ends_at
            cap = capacity

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO events (id, title, coordinator_id, venue_id, starts_at, ends_at, capacity, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
                """,
                (event_id, title, c_id, v_id, start, end, cap, status),
            )
            return cur.fetchone()
    return _make


@pytest.fixture
def actor_for(make_user):
    """Create an Actor dataclass for a given role, backed by a test user profile."""
    def _actor(role: str = "student", user_id: str | None = None) -> Actor:
        if user_id is None:
            user = make_user(role=role)
            return Actor(id=user["id"], role=user["role"], name=user["name"], email=user["email"])
        return Actor(id=user_id, role=role, name=f"User {user_id[:8]}", email=f"{user_id}@test.local")
    return _actor


@pytest.fixture
def seeded(conn: psycopg.Connection[dict[str, Any]]) -> None:
    """Load seed.sql into the current rolled-back transaction and apply demo password hash."""
    seed_file = BACKEND_DIR / "seed" / "seed.sql"
    seed_sql = seed_file.read_text(encoding="utf-8")
    ph = PasswordHash.recommended()
    demo_hash = ph.hash("demo-password-2026")
    with conn.cursor() as cur:
        cur.execute(seed_sql)
        cur.execute(
            "UPDATE profiles SET password_hash = %s WHERE email LIKE %s;",
            (demo_hash, "%@demo.college.test"),
        )


@pytest.fixture
def client(conn: psycopg.Connection[dict[str, Any]]):
    """TestClient configured with dependency overrides to use the test rolled-back connection."""
    from fastapi.testclient import TestClient

    from app.deps import get_conn
    from app.main import app

    def _override_get_conn():
        with conn.transaction():
            yield conn

    app.dependency_overrides[get_conn] = _override_get_conn
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def client_for(conn: psycopg.Connection[dict[str, Any]], make_user):
    """Create a TestClient authenticated as an actor of the specified role."""
    from fastapi.testclient import TestClient

    from app.auth import create_session
    from app.deps import get_conn
    from app.main import app

    def _make(role: str = "student", user_id: str | None = None) -> TestClient:
        def _override_get_conn():
            with conn.transaction():
                yield conn

        app.dependency_overrides[get_conn] = _override_get_conn
        test_client = TestClient(app)

        if user_id is None:
            user = make_user(role=role)
            u_id = user["id"]
        else:
            u_id = user_id

        token = create_session(conn, u_id)
        test_client.cookies.set("session", token)
        return test_client

    yield _make
    app.dependency_overrides.clear()
