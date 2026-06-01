# Examples: before → after

A deliberately bloated customization set (`before/`) and its lean rewrite (`after/`).
Used as teaching material and as a fixture to sanity-check `/token-audit`,
`/token-refactor`, and `/token-review`.

## What changed

| File | Before | After | Why |
|---|---|---|---|
| `copilot-instructions.md` | ~805 est. tokens of praise, discoverable facts, duplicated rules, **and a hardcoded DB password + API key** | ~70 est. tokens: 2 durable rules + a pointer (~91% smaller) | Always-on bloat removed; secrets removed (rubric F); path rules moved out |
| `instructions/typescript.instructions.md` | — (rules were always-on in the big file) | `applyTo: **/*.{ts,tsx}` scoped | Charged only when editing TS, not every request |
| `prompts/deploy.prompt.md` | ~360 est. tokens, chatty, no frontmatter | ~105 est. tokens: terse `/deploy-staging` with `mode` + minimal `tools` + output cap (~71% smaller) | On-demand, scoped tools, output constrained |

## Try it

1. Open `before/copilot-instructions.md` → run `/token-audit`. Expect High-severity
   findings for always-on bloat and the embedded secrets, plus a re-architecture into
   the `after/` shape.
2. Run `/token-refactor` on it → expect output resembling `after/`.
3. Run `/token-review` on a diff that adds `before/*` → expect ❌ (over budget +
   secrets); on `after/*` → expect ✅.
