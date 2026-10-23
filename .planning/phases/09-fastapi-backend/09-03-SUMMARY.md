# Phase 09 Plan 03 Summary: Auth & Request Plumbing

**Executed:** Wave 3, Plan 09-03
**Requirements covered:** API-04, API-05
**KB notes consulted:** `dom-domain-model`, `adr-001-stack`

## What Changed

1. **Authentication Core (`backend/app/auth.py`):**
   - Implemented password verification using `pwdlib` Argon2 with a module-level precomputed dummy hash (`DUMMY`) to ensure constant-time response for unknown email addresses.
   - Implemented 256-bit URL-safe token generation (`new_token`) and SHA-256 token hashing (`hash_token`). Only token hashes are stored in the `sessions` table.
   - Implemented `create_session` (which also prunes expired sessions), `resolve_session`, and `delete_session`.
   - Implemented DB-persisted failure logging (`record_failure`, `recent_failures`, `clear_failures`) on `login_attempts` keyed by email.

2. **FastAPI Dependencies (`backend/app/deps.py`):**
   - Implemented `get_conn` dependency yielding transactional pool connections.
   - Implemented `current_actor` reading the `session` cookie and resolving the authenticated `Actor`.
   - Implemented `require_roles(*roles)` enforcing role authorization.
   - Implemented `roles_extra(*roles)` providing OpenAPI `x-roles` metadata.

3. **Application & Exception Handlers (`backend/app/main.py`):**
   - Configured `FastAPI` with lifespan management and unique operation ID formatting.
   - Configured global exception handlers for `DomainError` and `psycopg.Error` returning consistent JSON `{code, message}` with correct HTTP status codes (401, 403, 409, 422, 429, 500).
   - Created public `GET /api/health` endpoint.

4. **Auth Router (`backend/app/routers/auth.py`):**
   - `POST /api/auth/login`: verifies credentials, enforces rate limits (5 failures / 15 mins), sets httpOnly SameSite=Lax cookie. Returns JSONResponse so failure rows are committed.
   - `POST /api/auth/logout`: deletes DB session row and clears the cookie.
   - `GET /api/auth/me`: returns authenticated actor profile.
   - `POST /api/auth/demo-login`: gates demo access behind `DEMO_LOGIN` env flag (returns 404 when disabled).

5. **Test Harness & Test Suite (`backend/tests/conftest.py`, `backend/tests/test_auth.py`):**
   - Added `client` and `client_for(role)` fixtures with connection savepoint overrides.
   - Handled connection pool re-creation in `app/db.py` lifespan to prevent `PoolClosed` errors across multiple test clients.
   - Verified 9 test scenarios: health check, login success and cookie setting, timing-attack resistance (identical 401s), me endpoint, rate limiting with persisted attempts and reset on success, expired session cleanup, logout, demo login gating, and request transaction rollback on error.

## How to Verify

```bash
cd backend && uv run ruff check && uv run pytest -q tests/test_auth.py
```
All 9 tests pass.
