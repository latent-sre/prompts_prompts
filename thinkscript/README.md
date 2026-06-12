# SwingConfluence / SwingMaster — thinkorswim swing-trading toolkit

## ⭐ Start here: SwingMaster v2 (the combined system)

`SwingMaster_Upper.ts` + `SwingMaster_Strategy.ts` merge two complementary
edges into one dual-engine system. **v2 is an evidence-driven refactor**: a
deep-research pass over the published literature reshaped the routing and
the weighting of every component.

```
                 close > 200-SMA?  ── no ──> stand aside (or optional shorts)
                        │ yes
                 price state?
                /            \
   RSI(2) < 10 (deep dip)   pullback recovery in trend structure
            │                            │
   MEAN-REVERSION ENGINE        TREND ENGINE
   Connors RSI(2) < 10          CORE (mandatory): EMA 8>21 structure +
   exit close > 5-SMA           Connors-family leading trigger + no-chase
   or RSI(2) > 70               gates;  EXTRAS (2 of 5 tiebreakers):
   wide 3-ATR disaster stop     Vortex, MACD slope, CMF, Hull, RelVol
   10-bar time stop             2R target, Chandelier trail, 15-bar stop
```

What changed in v2, and why:

| Change | Evidence basis |
|---|---|
| **ADX mode switch → optional gate, default off** (routing is now by price state) | No rigorous published test of "ADX<20 → mean revert" exists; the one data-snooping-adjusted academic test of Wilder's DMI found no significant profits (Park & Irwin) |
| **Entry split into mandatory core + tiebreaker extras** | The core (200-SMA regime, pullback-not-breakout entries, RSI(2)-family timing) has real supporting evidence; Vortex/CMF/Hull/MACD-slope are folklore-grade and can no longer outvote it |
| **Fisher Transform, SuperTrend, squeeze removed** | Fisher: original paper has no backtest, no independent test exists. SuperTrend: only academic test lost money on defaults. Squeeze: vendor-marketing numbers only. (All remain in SwingConfluence for discretionary use) |
| **Stop asymmetry kept deliberately** | Stops improve momentum/trend trades (Han, Zhou & Zhu) but hurt mean reversion (Connors; Kaminski & Lo) — tight ATR stops on TF trades, wide disaster stop only on MR trades |

Honest expectations (from the research):

- Trade it on **liquid large caps / index ETFs** — net of costs the
  short-term reversal edge survives mainly in large caps.
- The MR edge has **decayed ~40% since the 2000s** but remains positive;
  next-open fills cost ~0.2–0.5%/trade vs. published close-fill numbers, so
  expect roughly half the per-trade economics of the books.
- The 200-SMA filter buys **drawdown reduction (~half), not extra return** —
  it cost ~4 pts/yr in the 2010s bull market. For steady swing trading
  that's a trade worth making, knowingly.
- The backtest report separates engines by order tag (`TF`/`MR`): expect MR
  to win on win-rate and TF on average winner size; judge the combination on
  profit factor and max drawdown.

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
