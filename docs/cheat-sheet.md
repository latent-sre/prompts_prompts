# Copilot Token-Saving Cheat-Sheet (print me)

One page of habits. Most real-world savings come from behavior, not file edits.

## Context — send less
- Use `#file` / `#selection` for local questions. **Avoid `@workspace`** unless you
  truly need repo-wide search (it pulls broad index context).
- Don't paste whole files — paste the relevant snippet.
- **Close editor tabs you're not using** — open tabs are auto-included as context.

## Conversation — reset often
- **Start a fresh chat for each new problem.** History is re-sent every turn, so long
  threads get expensive fast.
- Don't keep one mega-thread for the whole day.

## Mode — match the task
- **Ask mode** for questions/explanations (~60–90% cheaper).
- **Agent mode** only for real multi-step work (edits across files, tool use).
- Prefer **inline completions** for routine code — far cheaper than chat.

## Model — default cheap
- Leave model on **Auto** (or a standard model) for everyday work.
- Pin a **premium** model only for genuinely hard, multi-step reasoning.

## Output — ask for less
- Add "**Code only, no explanation unless asked**" to instructions/prompts
  (output ≈ 5× input cost).
- Ask for bullets / just the diff when that's all you need.

## Tools — keep them lean
- **Disable MCP servers you don't use** (each adds ~100–500 tokens per agent step).
- Give chat modes the **minimum** tool set.

## Files — right place, small size
- Keep `copilot-instructions.md` tiny; move rarely-needed content to a `/prompt` or skill.
- Scope path rules with `applyTo`.
- Run `/token-audit` on prompts you reuse a lot.

---
Full detail: [token-reduction-guide.md](token-reduction-guide.md) ·
Budgets: [authoring-standard.md](authoring-standard.md)
