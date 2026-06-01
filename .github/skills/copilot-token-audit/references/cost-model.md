# Copilot Token Cost Model

The mental model that justifies every audit finding. Numbers are directional
industry/Copilot guidance, not exact billing — use them to *rank*, not to invoice.

## What you pay for

A Copilot Chat / agent request sends, every turn:

```
system + custom instructions (always-on)
  + applicable *.instructions.md (always-on for matching paths)
  + prior conversation history (grows each turn)
  + referenced context (#file, #selection, @workspace index hits, open tabs)
  + active MCP/tool definitions (per server, per agent step)
  + your typed prompt
→ model →
  output tokens (the response)
```

## The multipliers that matter

1. **Always-on multiplier.** Custom instructions and matching `*.instructions.md`
   are injected on *every* request. A 400-token instruction file used across 1,000
   requests/month = 400k input tokens/month before anyone types anything. This is
   why rubric category A is highest impact.

2. **Output ≈ 5× input.** Output tokens are the most expensive line item. Capping
   verbosity ("code only, no explanation") yields ~40–70% output savings on code
   tasks, ~30–60% across mixed tasks. This is why category D is high ROI for low effort.

3. **History accumulation.** Each turn re-sends the whole conversation. Long threads
   get quadratically expensive. Starting a fresh chat per problem resets this.

4. **MCP / tool overhead.** Each enabled MCP server adds tool definitions on *every
   agent step* (~100–500 tokens each). With many servers × many steps, this can reach
   hundreds of thousands of tokens of pure overhead. Disable unused servers; give chat
   modes the minimum tool set.

5. **Retrieval scope.** `@workspace` triggers repository-index retrieval (large,
   variable). A scoped `#file` / `#selection` sends only what's needed. Open editor
   tabs are auto-included as context.

6. **Mode & model.** Ask mode avoids agent tool-orchestration overhead (~60–90%
   cheaper) for simple questions; reserve Agent mode for true multi-step work.
   Premium models cost far more per token than standard — default to Auto/standard and
   pin premium only when task complexity justifies it.

## How to estimate (for the report)

- **Token estimate:** `tokens ≈ characters / 4` (English). Bullet, code, and CJK
  text differ; treat as ±25%.
- **Always-on saving:** `removed_tokens × requests_per_period`. State the period
  assumption.
- **Output saving:** estimate as a percentage of typical response length for the
  task class; do not fabricate absolute counts.
- **Behavioral saving:** qualitative ("Ask-over-Agent on routine Q&A ≈ 60–90% fewer
  tokens per such turn").

Always label estimates as estimates.
