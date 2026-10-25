# Phase 12 Summary — Deploy & Harden

## What changed

- Verified the Worker/D1 and Vercel production cutover, deployed API smoke, and production browser suite.
- Ran Lighthouse on Student, Coordinator and Admin home pages: 96, 100 and 100.
- Documented D1 backup/restore and verified a Wrangler export/import using two disposable local D1 databases; all application-table counts and triggers matched.
- Added and passed a real browser Admin clash/return journey against a local Worker and D1.
- Scanned all Git history with Gitleaks: 14 commits, no findings.
- At the user's direction, deleted GCP `ce-vm` and released `ce-ip`; preserved its 30 GB disk.

## Requirements covered

- DEPLOY-01, DEPLOY-02, DEPLOY-03, DEP-02.

## Verification

- Evidence and accepted follow-up are in `12-VERIFICATION.md`.
- Lighthouse JSON reports are in `lighthouse/`.
- D1 recovery steps are in `D1-RECOVERY.md`.
- GCP follow-up checklist is in `BILLING-OWNER-REVIEW.md`.

## Open follow-up accepted at phase closure

- The club billing owner still needs to review charges and the retained disk's data/backup ownership, retention and project disposition. The user directed Phase 12 closure with this review outstanding. Do not delete the retained disk or project until that review.

## KB ids consulted

`adr-001-stack`, `dom-domain-model`, `dom-requirements`, `dom-scenarios`, `src-accessibility-areas`, `adr-004-scope`.
