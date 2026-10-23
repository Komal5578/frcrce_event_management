"""Tests for authentication, session lifecycle, rate limiting, and demo login."""

import hashlib
from datetime import UTC, datetime, timedelta

from fastapi import Depends

from app import config
from app.auth import hash_token
from app.deps import get_conn
from app.errors import MSG, DomainError


def test_health_endpoint(client) -> None:
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_login_success_and_cookie(client, make_user, conn) -> None:
    user = make_user(role="coordinator", email="priya@college.test")
    res = client.post(
        "/api/auth/login",
        json={"email": "priya@college.test", "password": "demo-password-2026"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "priya@college.test"
    assert data["role"] == "coordinator"

    # Check Set-Cookie header
    cookie = res.cookies.get("session")
    assert cookie is not None

    # Check sessions table stores sha256(token), not raw token
    expected_hash = hash_token(cookie)
    with conn.cursor() as cur:
        cur.execute("SELECT user_id FROM sessions WHERE token_hash = %s;", (expected_hash,))
        row = cur.fetchone()
        assert row is not None
        assert str(row["user_id"]) == str(user["id"])


def test_login_wrong_password_and_unknown_email_identical(client, make_user) -> None:
    make_user(role="student", email="student@college.test")

    # 1. Wrong password
    res_wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "student@college.test", "password": "wrong-password"},
    )
    # 2. Unknown email
    res_unknown = client.post(
        "/api/auth/login",
        json={"email": "unknown@college.test", "password": "any-password"},
    )

    assert res_wrong_pw.status_code == 401
    assert res_unknown.status_code == 401
    assert res_wrong_pw.json() == res_unknown.json()
    assert res_wrong_pw.json() == {
        "code": "UNAUTHENTICATED",
        "message": MSG["UNAUTHENTICATED"],
    }


def test_me_endpoint_and_client_for(client, client_for) -> None:
    # Anonymous request
    res = client.get("/api/auth/me")
    assert res.status_code == 401
    assert res.json()["code"] == "UNAUTHENTICATED"

    # Authenticated request via client_for
    student_client = client_for("student")
    res_auth = student_client.get("/api/auth/me")
    assert res_auth.status_code == 200
    assert res_auth.json()["role"] == "student"


def test_rate_limiting_failures_and_clear_on_success(client, make_user, conn, monkeypatch) -> None:
    monkeypatch.setattr(config, "LOGIN_MAX_FAILURES", 3)
    make_user(role="student", email="ratelimited@college.test")

    # 3 failures
    for _ in range(3):
        res = client.post(
            "/api/auth/login",
            json={"email": "ratelimited@college.test", "password": "bad"},
        )
        assert res.status_code == 401

    # 4th attempt returns 429 RATE_LIMITED
    res_429 = client.post(
        "/api/auth/login",
        json={"email": "ratelimited@college.test", "password": "bad"},
    )
    assert res_429.status_code == 429
    assert res_429.json() == {
        "code": "RATE_LIMITED",
        "message": MSG["RATE_LIMITED"],
    }

    # Failure rows persist in login_attempts
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM login_attempts WHERE email = 'ratelimited@college.test';")
        assert cur.fetchone()["count"] == 4

    # Wait or reset failures to test clearing
    with conn.cursor() as cur:
        cur.execute("DELETE FROM login_attempts WHERE email = 'ratelimited@college.test';")

    # Successful login clears failures
    res_ok = client.post(
        "/api/auth/login",
        json={"email": "ratelimited@college.test", "password": "demo-password-2026"},
    )
    assert res_ok.status_code == 200
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM login_attempts WHERE email = 'ratelimited@college.test';")
        assert cur.fetchone()["count"] == 0


def test_expired_session_and_cleanup(client, make_user, conn) -> None:
    user = make_user(role="admin", email="admin@college.test")

    # Create expired session
    expired_token = "expired_raw_token_123"
    expired_hash = hashlib.sha256(expired_token.encode()).hexdigest()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO sessions (token_hash, user_id, expires_at)
            VALUES (%s, %s, %s);
            """,
            (expired_hash, user["id"], datetime.now(UTC) - timedelta(hours=1)),
        )

    # Calling me with expired session is 401
    client.cookies.set("session", expired_token)
    res = client.get("/api/auth/me")
    assert res.status_code == 401

    # Logging in cleans up expired sessions
    client.cookies.clear()
    res_login = client.post(
        "/api/auth/login",
        json={"email": "admin@college.test", "password": "demo-password-2026"},
    )
    assert res_login.status_code == 200
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM sessions WHERE token_hash = %s;", (expired_hash,))
        assert cur.fetchone()["count"] == 0


def test_logout_deletes_session_and_clears_cookie(client_for, conn) -> None:
    cl = client_for("coordinator")
    token = cl.cookies.get("session")
    token_h = hash_token(token)

    # Confirm session exists in DB
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM sessions WHERE token_hash = %s;", (token_h,))
        assert cur.fetchone()["count"] == 1

    # Logout
    res = cl.post("/api/auth/logout")
    assert res.status_code == 200

    # Session deleted from DB
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM sessions WHERE token_hash = %s;", (token_h,))
        assert cur.fetchone()["count"] == 0

    # Subsequent /me is 401
    res_me = cl.get("/api/auth/me")
    assert res_me.status_code == 401


def test_demo_login_gate(client, seeded, monkeypatch) -> None:
    # 1. When DEMO_LOGIN is False, demo-login returns 404
    monkeypatch.setattr(config, "DEMO_LOGIN", False)
    res_off = client.post("/api/auth/demo-login", json={"role": "student"})
    assert res_off.status_code == 404

    # 2. When DEMO_LOGIN is True, demo-login works for all roles
    monkeypatch.setattr(config, "DEMO_LOGIN", True)
    for role in ["coordinator", "student", "admin"]:
        res_on = client.post("/api/auth/demo-login", json={"role": role})
        assert res_on.status_code == 200
        assert res_on.json()["role"] == role
        assert res_on.cookies.get("session") is not None


def test_request_rollback_on_domain_error(client, conn) -> None:
    # Test that an error raised inside a route rolls back any DB operations made in that request
    from app.main import app

    @app.post("/test-rollback")
    def _test_route(conn_dep=Depends(get_conn)):
        with conn_dep.cursor() as cur:
            cur.execute("INSERT INTO resources (name, quantity) VALUES ('Rollback Resource', 99);")
        raise DomainError("INVALID_INPUT", "Rollback triggered")

    try:
        res = client.post("/test-rollback")
        assert res.status_code == 422
        assert res.json()["code"] == "INVALID_INPUT"

        # Confirm resource was rolled back
        with conn.cursor() as cur:
            cur.execute("SELECT count(*) FROM resources WHERE name = 'Rollback Resource';")
            assert cur.fetchone()["count"] == 0
    finally:
        app.routes[:] = [r for r in app.routes if getattr(r, "path", None) != "/test-rollback"]
