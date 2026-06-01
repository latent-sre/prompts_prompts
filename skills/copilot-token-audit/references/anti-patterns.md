# Copilot Token Anti-Patterns (bad → good)

Concrete patterns the audit can name and fix. Each shows the waste and a leaner
replacement that keeps the intent.

---

## 1. Kitchen-sink `copilot-instructions.md`

**Bad** (always-on, ~paragraphs of prose):
```markdown
As an expert senior software engineer, you should always strive to write clean,
maintainable, well-documented code. Remember that this project uses TypeScript and
React. We really value readability. Please make sure to add helpful comments and to
follow best practices at all times when generating any code for this repository...
```
**Good** (terse, only non-discoverable facts):
```markdown
- Strict TypeScript; no `any`.
- React function components + hooks only.
- Code only, no explanation unless asked.
```
Why: the framework is discoverable from `package.json`; prose and praise are pure
always-on cost.

---

## 2. Global rule that should be path-scoped

**Bad:** a rule about test style sitting in `copilot-instructions.md` (charged on
every request, including non-test edits).

**Good:** `.github/instructions/tests.instructions.md`
```markdown
---
applyTo: "**/*.test.ts"
---
- Use Vitest; one behavior per `it`.
```
Why: loads only when editing tests.

---

## 3. Always-on content that's only occasionally needed

**Bad:** a 60-line "How to write a migration" section permanently in instructions.

**Good:** a prompt file `/new-migration` or a skill `migrations/SKILL.md`.
Why: progressive disclosure — zero tokens until invoked.

---

## 4. People re-typing the same long prompt

**Bad:** every engineer pastes a 200-word "review this PR for X, Y, Z" prompt.

**Good:** `.github/prompts/pr-review.prompt.md` invoked as `/pr-review`.
Why: standardized, shorter to invoke, edited in one place.

---

## 5. Giant prompt carrying reference material

**Bad:** one `.prompt.md` with 1,500 tokens of API tables inline.

**Good:** a skill — short `SKILL.md` + `references/api-tables.md` loaded on demand.
Why: the tables cost tokens only when the task needs them.

---

## 6. `@workspace` for a local question

**Bad:** "@workspace why does this function throw?" with the function on screen.

**Good:** select the function → "#selection why does this throw?"
Why: avoids full repo-index retrieval.

---

## 7. Chat mode / agent with every tool enabled

**Bad:** a chat mode listing 20 tools + 10 MCP servers for a read-only review persona.

**Good:**
```markdown
---
description: Read-only reviewer
tools: ['search', 'codebase', 'usages']
---
```
Why: each tool/MCP definition is re-sent per agent step.

---

## 8. Premium model pinned everywhere

**Bad:** every prompt file sets `model: <premium>` including trivial scaffolding.

**Good:** omit `model` (Auto) or set a standard model; pin premium only on hard,
multi-step reasoning prompts.
Why: premium tokens cost far more per token.

---

## 9. No output constraint

**Bad:** "Generate the function." → model returns code + 3 paragraphs explaining it.

**Good:** "Generate the function. Code only, no explanation."
Why: output ≈ 5× input cost.

---

## 10. Secrets baked into a prompt

**Bad:** `Use API key sk-live-abc123 and host db.internal.acme.com:5432`.

**Good:** `Use the API key from $ACME_API_KEY and the host from config.`
Why: security leak + paid for on every relevant request. High severity.
