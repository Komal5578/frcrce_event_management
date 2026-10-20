# AGENTS.md: how agents work in this repo

Applies to any AI agent (Claude Code, Codex, subagents). `CLAUDE.md` has the project rules; this file has the roles and boundaries.

## Ground rules
1. Read `kb/INDEX.md` before any design, UX or scope decision; open only needed notes; cite ids.
2. One GSD phase per session. State lives in `.planning/` (STATE.md, ROADMAP.md, phase folders), not in chat.
3. Never fabricate research, usability findings, quotes or participants. Mark guesses `assumed`.
4. Don't expand scope beyond `adr-004-scope`. If you think something is missing, record it in `.planning/` as a proposal.
5. Stay inside your owned paths. Cross-boundary changes go through the phase owner.

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
| Database / RLS review | `ecc:database-reviewer`, `ecc:security-reviewer` |
| Code review | `ecc:code-reviewer`, `ecc:typescript-reviewer`, `ecc:react-reviewer` |
| E2E / browser checks | `ecc:e2e-runner`, in-app browser pane |
| Docs lookup | context7 MCP |
| Over-engineering audit | `ponytail:ponytail-audit` (before final) |

## Ownership (for parallel waves)
| Area | Owner | Rule |
|---|---|---|
| `kb/` | any agent, via the KB maintenance rule in INDEX.md | run `node kb/tools/build-index.mjs` after edits |
| `docs/` (deliverables) | phase 1, 2, 6, 7 owners | no app code |
| `supabase/` (schema, RLS, seed) and `components/ui`, `lib/` | Phase 3 owner | **frozen after Phase 3**; changes need an explicit phase task |
| `app/(coordinator)/**` | Wave A agent 4a | only this folder + its tests |
| `app/(student)/**` | Wave A agent 4b | only this folder + its tests |
| `app/(admin)/**` | Wave A agent 4c | only this folder + its tests |
| `.planning/` | GSD workflows | don't hand-edit except STATE notes |

Parallel agents use separate git worktrees; merge after each passes its phase verification.

## Handoff format (write to the phase folder, not chat)
What changed · which requirement ids covered · how to verify · open questions · kb ids consulted.

## Escalate to the user when
A decision changes scope, roles or stack; real research data is needed; an account/key is needed (Supabase, Vercel); two kb notes conflict.
