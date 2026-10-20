# Knowledge base index (read this first)

Project: College Event Planning and Management System, an HMI mini project built with Goal-Directed Design.
The attendance documents in `source/attendance-reference/` are a **reference example of the method**, not the product. Domain notes in `domain/` apply that method to events. Cite note ids (e.g. `dom-requirements`) in plans, PRs and decisions.

Confidence: `source` (reference docs) · `derived` (reasoned) · `assumed` (hypothesis) · `evidence` (real team research only). Never present `assumed` as research.

## Route your question
| If you need to decide... | Open |
|---|---|
| What are we building, scope, non-goals | `dom-topic-brief` |
| How to translate an attendance idea to events (read first for any design choice) | `dom-how-to-think` |
| The GDD phases and their outputs | `src-gdd-process` |
| What deliverables are required, where they live | `src-deliverables-13`, `dom-deliverable-map` |
| Why goal-directed, not feature-driven | `src-feature-vs-goal-directed` |
| Who the users are, their goals/pains | `dom-personas`, `dom-goals-tasks` |
| Scenarios and test tasks | `dom-scenarios` |
| What the system must do | `dom-requirements` |
| Screens, navigation, order of steps | `dom-flows` |
| Data, constraints, security rules | `dom-domain-model` |
| Status names, icons, colours | `dom-status-vocabulary` |
| Which HMI problems to investigate and measure | `src-hmi-problems-pattern`, `dom-hmi-problems` |
| HMI heuristics to apply and check | `src-hmi-principles` |
| Universal design and accessibility checks | `src-universal-design`, `src-accessibility-areas` |
| How to test and measure usability | `src-evaluation-methods` |
| What the final one-page output looks like | `src-model-infographic` (+ `source/attendance-reference/design-model.png`) |
| Tech stack, roles, KB format, scope cuts | `adr-001-stack`, `adr-002-roles`, `adr-003-kb-format`, `adr-004-scope` |
| Design tokens and components | `ds-readme` |

## Maintenance
- New note: add frontmatter (`id, type, title, tags, confidence, sources, summary, updated`) and a row above.
- Run `node kb/tools/build-index.mjs`: it fails on bad frontmatter or ids missing from this file, and writes `manifest.json`.
- Search: `grep -ril "<term>" kb/ --include=*.md`.
- Originals for deep lookups: `source/attendance-reference/original.md` (text, base64 removed) and `original.pdf`.
