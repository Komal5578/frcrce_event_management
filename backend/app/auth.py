"""Authentication helpers: hashing, sessions, and rate limiting."""

import hashlib
import secrets
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

import psycopg
from pwdlib import PasswordHash

# Add backend directory to sys.path if not present
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.domain.actor import Actor

ph = PasswordHash.recommended()
# Pre-computed dummy hash to guarantee constant-time verification when an email is unknown
DUMMY = ph.hash("dummy-hash-for-timing-security")


def new_token() -> str:
    """Generate a high-entropy 256-bit URL-safe token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Compute SHA-256 digest of the session token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str | None) -> bool:
    """Verify password against hash; if hash is None, run verify against dummy hash to prevent timing attacks."""
    if password_hash is None:
        ph.verify(password, DUMMY)
        return False
    return ph.verify(password, password_hash)


def create_session(conn: psycopg.Connection[dict[str, Any]], user_id: str, days: int = 7) -> str:
    """Create a new session, clean up expired sessions, and return the raw token."""
    token = new_token()
    token_h = hash_token(token)
    expires_at = datetime.now(UTC) + timedelta(days=days)

    with conn.cursor() as cur:
        # Prune expired sessions
        cur.execute("DELETE FROM sessions WHERE expires_at < now();")
        cur.execute(
            """
            INSERT INTO sessions (token_hash, user_id, expires_at)
            VALUES (%s, %s, %s);
            """,
            (token_h, user_id, expires_at),
        )

    return token


def resolve_session(conn: psycopg.Connection[dict[str, Any]], token: str) -> Actor | None:
    """Resolve raw session token to an active Actor if session exists and is unexpired."""
    token_h = hash_token(token)
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT p.id, p.role, p.name, p.email
            FROM sessions s
            JOIN profiles p ON p.id = s.user_id
            WHERE s.token_hash = %s AND s.expires_at > now();
            """,
            (token_h,),
        )
        row = cur.fetchone()
        if row is None:
            return None
        return Actor(id=str(row["id"]), role=row["role"], name=row["name"], email=row["email"])


def delete_session(conn: psycopg.Connection[dict[str, Any]], token: str) -> None:
    """Delete session by raw token."""
    token_h = hash_token(token)
    with conn.cursor() as cur:
        cur.execute("DELETE FROM sessions WHERE token_hash = %s;", (token_h,))


def recent_failures(conn: psycopg.Connection[dict[str, Any]], email: str, window_minutes: int) -> int:
    """Count login failure attempts for an email within the given window in minutes."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT count(*) AS count FROM login_attempts
            WHERE email = %s AND attempted_at > now() - (%s || ' minutes')::interval;
            """,
            (email, str(window_minutes)),
        )
        row = cur.fetchone()
        return row["count"] if row else 0


def record_failure(conn: psycopg.Connection[dict[str, Any]], email: str) -> None:
    """Record a failed login attempt for an email."""
    with conn.cursor() as cur:
        cur.execute("INSERT INTO login_attempts (email) VALUES (%s);", (email,))


def clear_failures(conn: psycopg.Connection[dict[str, Any]], email: str) -> None:
    """Clear failed login attempts for an email upon successful login."""
    with conn.cursor() as cur:
        cur.execute("DELETE FROM login_attempts WHERE email = %s;", (email,))
