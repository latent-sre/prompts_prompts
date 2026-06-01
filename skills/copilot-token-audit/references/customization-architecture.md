# Customization Architecture: which primitive, and why it matters for tokens

GitHub Copilot offers four customization primitives. Choosing the right one is the
single biggest token lever, because two of them are **always-on** (charged on every
request) and two are **on-demand** (charged only when invoked).

## The four primitives (VS Code + Copilot)

| Primitive | File | Cost profile | Use for |
|---|---|---|---|
| **Custom instructions** | `.github/copilot-instructions.md` | **Always-on**, every request | A few durable, repo-wide rules |
| **Path instructions** | `.github/instructions/*.instructions.md` (`applyTo` glob) | **Always-on for matching paths** | Rules that apply only to certain files |
| **Prompt file** | `.github/prompts/*.prompt.md` (run as `/name`) | **On-demand** | A repeatable task people invoke |
| **Chat mode** | `.github/chatmodes/*.chatmode.md` | On-demand (whole session) | A scoped persona + limited tool set |
| **Skill** | `skills/<name>/SKILL.md` (+ on-demand assets) | **On-demand, progressive** | A specialist task with bundled references |

## Decision tree

```
Is it a rule that must apply automatically to (almost) every request?
├─ YES → does it apply only to some paths?
│        ├─ YES → path instructions (*.instructions.md with applyTo)
│        └─ NO  → custom instructions (copilot-instructions.md) — keep tiny
└─ NO → is it a task people invoke on demand?
         ├─ A short, repeatable task → prompt file (/command)
         ├─ A task needing bundled reference material/assets → skill (SKILL.md + references/)
         └─ A whole working session with a specific persona / limited tools → chat mode
```

## Token rules of thumb

- **Default to on-demand.** If content isn't needed on (almost) every request, it does
  not belong in instructions. Move it to a prompt file or skill — that's progressive
  disclosure, and it's free until triggered.
- **Scope always-on with `applyTo`.** A rule that only matters for `**/*.tf` should not
  be charged when editing Python.
- **Prefer skills for anything with references.** A skill keeps `SKILL.md` short and
  loads `references/` only when the task needs them — instead of paying for a giant
  prompt every time it runs.
- **Chat modes are for tool-scoping.** Their main token benefit is a *minimal* tool set
  (fewer tool/MCP definitions per agent step).

## Common re-architecture moves the audit recommends

- Always-on section that's rarely relevant → **prompt file** or **skill**.
- Monolithic `copilot-instructions.md` → split into `applyTo`-scoped files + a tiny core.
- Repeatedly re-typed chat prompt → **prompt file**.
- Big prompt full of tables/specs → **skill** with `references/`.
- Chat mode/agent with a huge tool list → trim to the minimum tools.
