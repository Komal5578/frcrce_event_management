# Phase 12: Deploy & Harden (context brief)

Requirements: DEPLOY-01..03, DEP-02. Before starting, the user must have AWS (check the free-tier type) and Vercel accounts.

## Backend (AWS free tier)
- One EC2 t3.micro (Ubuntu) running Docker and docker-compose: Postgres (volume) + api + Caddy.
- Caddy gets automatic HTTPS on `<public-ip>.sslip.io`. Security group allows 22 (your IP only), 80 and 443.
- Nightly cron runs `pg_dump` and uploads to S3 through an instance role.
- `scripts/deploy.sh`: ssh, git pull, `docker compose up -d --build`, migrate.
- Production `.env`: `DEMO_LOGIN` set by an explicit decision (viva demo vs real use).

## Frontend (Vercel)
- Root directory `/frontend`; env `API_URL=https://<ip>.sslip.io`.
- Check the cookie stays first-party through the rewrite.

## Verify
- Playwright TT-S1, TT-C1 and TT-A1 against the prod URL.
- Clash and double registration are rejected in prod.
- A student is refused admin/coordinator APIs (403).
- Lighthouse a11y score of at least 95 on each role home.
- Secret scan of the repo and its history.
- Take down or redirect the old v1 Cloudflare deployment (it has `DEMO_LOGIN=true`).
