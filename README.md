# Copilot Token-Reduction Toolkit (SRE)

A portable toolkit for **finding and fixing token / premium-request waste** in GitHub
Copilot customizations — built for **VS Code + GitHub Copilot**. Run it against a single
prompt, a whole repo, or loose prompts people keep outside any repo.

It practices what it preaches: the heavy material lives in on-demand skill
`references/`, the chat mode is read-only with a minimal tool set, and the prompt files
are short wrappers — so the toolkit's own always-on footprint is ~zero.

## What's in here

| Path | What it is |
|---|---|
| `skills/copilot-token-audit/` | **The analyzer.** `SKILL.md` + on-demand `references/` (rubric, cost model, anti-patterns). |
| `.github/prompts/token-audit.prompt.md` | `/token-audit` — audit a file / selection / pasted prompt. |
| `.github/prompts/token-refactor.prompt.md` | `/token-refactor` — rewrite a customization to be leaner. |
| `.github/prompts/token-review.prompt.md` | `/token-review` — PR gate against the authoring standard. |
| `.github/chatmodes/token-optimizer.chatmode.md` | **Token Optimizer** — read-only persona for interactive, multi-file audits. |
| `docs/token-reduction-guide.md` | The expert guide: levers + content-exclusion/MCP checklists. |
| `docs/customization-architecture.md` | Decision tree: instructions vs prompt vs skill vs chat mode. |
| `docs/authoring-standard.md` | Token budgets + rules; what `/token-review` enforces. |
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

1. **Per-repo** — copy `skills/copilot-token-audit/` and `.github/prompts/*` into a
   target repo so the team gets `/token-audit`, `/token-refactor`, `/token-review`,
   and the skill there.
2. **Per-user (recommended for loose prompts)** — put the skill and prompt files in your
   **VS Code user-level** prompt/skill locations and add that path to
   `chat.promptFilesLocations`. Then the `/token-*` commands work in **every** workspace,
   including when you just paste a loose prompt. Turn on **Settings Sync** to share across
   machines.
3. **Interactive** — pick the **Token Optimizer** chat mode and point it at any open files.

## How the pieces fit

```
audit  → /token-audit  or  Token Optimizer chat mode   (find waste, estimate savings)
fix    → /token-refactor                                (rewrite leaner / re-architect)
gate   → /token-review                                  (block regressions in PRs)
prove  → docs/measuring-savings.md                      (before/after metrics)
learn  → docs/ guide, cheat-sheet, authoring-standard   (team enablement)
```

## Scope

This toolkit is **only about token reduction**. Domain SRE prompts (incident triage,
postmortems, log analysis, IaC review) are intentionally out of scope here and will be
added separately. A deterministic bulk scanner for cross-repo triage is a planned,
optional add-on.

See [`docs/token-reduction-guide.md`](docs/token-reduction-guide.md) to go deeper.
