# Token-Reduction Rubric (A–F)

Apply every category to each file in scope. For each finding, record: **severity**
(High / Med / Low), **location** (file + lines), **why it costs tokens**, **the fix**,
and an **estimated saving** (per-request, per-invocation, or behavioral).

Severity is driven mostly by **always-on multiplier**: a wasteful line in
`copilot-instructions.md` is charged on *every* request, so it is almost always
higher severity than the same waste in an on-demand prompt file.

---

## A. Always-on bloat (highest impact)

Targets: `copilot-instructions.md`, `*.instructions.md`, `AGENTS.md`.

Detect:
- File exceeds its budget in `../../../docs/authoring-standard.md`.
- Content discoverable from the code itself (folder structure, framework names,
  obvious conventions) — the model can read these; don't pay for them every request.
- LLM-generated boilerplate, filler, throat-clearing ("As an expert engineer, you
  should always strive to…").
- Duplicated rules across multiple instruction files.
- Broad rules with no `applyTo` scoping that only matter for some paths.

Fix: delete filler; compress to imperative bullets; move path-specific rules into
`applyTo`-scoped `*.instructions.md`; move occasionally-needed content to a prompt
file or skill.

Saving: every token removed here is multiplied by **all future requests** — quote
it that way ("~120 tokens × every chat request").

---

## B. Architecture / placement (re-architect)

Decide the right primitive with `../../../docs/customization-architecture.md`.

Detect & fix:
- **Always-on but rarely needed** → move to a **prompt file** or **skill**
  (progressive disclosure). Biggest single architectural win.
- **Repeated ad-hoc chat asks** (people re-typing the same long prompt) → make a
  **prompt file** (`/command`).
- **Big prompt carrying lots of reference material** → convert to a **skill**: short
  `SKILL.md` + on-demand `references/`.
- **Chat mode / agent with a huge tool list or many MCP servers** → trim to the
  minimum tools the task needs (see cost-model: ~100–500 tokens per MCP server per step).
- **One monolithic instruction file** covering many languages/areas → split by
  `applyTo` glob.

Saving: typically the largest, because it converts always-on cost into on-demand cost.

---

## C. Verbosity / redundancy

Targets: all files, especially prompts and skills.

Detect:
- Prose where bullets/imperatives would do.
- Restating model defaults or universally-known facts.
- The same instruction stated multiple ways.
- Long examples where one short example suffices.
- Politeness/meta narration ("Now, let's carefully think about…").

Fix: rewrite to terse imperatives; one canonical statement per rule; trim examples
to the minimum that disambiguates.

Saving: per-invocation input tokens.

---

## D. Output-token control (cheap, high ROI)

Output tokens cost **~5× input** (see cost-model). Most customizations never
constrain output.

Detect: no instruction limiting response length/format.

Fix: add defaults appropriate to the task, e.g.
- "Code only, no explanation unless asked." (≈40–70% output savings on code tasks)
- "Answer in bullets; no preamble or summary."
- "Return only the diff."

Saving: output tokens on every response the rule applies to.

---

## E. Runtime / workflow hygiene (behavioral)

Not file content, but include as advisory findings + link the cheat-sheet.

Detect / recommend:
- `@workspace` used for questions a `#file`/`#selection` scope would answer.
- Long-running chats never reset (history re-sent every turn) → start fresh per problem.
- Agent mode used for simple Q&A → use Ask mode (~60–90% savings).
- Premium model pinned for routine work → default to Auto/standard.
- Unused editor tabs left open (auto-included context) → close them.
- Unused MCP servers enabled → disable.
- No content exclusion → exclude `node_modules`, `dist`, generated, vendored, logs.

Saving: behavioral; often the largest real-world reduction.

---

## F. Secrets / PII (security + token)

Detect: hardcoded tokens, API keys, internal hostnames, customer data, credentials,
or long internal URLs baked into instructions/prompts/skills.

Fix: remove; reference a secret manager or env var by name; never embed real values.

Saving: removes tokens **and** a security/leak risk (the value is sent to the model
on every relevant request). Always mark **High** severity.
