# Measuring the Savings (prove before/after)

Token reduction only counts if you can show it. Copilot doesn't bill raw tokens to
end users — the user-facing meter is **premium requests** — so measure both the
proxy (premium requests / usage) and the structural estimate (`chars/4`).

## 1. Capture a baseline (before changes)

**Org / Enterprise admins** — the authoritative sources:
- **Premium request usage report** (Settings → Billing → Copilot usage / "Get usage
  report"): CSV of premium requests per user, per model, per day. This is your hard
  before/after number.
- **Copilot Metrics API** (`/orgs/{org}/copilot/metrics` and the user/team variants):
  programmatic engagement and usage trends over time. Pull a 2–4 week baseline.
- **Org Copilot dashboard**: trends without exporting.

**Individuals / no admin access:**
- VS Code shows your premium-request consumption in the Copilot status/usage panel.
  Note your monthly percentage-used and the date.
- Use the audit's `chars/4` **estimated always-on tokens** as a structural baseline
  (e.g., "instructions = ~1,800 est. tokens × every request").

## 2. Make the changes
Run `/token-audit` → apply via `/token-refactor` → gate with `/token-review`.
Record, per change, the **estimated** saving the audit reported (separate always-on
per-request savings from behavioral savings).

## 3. Re-measure (after, same window length)
- Pull the **same** premium-request report / Metrics API window (e.g., next 2 weeks)
  and compare per-user / per-model totals. Hold team size and activity roughly constant.
- Recompute the `chars/4` always-on total; the delta is your guaranteed per-request
  structural saving.

## 4. Report it
A simple before/after table is enough:

| Metric | Before | After | Δ |
|---|---|---|---|
| Always-on est. tokens (instructions) | 1,800 | 420 | −77% |
| Premium requests / dev / week | … | … | … |
| % on Agent mode for simple Q&A | … | … | … |

## Caveats
- Premium requests depend on user behavior and feature usage, not just file size —
  isolate changes (don't ship a new MCP server the same week) and use a long-enough
  window to average out noise.
- `chars/4` is directional (±~25%); use it for relative before/after, not absolute cost.
- Structural savings (always-on trims, output caps) are the most attributable;
  behavioral savings show up only if the team adopts the [cheat-sheet](cheat-sheet.md).

## References
- [VS Code — Copilot customization docs](https://code.visualstudio.com/docs/copilot/copilot-customization)
- [Copilot token usage & cost control — Simform Engineering](https://medium.com/simform-engineering/github-copilot-token-usage-explained-with-practical-cost-control-03062b15ecb0)
