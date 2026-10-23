---
phase: 09
slug: fastapi-backend
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-10-23
---

# Phase 09 — Validation Strategy

> Source: `09-RESEARCH.md` § Validation Architecture.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 9.1.1 + FastAPI TestClient (httpx) against real Postgres 17 |
| **Config file** | `backend/pyproject.toml` (Wave 0 creates; marker `concurrency`) |
| **Quick run command** | `cd backend && pytest -x -q -m "not concurrency"` |
| **Full suite command** | `cd backend && ruff check && pytest` (needs `docker compose up -d db`) |

## Sampling Rate

- **After every task:** quick run for the touched module
- **After every wave:** full suite
- **Before verify-work:** full suite green plus `docker compose up` smoke (`/api/health`, demo login, list events)

## Per-Task Verification Map

| Req | Behavior | Test Type | Automated Command | File Exists |
|-----|----------|-----------|-------------------|-------------|
| API-01 | migrations apply to empty DB, seed loads, re-run idempotent | integration | `pytest tests/test_migrate.py` | ❌ W0 |
| API-02 | approved overlap rejected; pending/pending allowed; adjacent allowed; approving second pending → VENUE_CLASH; duplicate registration rejected | db | `pytest tests/test_clash.py` | ❌ W0 |
| API-03 | capacity/waitlist, promotion + notification, state machine, RESOURCE_SHORT on set/approve/reschedule | domain | `pytest tests/domain` | ❌ W0 |
| API-04 | login ok/bad/unknown, hashed token, expiry, logout, rate limit, demo login gated | http | `pytest tests/test_auth.py` | ❌ W0 |
| API-05 | route matrix: anonymous 401, wrong role 403 incl. CSV | http | `pytest tests/test_authz.py` | ❌ W0 |
| API-06 | ported suites green; `/openapi.json` covers every route | meta | `pytest tests/test_openapi.py` | ❌ W0 |

## Wave 0 Requirements

- [ ] `backend/pyproject.toml`, `.python-version` (3.12), `.env.example`, `docker-compose.yml`, `Dockerfile`
- [ ] `tests/conftest.py` (migrate once, rollback `conn`, `client_for(role)`)
- [ ] test files listed above

## Manual-Only Verifications

All phase behaviors have automated verification.

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] No 3 consecutive tasks without automated verify
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
