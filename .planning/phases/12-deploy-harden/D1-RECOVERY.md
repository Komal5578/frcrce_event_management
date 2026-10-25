# D1 backup and restore

This runbook uses Cloudflare's SQL export/import path. Keep backup files encrypted and access-restricted; they contain account and event data. Never put a production export in Git.

## Export

From `worker/`, export the named database remotely and retain the generated SQL file in the approved backup location:

```sh
npx wrangler d1 export college-events-v2 --remote --output /secure-backups/college-events-v2-YYYY-MM-DD.sql
```

Record the timestamp, database name, file size, and a SHA-256 checksum in the backup inventory. Confirm the command completed before any restore or destructive operation.

## Restore to a disposable database

Create a separate D1 database with a recovery-test name. Make a temporary Wrangler config whose D1 binding has that database's name and ID; pass it with `--config` for the commands below. Keep the production config unchanged. Apply the full export to the empty target because it includes schema and data:

```sh
npx wrangler d1 create college-events-v2-restore-test
npx wrangler d1 execute college-events-v2-restore-test --config=./wrangler.restore-test.jsonc --remote --file=/secure-backups/college-events-v2-YYYY-MM-DD.sql
```

For a data-only export, apply the matching migrations to the empty target before importing. Verify table counts and representative rows against the source inventory, then run read-only health/domain queries. Remove the disposable database only after recording evidence and getting billing-owner approval for cleanup.

## Local disposable restore drill

The Phase 12 drill applies both migrations and the repo seed to Wrangler's local D1, exports that disposable database, imports the export into a second disposable local D1, and compares table counts. It does not contact or modify the production database. Local seed data verifies the restore mechanics; it is not a production backup restore.

KB ids: `adr-001-stack`, `dom-domain-model`.
