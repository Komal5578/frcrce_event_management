"""Database migration and seed runner for PostgreSQL."""

import argparse
import sys
from pathlib import Path

import psycopg
from pwdlib import PasswordHash

# Add backend directory to sys.path if not present
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.config import DATABASE_URL, SEED_DEMO


def migrate(database_url: str | None = None, seed: bool = False) -> list[str]:
    """Apply pending SQL migrations and optional seed data to the PostgreSQL database."""
    url = database_url or DATABASE_URL
    migrations_dir = BACKEND_DIR / "migrations"
    seed_file = BACKEND_DIR / "seed" / "seed.sql"

    applied_now: list[str] = []

    with psycopg.connect(url, autocommit=True) as conn, conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                name TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ DEFAULT now()
            );
        """)

        cur.execute("SELECT name FROM schema_migrations;")
        already_applied = {row[0] for row in cur.fetchall()}

        # Only top-level .sql files in migrations/, sorted
        migration_files = sorted(
            f for f in migrations_dir.iterdir()
            if f.is_file() and f.suffix == ".sql"
        )

        for mf in migration_files:
            if mf.name in already_applied:
                continue

            sql = mf.read_text(encoding="utf-8")
            # Run each migration in its own transaction
            with conn.transaction():
                cur.execute(sql)
                cur.execute(
                    "INSERT INTO schema_migrations (name) VALUES (%s);",
                    (mf.name,),
                )
            applied_now.append(mf.name)
            print(f"Applied migration: {mf.name}")

        if seed:
            cur.execute("SELECT count(*) FROM profiles;")
            count = cur.fetchone()[0]
            if count > 0:
                print("Profiles table is not empty; skipping demo seed.")
            else:
                if seed_file.is_file():
                    seed_sql = seed_file.read_text(encoding="utf-8")
                    ph = PasswordHash.recommended()
                    demo_hash = ph.hash("demo-password-2026")
                    with conn.transaction():
                        cur.execute(seed_sql)
                        cur.execute(
                            "UPDATE profiles SET password_hash = %s WHERE email LIKE %s;",
                            (demo_hash, "%@demo.college.test"),
                        )
                    print("Applied seed data with argon2 demo password hashes.")
                else:
                    print(f"Seed file not found: {seed_file}")

    return applied_now


def main() -> None:
    parser = argparse.ArgumentParser(description="Run database migrations and optional seed.")
    parser.add_argument(
        "--seed",
        action="store_true",
        default=False,
        help="Load seed data if profiles table is empty",
    )
    parser.add_argument(
        "--database-url",
        type=str,
        default=None,
        help="PostgreSQL connection URL (defaults to DATABASE_URL config)",
    )
    args = parser.parse_args()

    should_seed = args.seed or SEED_DEMO
    migrate(database_url=args.database_url, seed=should_seed)


if __name__ == "__main__":
    main()
