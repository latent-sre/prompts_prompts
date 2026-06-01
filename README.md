# Copilot Token-Reduction Toolkit (SRE)

A portable toolkit for **finding and fixing token / premium-request waste** in GitHub
Copilot customizations — built for **VS Code + GitHub Copilot**. Run it against a single
prompt, a whole repo, or loose prompts people keep outside any repo.

It practices what it preaches: the heavy material lives in on-demand skill
`references/`, the chat mode is read-only with a minimal tool set, and the prompt files
are short wrappers — so the toolkit's own always-on footprint is ~zero.

## What's in here

**The skill is the self-contained, portable unit** — everything the audit logic loads
on demand lives under `.github/skills/copilot-token-audit/references/`. The prompts and chat
mode are thin wrappers that reference the skill, so they must travel **with** it. The
`docs/` files are human-facing reading material only; Copilot never auto-loads them, so
they cost zero tokens.

| Path | What it is |
|---|---|
| `.github/skills/copilot-token-audit/SKILL.md` | **The analyzer** — trigger, procedure, report format. |
| `.github/skills/copilot-token-audit/references/` | On-demand: rubric (A–F), cost model, anti-patterns, **customization-architecture**, **authoring-standard**. |
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

1. **Per-repo** — copy the whole bundle together: `.github/skills/copilot-token-audit/`,
   `.github/prompts/*`, and `.github/chatmodes/*`. These `.github/` locations are
   auto-discovered (no extra setting needed). The prompts and chat mode reference the skill
   by relative path, so the skill must be present for their links to resolve.
2. **Per-user (recommended for loose prompts)** — put the skill in `~/.copilot/skills/` and
   the prompt/chat-mode files in your VS Code user locations (with `chat.promptFilesLocations`
   / `chat.modeFilesLocations`). Then the `/token-*` commands and skill work in **every**
   workspace, including on a pasted loose prompt. Turn on **Settings Sync** to share across machines.
3. **Central, many repos (best for an org)** — keep one shared copy of the skill (e.g. in a
   tools repo or shared path) and point every repo at it with `chat.agentSkillsLocations`,
   so you maintain the audit in one place instead of copying it into each repo.
4. **Interactive** — pick the **Token Optimizer** chat mode and point it at any open files.

## How the pieces fit

```
audit  → /token-audit  or  Token Optimizer chat mode   (find waste, estimate savings)
fix    → /token-refactor                                (rewrite leaner / re-architect)
gate   → /token-review                                  (block regressions in PRs)
prove  → docs/measuring-savings.md                      (before/after metrics)
learn  → docs/ guide + cheat-sheet; skill references    (team enablement)
```

## Compatibility (verified against current VS Code docs, June 2026)

Copilot customization is evolving; these identifiers vary by VS Code / Copilot build:

- **Instruction settings** — `.github/copilot-instructions.md` and `*.instructions.md` apply
  automatically (file-based). The old `github.copilot.chat.codeGeneration.useInstructionFiles`
  toggle is **deprecated** (VS Code 1.102) — don't rely on it. File locations are set via
  `chat.promptFilesLocations`, `chat.instructionsFilesLocations`, `chat.modeFilesLocations`
  (maps of path → bool); a separate `chat.promptFiles` enable flag is no longer required.
- **Prompt `mode` field** — this toolkit uses `mode: agent` (broadly supported). The newest
  VS Code renames it to `agent:` (values `ask` | `agent` | `plan`); switch if your build needs it.
- **`tools:` names** — this toolkit uses widely-supported bare names (`codebase`, `search`,
  `changes`). The newest VS Code uses namespaced ids (`search/codebase`, `search/usages`,
  `search/changes`, `edit/editFiles`, `web/fetch`). Keep tool sets minimal; adjust to your build.
- **Chat-mode / agent format** — VS Code uses `*.chatmode.md` in `.github/chatmodes/`;
  GitHub.com uses `*.agent.md` in `.github/agents/`. This toolkit uses the VS Code form.
- **Skill discovery** — project skills in `.github/skills/<name>/SKILL.md` (also `.claude/skills/`,
  `.agents/skills/`); personal in `~/.copilot/skills/`; shared paths via `chat.agentSkillsLocations`.
  The skill's frontmatter `name` must match its folder.

The audit logic itself (rubric, cost model, report format) is tool-agnostic and unaffected.

## Scope

This toolkit is **only about token reduction**. Domain SRE prompts (incident triage,
postmortems, log analysis, IaC review) are intentionally out of scope here and will be
added separately. A deterministic bulk scanner for cross-repo triage is a planned,
optional add-on.

See [`docs/token-reduction-guide.md`](docs/token-reduction-guide.md) to go deeper.
