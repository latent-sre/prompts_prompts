# =============================================================================
# SwingMaster_Strategy v2 — evidence-weighted dual-engine swing system
# =============================================================================
# v2 REFACTOR (research-driven). What changed from v1 and why:
#
#  - ADX mode switch DEMOTED to an optional gate, default OFF. No rigorous
#    published test supports "ADX<20 -> mean revert / ADX>25 -> trend"; the one
#    data-snooping-adjusted academic test of Wilder's DMI system (Park & Irwin)
#    found no significant profits. Engines are now routed by PRICE STATE:
#    a deep dip (RSI(2) < 10) routes to the MR engine; a pullback recovery
#    inside trend structure routes to the trend engine.
#  - Entry logic split into a MANDATORY CORE (components with published
#    supporting evidence) and TIEBREAKER EXTRAS (weak/no evidence) that can
#    no longer outvote the core.
#  - Fisher Transform, SuperTrend, and squeeze REMOVED (no rigorous evidence;
#    SuperTrend's only academic test lost money on default params). They
#    remain in the SwingConfluence files for discretionary use.
#  - Stop asymmetry KEPT deliberately: stops on trend trades (helps momentum:
#    Han/Zhou/Zhu), no tight stop on MR trades (stops hurt mean reversion:
#    Connors; Kaminski & Lo) — only a wide disaster stop for tail risk.
#
# Evidence grades used in comments below:
#   [STRONG]  peer-reviewed or multi-source replicated
#   [MODERATE] consistent practitioner backtests, not peer-reviewed
#   [WEAK/NONE] folklore or vendor-only claims
#
# EXPECTATIONS (be honest with yourself):
#  - Use on LIQUID large caps / index ETFs, daily charts. Net of costs, the
#    short-term reversal edge survives mainly in large caps (De Groot et al.).
#  - The MR edge has decayed ~40% since the 2000s but remains positive
#    (Alvarez longitudinal studies). Expect roughly half the per-trade
#    economics of the published book numbers.
#  - Fills here are NEXT BAR OPEN; published Connors results assume same-close
#    fills, worth ~0.2-0.5%/trade. Your backtest WILL look worse than books.
#  - The 200-SMA regime filter buys drawdown reduction, not extra return
#    (Faber; Zakamulin; Siegel) — it cost ~4 pts/yr in the 2010s bull market.
#
# Backtest: Edit Studies > Strategies > Create, paste, then right-click chart
# > Show Report. Order tags TF/MR separate the engines in the trade list.
# =============================================================================

input tradeSize      = 100;
input enableShorts   = no;        # experimental; shorting evidence is weak

# --- regime [STRONG: halves drawdowns; ~neutral on returns] ---
input regimeMaLength = 200;

# --- optional legacy ADX gate [WEAK/NONE: kept only for A/B testing] ---
input useAdxGate     = no;
input adxLength      = 14;
input modeADX        = 20;

# --- trend engine ---
input atrLength      = 14;
input fastEmaLen     = 8;
input slowEmaLen     = 21;
input chandLength    = 22;
input chandMult      = 3.0;
input stopAtrMult    = 2.0;
input targetRMult    = 2.0;
input tfMaxBars      = 15;
input extrasNeeded   = 2;         # of 5 tiebreaker extras
input maxExtensionATR = 2.0;
input maxAtrPercent  = 8.0;
input minRelVolume   = 1.0;
input cmfLength      = 21;
input viLength       = 14;
input hullLength     = 20;

# --- mean-reversion engine ---
input mrBuyBelow     = 10;
input mrExitMaLen    = 5;
input useMrRsiExit   = yes;
input useMrStop      = yes;       # wide DISASTER stop only (tail risk cap)
input mrStopMult     = 3.0;
input mrMaxBars      = 10;

# ---------------- core series ----------------
def atrVal  = WildersAverage(TrueRange(high, close, low), atrLength);
def emaF    = ExpAverage(close, fastEmaLen);
def emaS    = ExpAverage(close, slowEmaLen);
def sma200  = Average(close, regimeMaLength);
def sma5    = Average(close, mrExitMaLen);
def rsi14   = RSI(price = close, length = 14);
def rsi2    = RSI(price = close, length = 2);
def adxVal  = ADX(length = adxLength);

# Connors RSI [MODERATE: independent tests find parity with RSI(2)]
def streak = CompoundValue(1,
    if close > close[1] then (if streak[1] >= 1 then streak[1] + 1 else 1)
    else if close < close[1] then (if streak[1] <= -1 then streak[1] - 1 else -1)
    else 0, 0);
def roc1 = if close[1] != 0 then close / close[1] - 1 else 0;
def pctRank = fold i = 1 to 101 with cnt = 0
              do cnt + (if GetValue(roc1, i) < roc1 then 1 else 0);
def crsi = (RSI(price = close, length = 3) + RSI(price = streak, length = 2) + pctRank) / 3;

# Williams %R [MODERATE: same family as RSI(2) timing]
def hh14 = Highest(high, 14);
def ll14 = Lowest(low, 14);
def wpr  = if hh14 - ll14 == 0 then -50 else -100 * (hh14 - close) / (hh14 - ll14);

# ---- tiebreaker extras [WEAK/NONE individually; demoted in v2] ----
def macdDiff = MACD(fastLength = 12, slowLength = 26, MACDLength = 9).Diff;
def relVol  = volume / Average(volume, 50);
def hma     = MovingAverage(AverageType.HULL, close, hullLength);
def hlRange = high - low;
def adv = if hlRange == 0 then 0
          else ((close - low) - (high - close)) / hlRange * volume;
def cmf = Sum(adv, cmfLength) / Sum(volume, cmfLength);
def vmPlus  = Sum(AbsValue(high - low[1]),  viLength);
def vmMinus = Sum(AbsValue(low  - high[1]), viLength);
def trSum   = Sum(TrueRange(high, close, low), viLength);
def viPlus  = vmPlus / trSum;
def viMinus = vmMinus / trSum;

# Chandelier trail [MODERATE: stop literature supports stops on trend trades]
def chandLong  = Highest(high, chandLength) - chandMult * atrVal;
def chandShort = Lowest(low, chandLength)  + chandMult * atrVal;

# ---------------- routing ----------------
def regimeBull = close > sma200;
def regimeBear = close < sma200;
def adxGateMR  = !useAdxGate or adxVal < modeADX;
def adxGateTF  = !useAdxGate or adxVal >= modeADX;

def atrPctOk   = atrVal / close * 100 <= maxAtrPercent;
def notExtUp   = (close - emaS) / atrVal <= maxExtensionATR;
def notExtDown = (emaS - close) / atrVal <= maxExtensionATR;

# MR route [STRONG entry stat, decaying edge]: deep RSI(2) dip above 200-SMA
def mrSetup = regimeBull and adxGateMR and rsi2 < mrBuyBelow and atrPctOk;

# Trend route: MANDATORY CORE
#   [STRONG] regime + pullback-not-breakout entry style
#   [MODERATE] Connors-family leading trigger for timing
def structLong  = emaF > emaS and close > emaS;
def structShort = emaF < emaS and close < emaS;

def trigLong  = (rsi2 > 10 and rsi2[1] <= 10)
             or (wpr > -80 and wpr[1] <= -80)
             or (crsi > 20 and crsi[1] <= 20);
def trigShort = (rsi2 < 90 and rsi2[1] >= 90)
             or (wpr < -20 and wpr[1] >= -20)
             or (crsi < 80 and crsi[1] >= 80);

def extrasLong  = (viPlus > viMinus) + (macdDiff > macdDiff[1])
                + (cmf > 0) + (hma > hma[1]) + (relVol >= minRelVolume);
def extrasShort = (viMinus > viPlus) + (macdDiff < macdDiff[1])
                + (cmf < 0) + (hma < hma[1]) + (relVol >= minRelVolume);

# Deep-dip days route to MR, so trend entries exclude them
def tfLongSetup  = regimeBull and adxGateTF and structLong
               and (trigLong or trigLong[1])
               and extrasLong >= extrasNeeded
               and atrPctOk and notExtUp and rsi14 < 70
               and !mrSetup;
def tfShortSetup = enableShorts and regimeBear and adxGateTF and structShort
               and (trigShort or trigShort[1])
               and extrasShort >= extrasNeeded
               and atrPctOk and notExtDown and rsi14 > 30;

# ---------------- position bookkeeping ----------------
def ep = EntryPrice();
def flat = IsNaN(ep);
def barsHeld = CompoundValue(1, if flat then 0 else barsHeld[1] + 1, 0);

# Which engine owns the open position: 1 = TF long, -1 = TF short, 2 = MR long
def engineSel = CompoundValue(1,
    if flat then (if mrSetup then 2
                  else if tfLongSetup then 1
                  else if tfShortSetup then -1
                  else 0)
    else engineSel[1], 0);

# ---------------- exits ----------------
# Trend exits: stop/target/trail/structure-break/time. Stops on trend trades
# are supported by the literature [STRONG for momentum portfolios].
def tfLongExit = engineSel == 1 and !flat and (
       close < Max(chandLong, ep - stopAtrMult * atrVal)
    or close >= ep + targetRMult * stopAtrMult * atrVal
    or close < emaS
    or barsHeld >= tfMaxBars);

def tfShortExit = engineSel == -1 and !flat and (
       close > Min(chandShort, ep + stopAtrMult * atrVal)
    or close <= ep - targetRMult * stopAtrMult * atrVal
    or close > emaS
    or barsHeld >= tfMaxBars);

# MR exits: first-bounce exit, NO tight stop [STRONG: stops hurt MR];
# wide disaster stop + time stop cap the tail.
def mrExit = engineSel == 2 and !flat and (
       close > sma5
    or (useMrRsiExit and rsi2 > 70)
    or (useMrStop and close < ep - mrStopMult * atrVal)
    or barsHeld >= mrMaxBars);

# ---------------- orders (fill at next bar's open) ----------------
AddOrder(OrderType.BUY_TO_OPEN, mrSetup and flat, open[-1], tradeSize,
         Color.CYAN, Color.CYAN, "MR LE");
AddOrder(OrderType.SELL_TO_CLOSE, mrExit, open[-1], tradeSize,
         Color.ORANGE, Color.ORANGE, "MR LX");

AddOrder(OrderType.BUY_TO_OPEN, tfLongSetup and flat, open[-1], tradeSize,
         Color.GREEN, Color.GREEN, "TF LE");
AddOrder(OrderType.SELL_TO_CLOSE, tfLongExit, open[-1], tradeSize,
         Color.RED, Color.RED, "TF LX");

AddOrder(OrderType.SELL_TO_OPEN, tfShortSetup and flat and !mrSetup,
         open[-1], tradeSize, Color.MAGENTA, Color.MAGENTA, "TF SE");
AddOrder(OrderType.BUY_TO_CLOSE, tfShortExit, open[-1], tradeSize,
         Color.PINK, Color.PINK, "TF SX");

# ---------------- labels ----------------
AddLabel(yes, if regimeBull then "Regime: BULL" else "Regime: BEAR",
    if regimeBull then Color.GREEN else Color.RED);
AddLabel(yes, "RSI(2) " + Round(rsi2, 0),
    if rsi2 < mrBuyBelow then Color.CYAN
    else if rsi2 > 90 then Color.RED else Color.GRAY);
AddLabel(yes, "Extras " + extrasLong + "/5",
    if extrasLong >= extrasNeeded then Color.GREEN else Color.GRAY);
AddLabel(useAdxGate, "ADX gate ON (" + Round(adxVal, 0) + ")", Color.YELLOW);
AddLabel(!flat, if engineSel == 2 then "MR position"
    else if engineSel == 1 then "TF long" else "TF short",
    if engineSel == 2 then Color.CYAN
    else if engineSel == 1 then Color.GREEN else Color.MAGENTA);
