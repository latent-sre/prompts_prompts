# SwingConfluence / SwingMaster — thinkorswim swing-trading toolkit

## ⭐ Start here: SwingMaster (the combined system)

`SwingMaster_Upper.ts` + `SwingMaster_Strategy.ts` merge two complementary
edges into one regime-switched system instead of averaging their signals away:

```
                 close > 200-SMA?  ── no ──> stand aside (or optional shorts)
                        │ yes
                 ADX >= 20?
                /            \
            yes (TREND)     no (CHOP)
               │                │
   TREND ENGINE             MEAN-REVERSION ENGINE
   pullback-in-trend        Connors RSI(2) < 10
   score 4/7 + leading      exit close > 5-SMA or RSI(2) > 70
   trigger, 2R target,      wide 3-ATR disaster stop
   Chandelier trail         10-bar time stop
```

- **Trend engine** (order tags `TF`): lower win rate, bigger winners — the
  SwingConfluence pullback logic upgraded with Chaikin Money Flow and Hull MA
  slope (score is 0–7) and a squeeze-release trigger.
- **Mean-reversion engine** (order tags `MR`, long-only): high win rate, small
  winners — the published Connors RSI(2) structure, with its one flaw (tail
  risk from having no stop) capped by a wide disaster stop that is far enough
  away to rarely interrupt the bounce.
- Because each engine trades only the regime where its math has an edge, the
  blended equity curve is smoother than either system alone — that, plus the
  shared risk layer, is what "combining them" should mean.
- The backtest report separates the engines by order tag, so you can verify
  each edge independently (expect `MR` to win on win-rate and `TF` on average
  winner size; judge the combination on profit factor and drawdown).

The original single-engine files below remain useful on their own and as the
building blocks of SwingMaster.

---

Three ThinkScript files built for **steady swing trades** (days to a few weeks),
not moon shots. The system only takes entries where **lagging trend
confirmation** and a **leading timing trigger** agree, and it blocks chases
into extended or hyper-volatile moves.

| File | Type | What it does |
|---|---|---|
| `SwingMaster_Upper.ts` | Chart study | **Combined system** — regime/mode labels, both engines' signals, stop/target lines |
| `SwingMaster_Strategy.ts` | Strategy | **Combined system, backtestable** — TF/MR order tags for per-engine stats |
| `SwingConfluence_Upper.ts` | Chart study | Entry/exit arrows, trailing stop + profit target lines, SuperTrend, EMAs, info labels, alerts |
| `SwingConfluence_Lower.ts` | Lower study | Net confluence histogram, Fisher Transform, Connors RSI, squeeze dots, leading-trigger dots |
| `SwingConfluence_Strategy.ts` | Strategy | Same engine with `AddOrder()` for backtesting (Show Report → trade list & P/L) |

## Installation

1. In thinkorswim: **Charts → Studies → Edit Studies → Create…** (for the
   strategy use the **Strategies** tab → Create).
2. Delete the placeholder code, paste the file contents, name it, **OK**.
3. Apply the upper and lower studies together; add the strategy only when
   you want to backtest.

Recommended chart: **Daily** (works on 4h/2h for faster swings). Use on
liquid names — the ATR% filter will keep you out of the craziest tickers.

## Indicator mix (leading vs. lagging, common vs. uncommon)

| Indicator | Role | Type | Common? |
|---|---|---|---|
| EMA 8/21 stack | Trend filter | Lagging | Common |
| SuperTrend (ATR trail) | Trend filter + exit | Lagging | Common-ish |
| MACD histogram slope | Momentum confirmation | Lagging | Common |
| Vortex Indicator (VI+/VI−) | Trend direction | Lagging | **Uncommon** |
| ADX ≥ 15 | Trend-strength gate | Lagging | Common |
| RSI(2) snap-back | Pullback timing | Leading | **Uncommon** (Connors style) |
| Connors RSI | Pullback timing | Leading | **Uncommon** |
| Ehlers Fisher Transform | Turn timing + exit | Leading | **Uncommon** |
| Williams %R hook | Pullback timing | Leading | Common |
| Relative volume (vs 50-day) | Participation score | Coincident | Common |
| Bollinger-in-Keltner squeeze | Compression context (lower pane) | Leading | Common-ish |
| Chandelier exit | Trailing stop | Lagging | **Uncommon** |

## How a signal is built

1. **Lagging confluence score (0–5):** EMA stack + SuperTrend side + Vortex
   side + MACD histogram slope + relative volume. Need `minScore` (default 3).
2. **Leading trigger (within last 2 bars):** RSI(2) crossing up from ≤10,
   Fisher Transform hooking up below zero, Williams %R reclaiming −80, or
   Connors RSI reclaiming 20. (Mirrored for shorts.)
3. **No-chase quality gate:** ADX ≥ 15, close within 2 ATR of the 21-EMA,
   ATR ≤ 8% of price, RSI(14) not already overbought/oversold in the trade
   direction. This is what keeps trades "steady" instead of lottery tickets.
4. **Exits (first one wins):** Chandelier/ATR trailing stop, 2R profit target,
   SuperTrend flip (lagging), Fisher Transform hook from beyond ±1.5
   (leading), and — in the strategy — a 15-bar time stop.

Entry/exit arrows and the stop/target lines can be toggled off with the
`showSignals` / `showLevels` inputs if you prefer a clean chart and labels only.

## Key inputs to tune

| Input | Default | Notes |
|---|---|---|
| `enableShorts` | no | Long-only by default; flip on for futures/liquid shorts |
| `minScore` | 3 | Raise to 4 for fewer, higher-quality signals |
| `stopAtrMult` / `targetRMult` | 2.0 / 2.0 | Risk 2 ATR, target 2R — steady-swing geometry |
| `maxExtensionATR` | 2.0 | Lower it to be even stricter about not chasing |
| `maxAtrPercent` | 8.0 | Volatility ceiling; lower for a calmer book |
| `maxBarsInTrade` | 15 | Strategy-only time stop |

## Notes & limitations

- The chart study tracks a *simulated* position recursively so it can draw
  stop/target lines; the strategy is the source of truth for backtests
  (orders fill at next bar's open).
- Stop/target distances use the current ATR, so they adapt as volatility
  shifts during a trade.
- Backtest across several symbols and regimes before trading it; defaults
  are sane starting points, not optimized magic numbers.
- Educational tooling, not financial advice. Size positions so a full 2-ATR
  stop-out is a routine loss, not an event.
