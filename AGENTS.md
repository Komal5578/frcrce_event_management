# AGENTS.md: how agents work in this repo
read @CLAUDE.md

Applies to any AI agent (Claude Code, Codex, subagents). `CLAUDE.md` has the project rules; this file has the roles and boundaries.

## Ground rules
1. Read `kb/INDEX.md` before any design, UX or scope decision; open only needed notes; cite ids.
2. One GSD phase per session. State lives in `.planning/` (STATE.md, ROADMAP.md, phase folders), not in chat.
3. Never fabricate research, usability findings, quotes or participants. Mark guesses `assumed`.
4. Don't expand scope beyond `adr-004-scope`.
5. Stay inside the current phase's scope.

## Roster (reuse installed agents; don't write new ones)
| Job | Agent / skill |
|---|---|
| Project init, roadmap | `gsd-new-project`, `gsd-roadmapper` |
| Phase discussion / planning | `gsd-discuss-phase`, `gsd-plan-phase`, `gsd-planner`, `gsd-plan-checker` |
| UI contract and review | `gsd-ui-phase` (`gsd-ui-researcher`, `gsd-ui-checker`), `gsd-ui-review` (`gsd-ui-auditor`) |
| Building | `gsd-execute-phase` (`gsd-executor`) |
| Verification / UAT | `gsd-verifier`, `gsd-verify-work` |
| Accessibility | `ecc:a11y-architect`, `ecc:frontend-a11y`, `design:accessibility-review` |
| Design critique and copy | `design:design-critique`, `design:ux-copy` |
| Authorization layer / database review | `ecc:database-reviewer`, `ecc:security-reviewer` |
| Code review | `ecc:code-reviewer`, `ecc:typescript-reviewer`, `ecc:react-reviewer` |
| E2E / browser checks | `ecc:e2e-runner`, in-app browser pane |
| Docs lookup | context7 MCP |
| Over-engineering audit | `ponytail:ponytail-audit` (before final) |

## Stack and boundaries
Cloudflare Worker + D1 in `/worker`, Next.js in `/frontend` (Vercel); see `kb/decisions/adr-001-stack.md`. The Worker domain layer is the authorization boundary. Vercel rewrites `/api/*` through `BACKEND_URL` so session cookies remain first-party. The old FastAPI/Postgres `/backend` is retained but unused until cutover verification. `kb/`: run `node kb/tools/build-index.mjs` after edits. `.planning/`: GSD workflows own it.

## Handoff format (write to the phase folder, not chat)
What changed · which requirement ids covered · how to verify · open questions · kb ids consulted.

## Escalate to the user when
A decision changes scope, roles or stack; real research data is needed; an account/key is needed (Cloudflare, Vercel); two kb notes conflict.
