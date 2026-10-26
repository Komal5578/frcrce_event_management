# CampusEvent: College Event Planning and Management System

HMI mini project. One system where **coordinators** plan events, **students** discover and register, and **admins** approve and monitor. Designed with Goal-Directed Design (GDD): each role gets its own interface shaped by that role's goal, not a feature list.

| Role | Goal | Main screens |
|---|---|---|
| Coordinator | Get an event approved and running in the fewest steps | Templated create with autosave, free-venue picker, resources, tasks, Review & Confirm submit, monitor, edit/cancel |
| Student | Find an event and be registered; keep track | Discover/filter, detail, register (with waitlist), My Registrations, calendar, reminders, My Tasks |
| Admin | Decide quickly and safely | Approvals queue with clash check, venue/resource management, calendar, dashboard, CSV reports |

Design rules: status is always icon + text + colour; irreversible actions go through Review & Confirm; clashes and double-registration are blocked in the database and the UI; WCAG 2.2 AA, 44px targets, keyboard path, A-/A/A+ text size. Scope cuts (no email/SMS, payments, native apps) are in `kb/decisions`.

## Stack

- **API** (`worker/`): TypeScript Cloudflare Worker + Cloudflare D1 (SQLite). Integrity (unique registration, venue clashes, capacity, event transitions) is enforced by constraints and triggers in `worker/migrations`.
- **Frontend** (`frontend/`): Next.js (App Router) on Vercel. `next.config.ts` proxies `/api/*` to `BACKEND_URL`, so the session cookie stays first-party.
- **Auth**: httpOnly, Secure, SameSite=Lax session cookie; only its SHA-256 is stored; PBKDF2-SHA256 passwords.

`backend/` (FastAPI/Postgres), `docker-compose*.yml`, `Caddyfile` and `scripts/` are the superseded GCP/AWS path, kept for reference only. Do not deploy them. `dev.sh` starts that legacy backend, so ignore it.

## Run locally

Needs Node 20+.

```bash
# 1. API on http://localhost:8787 (local D1, demo login on)
cd worker
npm install
npx wrangler d1 migrations apply DB --local
npx wrangler d1 execute DB --local --file=seed.sql
npx wrangler dev --var DEMO_LOGIN:true
```

```bash
# 2. Frontend on http://localhost:3000
cd frontend
npm install
echo 'BACKEND_URL=http://localhost:8787' > .env.local
npm run dev
```

Seed accounts are in `worker/seed.sql` (`admin@`, `coordinator@`, `student@demo.college.test`).

## Check

```bash
cd worker   && npm run typecheck
cd frontend && npm run typecheck && npm run lint
cd frontend && npm run test:e2e      # Playwright browser suite
node worker/smoke.mjs                # API smoke test; see the file header for the target URL
node kb/tools/build-index.mjs        # after editing kb/
```

## Deploy

```bash
cd worker && npx wrangler d1 migrations apply DB --remote && npm run deploy
cd frontend && vercel deploy --prod   # BACKEND_URL = the Worker URL
```

Production has `DEMO_LOGIN=false`. Never commit credentials; use Wrangler secrets and Vercel environment settings.

A second Worker/D1 pair with real Fr. CRCE council and club data uses `worker/wrangler.fcrce.jsonc` and a seed from `worker/scripts/gen-frcrce-seed.mjs`. Treat it as demo data, not official.

## Repo map

| Path | What |
|---|---|
| `worker/` | API, migrations, seeds, smoke test |
| `frontend/` | Next.js app, Playwright tests in `e2e/` |
| `kb/` | Knowledge base (start at `kb/INDEX.md`): domain model, requirements, ADRs, design system |
| `docs/` | GDD deliverables: personas, flows, IA, wireframes, research and validation instruments |
| `.planning/` | Roadmap, requirements, per-phase plans, `AUDIT-2026-10-25.md` (known gaps) |
| `PRODUCT.md` | Product and visual direction ("Slate Glass") |

## Status

Phases 1-12 (all three role interfaces, deployment) are built. Phase 13 (validation and final docs) needs real research and usability sessions from the team; results are never generated. Known gaps (event lifecycle, login hardening, pagination) are listed in `.planning/AUDIT-2026-10-25.md`.
