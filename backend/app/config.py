"""Configuration settings for the FastAPI application.

Loads backend/.env if present so bare pytest/commands work without exporting env vars.
Otherwise, DATABASE_URL must be set in the environment.
"""

import os
from pathlib import Path


def _load_env_file() -> None:
    # Check current directory and backend/ directory for .env
    candidates = [
        Path(".env"),
        Path(__file__).resolve().parent.parent / ".env",
        Path("backend/.env"),
    ]
    for env_path in candidates:
        if env_path.is_file():
            try:
                for line in env_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    if "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("'\"")
                        if k and k not in os.environ:
                            os.environ[k] = v
                break
            except OSError:
                pass


_load_env_file()


def _bool(val: str | None, default: bool = False) -> bool:
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def _int(val: str | None, default: int = 0) -> int:
    if val is None:
        return default
    try:
        return int(val.strip())
    except ValueError:
        return default


DATABASE_URL: str = os.environ.get(
    "DATABASE_URL", "postgresql://app:app@localhost:5433/app"
)
TEST_DATABASE_URL: str = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://app:app@localhost:5433/app_test"
)
DEMO_LOGIN: bool = _bool(os.environ.get("DEMO_LOGIN"), default=False)
COOKIE_SECURE: bool = _bool(os.environ.get("COOKIE_SECURE"), default=False)
LOGIN_MAX_FAILURES: int = _int(os.environ.get("LOGIN_MAX_FAILURES"), default=5)
LOGIN_WINDOW_MINUTES: int = _int(os.environ.get("LOGIN_WINDOW_MINUTES"), default=15)
SEED_DEMO: bool = _bool(os.environ.get("SEED_DEMO"), default=False)
