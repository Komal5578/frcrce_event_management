# Phase 12 Plan 05 Summary: Retire Legacy v1 Worker

## What changed

- Deleted the legacy Cloudflare Worker named `college-events` after the v2 cutover and production smoke verification.
- The old public hostname `https://college-events.varadaj47.workers.dev` returned HTTP 404 after deletion; the active v2 Worker health endpoint continued returning HTTP 200.

## Requirements covered

- DEPLOY-02: the public v1 demo-login surface is no longer available.

## Verification

- Wrangler deletion completed for the exact Worker name `college-events`.
- Old v1 hostname: HTTP 404.
- Active v2 health route: HTTP 200 after the deletion.

## Open questions

- The legacy GCP `ce-vm` and `ce-ip` were later removed at the user's direction. Its 30 GB disk remains until the club billing owner reviews costs, data/backup ownership, retention and project disposition. See `BILLING-OWNER-REVIEW.md`.

KB id consulted: `adr-004-scope`.
