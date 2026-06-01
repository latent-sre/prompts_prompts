# Copilot Token-Reduction Toolkit (SRE)

A portable toolkit for **finding and fixing token / premium-request waste** in GitHub
Copilot customizations — built for **VS Code + GitHub Copilot**. Run it against a single
prompt, a whole repo, or loose prompts people keep outside any repo.

It practices what it preaches: the heavy material lives in on-demand skill
`references/`, the chat mode is read-only with a minimal tool set, and the prompt files
are short wrappers — so the toolkit's own always-on footprint is ~zero.

## What's in here

**The skill is the self-contained, portable unit** — everything the audit logic loads
on demand lives under `skills/copilot-token-audit/references/`. The prompts and chat
mode are thin wrappers that reference the skill, so they must travel **with** it. The
`docs/` files are human-facing reading material only; Copilot never auto-loads them, so
they cost zero tokens.

| Path | What it is |
|---|---|
| `skills/copilot-token-audit/SKILL.md` | **The analyzer** — trigger, procedure, report format. |
| `skills/copilot-token-audit/references/` | On-demand: rubric (A–F), cost model, anti-patterns, **customization-architecture**, **authoring-standard**. |
| `.github/prompts/token-audit.prompt.md` | `/token-audit` — audit a file / selection / pasted prompt. |
| `.github/prompts/token-refactor.prompt.md` | `/token-refactor` — rewrite a customization to be leaner. |
| `.github/prompts/token-review.prompt.md` | `/token-review` — PR gate against the authoring standard. |
| `.github/chatmodes/token-optimizer.chatmode.md` | **Token Optimizer** — read-only persona for interactive, multi-file audits. |
| `docs/token-reduction-guide.md` | The expert guide: levers + content-exclusion/MCP checklists. |
| `docs/measuring-savings.md` | Prove before/after with premium-request reports + Metrics API. |
| `docs/cheat-sheet.md` | One-page printable runtime-habits cheat-sheet. |
| `examples/before` · `examples/after` | A bloated set and its lean rewrite (teaching + fixture). |
| `.vscode/settings.json` | Settings that enable prompt/instruction/chat-mode files. |

## Quick start

1. Open this repo in VS Code (the `.vscode/settings.json` enables prompt files,
   instruction files, and chat modes).
2. In Copilot Chat, open `examples/before/copilot-instructions.md` and run
   **`/token-audit`**. You'll get a ranked report with estimated savings.
3. Run **`/token-refactor`** to get the lean rewrite; compare with `examples/after/`.

## Rolling it out across the org (many repos + loose prompts)

Your customizations live in many repos, and some people keep prompts outside repos.
Three adoption paths:

1. **Per-repo** — copy the whole bundle together: `skills/copilot-token-audit/`,
   `.github/prompts/*`, and `.github/chatmodes/*`. The prompts and chat mode reference the
   skill by relative path, so the skill must be present for their links to resolve.
2. **Per-user (recommended for loose prompts)** — put the same bundle in your **VS Code
   user-level** prompt/skill locations and add those paths to `chat.promptFilesLocations`
   (and the skill location). Then the `/token-*` commands work in **every** workspace,
   including when you just paste a loose prompt. Turn on **Settings Sync** to share across
   machines.
3. **Interactive** — pick the **Token Optimizer** chat mode and point it at any open files.

## How the pieces fit

```
audit  → /token-audit  or  Token Optimizer chat mode   (find waste, estimate savings)
fix    → /token-refactor                                (rewrite leaner / re-architect)
gate   → /token-review                                  (block regressions in PRs)
prove  → docs/measuring-savings.md                      (before/after metrics)
learn  → docs/ guide + cheat-sheet; skill references    (team enablement)
```

## Compatibility (check against your version)

Copilot customization is evolving, so a few identifiers may differ on your VS Code /
Copilot build — confirm before rolling out org-wide:

- **`.vscode/settings.json` keys** — e.g. `chat.promptFiles`, `chat.promptFilesLocations`,
  `chat.instructionsFilesLocations`, `chat.modeFilesLocations`,
  `github.copilot.chat.codeGeneration.useInstructionFiles`. Names/availability vary by version.
- **Chat-mode / agent format** — VS Code uses `*.chatmode.md` in `.github/chatmodes/`;
  GitHub.com uses `*.agent.md` in `.github/agents/`. This toolkit uses the VS Code form.
- **`tools:` names** in prompts/chat modes (e.g. `codebase`, `search`, `usages`, `changes`,
  `editFiles`) are version-dependent; keep tool sets minimal and adjust to what your build exposes.
- **Skill discovery** — how `skills/**/SKILL.md` is auto-loaded vs. installed (e.g. via
  `gh skills install`) is still maturing; verify your install path.

The audit logic itself (rubric, cost model, report format) is tool-agnostic and unaffected.

## Scope

This toolkit is **only about token reduction**. Domain SRE prompts (incident triage,
postmortems, log analysis, IaC review) are intentionally out of scope here and will be
added separately. A deterministic bulk scanner for cross-repo triage is a planned,
optional add-on.

See [`docs/token-reduction-guide.md`](docs/token-reduction-guide.md) to go deeper.
