# 08-05 Summary: ADR-002 decision and final gate

- **ADR-002:** the user confirmed it as is on 2026-10-23 (Organizer is a flag on a Student account). `kb/decisions/adr-002-roles.md` now says so (`confidence: source`).
- **CLAUDE.md:** the repo-root wording now points to `/frontend` and `/backend/migrations`. The paths for `0002_guards.sql`, `lib/domain/*` and `lib/errors.ts` use the new prefixes.
- **REQUIREMENTS.md:** REBASE-01..04 marked complete.
- **STATE.md:** Phase 8 done and uncommitted; next is Phase 9.

## Gate
- `node kb/tools/build-index.mjs`: ok, 25 notes.
- No "worktree" in AGENTS.md; CLAUDE.md mentions `frontend`.
- The Cloudflare/wrangler/D1 grep over CLAUDE.md, AGENTS.md and kb/decisions has 3 hits, all history or superseded wording (adr-001 lines 31-32, CLAUDE.md line 26).
- `git status --short` shows only the expected moves, deletions and doc edits.

## Open items
- `frontend/eslint.config.mjs` still has stale `supabase`, `.open-next` and `.wrangler` globalIgnores. A hook blocked the edit in 08-03 and it was not bypassed. It's harmless; remove it by hand or in Phase 10.
- `@opennextjs/cloudflare` and `wrangler` stay in `frontend/package.json` until Phase 10/11.
- Nothing is committed. Project rule: one commit for the whole phase, made when the user asks.
