# SwingConfluence — thinkorswim swing-trading toolkit

Three ThinkScript files built for **steady swing trades** (days to a few weeks),
not moon shots. The system only takes entries where **lagging trend
confirmation** and a **leading timing trigger** agree, and it blocks chases
into extended or hyper-volatile moves.

| File | Type | What it does |
|---|---|---|
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
