# GCP + FastAPI deployment (branch `gcp-fastapi`)

Demo deployment. Supersedes the Cloudflare Worker + D1 backend **on this branch only**; `main` is unchanged.

## Architecture

```
Browser ──HTTPS──▶ Vercel (Next.js, bom1)
                      │  /api/* rewrite (first-party session cookie, no CORS)
                      ▼
                 34-93-90-45.sslip.io  (GCP e2-small, asia-south1-a, static IP ce-api-ip)
                   Caddy  ── auto-HTTPS (Let's Encrypt), gzip/zstd
                      ▼
                   FastAPI (uvicorn, 2 workers) ──▶ Redis 7  (response cache, 128 MB LRU, no persistence)
                      ▼
                   PostgreSQL 17  (volume app_pgdata)
```

One VM runs all four containers from `docker-compose.prod.yml`. The VM is in Mumbai, next to the users and Vercel's `bom1`.

## Cache design (`backend/app/cache.py`)

- Caches every authenticated `GET /api/*` JSON `200`, keyed by **session + path + query + data version**.
  A hit does no database work at all, including the session lookup.
- **Invalidation:** any successful non-GET bumps one version counter in Redis, so all cached reads go stale together.
  The bump happens when the response starts and again after the request finishes, because the DB transaction can
  commit after the response has started. Login does not bump. Result: a user always reads their own write.
- **Safety:** per-session keys (no cross-user leaks), errors and `Set-Cookie` responses are never cached,
  TTL 30 s (`CACHE_TTL`) bounds the time a session stays valid after expiry, and a logout is a write so it invalidates.
- **Fails open:** no `REDIS_URL`, or Redis down, and requests go straight to Postgres (250 ms socket timeout).
- Responses carry `x-cache: HIT|MISS`.
- Checked by `backend/tests/test_cache.py` (fake Redis, no services needed).

Measured locally (Postgres + Redis in Docker, `/api/events`, 400 requests at concurrency 20): p50 28 ms uncached vs
1.7 ms cached. These are local numbers, not GCP numbers, and `curl` spawn cost limits the throughput figure.

## Not done (known ceilings)

- `/api/events` still returns the whole list. The audit's pagination and counters (P2 in `.planning/AUDIT-2026-10-25.md`)
  are not applied. The cache hides it for repeat reads but the first read after any write pays full price.
- One VM, one Postgres, no backups, no failover. Fine for a demo.
- Cache invalidation is global (any write clears everything). Fine while writes are rare relative to reads.
- `e2e/admin-approval-clash.spec.ts` fails on a fresh seed of **both** backends: it expects event 2 to clash with the
  Keynote, which neither seed provides. It predates this branch.
- Demo accounts use the public password in `backend/seed/seed.sql` (`SEED_DEMO=true`). Delete the VM when done.

## Operate

```bash
scripts/deploy.sh college-events-29738            # ship repo + docker compose up -d --build
gcloud compute ssh ce-api --zone=asia-south1-a --project=college-events-29738
  cd ~/app && sudo docker compose -f docker-compose.prod.yml --env-file ~/.env.prod logs -f api
  # secrets live only in ~/.env.prod on the VM (DB_PASSWORD, SITE, SEED_DEMO, DEMO_LOGIN)
```

Point a Vercel deployment at it with `vercel deploy --build-env BACKEND_URL=https://34-93-90-45.sslip.io -e BACKEND_URL=https://34-93-90-45.sslip.io`
(the rewrite is compiled at build time, so it needs the build env). To cut production over, set the Production
`BACKEND_URL` to the same value and redeploy with `vercel deploy --prod`. To roll back, restore the Worker URL.

## Tear down (stops all billing for this deployment)

```bash
gcloud compute instances delete ce-api --zone=asia-south1-a --project=college-events-29738
gcloud compute addresses delete ce-api-ip --region=asia-south1 --project=college-events-29738
```

The 30 GB `ce-vm` disk in `us-central1-a` is from the earlier deployment and is **not** part of this; it is still
waiting on the billing-owner review noted in `CLAUDE.md`.
