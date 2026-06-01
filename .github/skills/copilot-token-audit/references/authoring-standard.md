# Copilot Customization Authoring Standard

The rules that keep customizations lean over time. `/token-review` enforces these on
PRs; `/token-audit` and `/token-refactor` use them as targets. **Tune the budgets to
your team** — they are deliberately conservative defaults, not laws.

Token estimate used everywhere: `tokens ≈ characters / 4`.

## Token budgets (per file)

| File type | Budget (est. tokens) | Rationale |
|---|---|---|
| `copilot-instructions.md` | **≤ 500** | Always-on, every request. Keep it to durable, non-discoverable rules. |
| each `*.instructions.md` | **≤ 300** | Always-on for matching paths; must be `applyTo`-scoped. |
| each `*.prompt.md` | **≤ 400** | On-demand; longer reference material belongs in a skill. |
| each `*.chatmode.md` | **≤ 400** | Persona + minimal tool set, not a manual. |
| `SKILL.md` | **≤ 700** | Keep short; push detail to `references/` (loaded on demand). |
| each `references/*.md` | no hard cap | On-demand; size matters far less. |

Over budget is not automatically wrong — but it must be **justified** (e.g., a
genuinely irreducible rule set). Default action: trim or re-architect.

## Required practices

1. **Right primitive.** Follow [customization-architecture.md](customization-architecture.md).
   Always-on content that isn't needed (almost) every request must move to a prompt
   file or skill. This is a blocking violation in review.
2. **Scope always-on rules.** Every `*.instructions.md` must declare an `applyTo` glob.
3. **Output constraint.** Any customization that generates code or long text must cap
   output (e.g., "Code only, no explanation unless asked"; "answer in bullets").
4. **No discoverable facts.** Don't restate what the model can read from the repo
   (framework names, folder layout, language) or universal defaults.
5. **One source of truth.** No duplicated rules across instruction files.
6. **No secrets/PII.** Never embed credentials, keys, internal hostnames, or customer
   data. Reference env vars / a secret manager by name. Blocking violation.
7. **Terse style.** Imperative bullets over prose; one statement per rule; minimal examples.
8. **Frontmatter present.** Prompts have `description` + `mode`; chat modes have
   `description` + `tools`; skills have `name` + `description`; path instructions have `applyTo`.

## Review verdict mapping (used by `/token-review`)

- ❌ **Changes requested** (blocking): over budget without justification, wrong
  primitive, missing `applyTo` on a path-instruction, secrets/PII, missing required
  output constraint on a generative customization.
- ⚠️ **Non-blocking nits**: verbosity, weak examples, minor duplication.
- ✅ **Pass**: within budget, right primitive, scoped, constrained, secret-free.
