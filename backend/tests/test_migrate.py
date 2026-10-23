"""Tests for database migrations and seed loader."""

import psycopg
from pwdlib import PasswordHash

from app.config import TEST_DATABASE_URL
from scripts.migrate import migrate


def test_migrate_and_seed_workflow() -> None:
    try:
        # Running migrate with seed=True populates demo accounts if empty
        migrate(database_url=TEST_DATABASE_URL, seed=True)

        with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as conn, conn.cursor() as cur:
            cur.execute("SELECT email, password_hash FROM profiles WHERE email LIKE '%@demo.college.test';")
            rows = cur.fetchall()
            assert len(rows) == 7

            ph = PasswordHash.recommended()
            for _email, password_hash in rows:
                assert password_hash.startswith("$argon2id$")
                assert ph.verify("demo-password-2026", password_hash)

        # Second run applies 0 migrations and skips seed
        applied = migrate(database_url=TEST_DATABASE_URL, seed=True)
        assert applied == []
    finally:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as conn, conn.cursor() as cur:
            cur.execute(
                "TRUNCATE profiles, venues, resources, event_templates, events, "
                "resource_allocations, registrations, tasks, notifications, sessions, login_attempts CASCADE;"
            )
