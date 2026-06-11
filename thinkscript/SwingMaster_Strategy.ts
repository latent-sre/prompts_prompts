# =============================================================================
# SwingMaster_Strategy — regime-switched dual-engine swing system (backtestable)
# =============================================================================
# Combines the two complementary edges instead of averaging them away:
#
#   REGIME LAYER : longs only above the 200-SMA (Connors-style regime filter)
#   MODE SWITCH  : ADX >= modeADX  -> TREND mode  -> pullback-in-trend engine
#                  ADX <  modeADX  -> CHOP mode   -> RSI(2) mean-reversion engine
#
#   TREND ENGINE (lower win rate, bigger winners):
#     Lagging confluence score 0-7 (EMA stack, SuperTrend, Vortex, MACD slope,
#     relative volume, Chaikin Money Flow, Hull MA slope) + a LEADING trigger
#     (RSI(2) snap, Fisher hook, Williams %R hook, Connors RSI, squeeze release)
#     + no-chase gates. Exits: 2R target, Chandelier trail, SuperTrend flip,
#     Fisher overbought hook, time stop.
#
#   MEAN-REVERSION ENGINE (high win rate, small winners; long-only):
#     RSI(2) < 10 above the 200-SMA in chop. Exit: close > 5-SMA or RSI(2) > 70.
#     Wide 3-ATR disaster stop ON by default to cap tail risk, plus a time stop.
#
# Order tags are prefixed TF/MR so the backtest report (right-click chart >
# Show Report) lets you measure each engine separately.
# Fills at next bar's open. Suggested timeframe: Daily.
# =============================================================================

input tradeSize      = 100;
input enableShorts   = no;        # trend engine only; MR engine never shorts

# --- regime / mode ---
input regimeMaLength = 200;
input modeADX        = 20;        # ADX at/above = trend mode, below = chop mode
input adxLength      = 14;

# --- trend engine ---
input atrLength      = 14;
input stAtrMult      = 2.5;
input chandLength    = 22;
input chandMult      = 3.0;
input stopAtrMult    = 2.0;
input targetRMult    = 2.0;
input tfMaxBars      = 15;
input fastEmaLen     = 8;
input slowEmaLen     = 21;
input hullLength     = 20;
input cmfLength      = 21;
input viLength       = 14;
input fisherLength   = 10;
input minScore       = 4;         # of 7
input maxExtensionATR = 2.0;
input maxAtrPercent  = 8.0;
input minRelVolume   = 1.0;

# --- mean-reversion engine ---
input mrBuyBelow     = 10;        # RSI(2) entry threshold
input mrExitMaLen    = 5;
input useMrRsiExit   = yes;       # also exit when RSI(2) > 70
input useMrStop      = yes;       # wide disaster stop (caps tail risk)
input mrStopMult     = 3.0;       # in ATRs - wide on purpose, rarely hit
input mrMaxBars      = 10;

# ---------------- core series ----------------
def atrVal  = WildersAverage(TrueRange(high, close, low), atrLength);
def emaF    = ExpAverage(close, fastEmaLen);
def emaS    = ExpAverage(close, slowEmaLen);
def sma200  = Average(close, regimeMaLength);
def sma5    = Average(close, mrExitMaLen);
def hma     = MovingAverage(AverageType.HULL, close, hullLength);
def rsi14   = RSI(price = close, length = 14);
def rsi2    = RSI(price = close, length = 2);
def adxVal  = ADX(length = adxLength);
def macdDiff = MACD(fastLength = 12, slowLength = 26, MACDLength = 9).Diff;
def relVol  = volume / Average(volume, 50);

# Chaikin Money Flow (volume-flow confirmation, from the Composite system)
def hlRange = high - low;
def adv = if hlRange == 0 then 0
          else ((close - low) - (high - close)) / hlRange * volume;
def cmf = Sum(adv, cmfLength) / Sum(volume, cmfLength);

# SuperTrend
def stUp = hl2 + stAtrMult * atrVal;
def stDn = hl2 - stAtrMult * atrVal;
def superTrend = CompoundValue(1, if close < superTrend[1] then stUp else stDn, stDn);

# Vortex
def vmPlus  = Sum(AbsValue(high - low[1]),  viLength);
def vmMinus = Sum(AbsValue(low  - high[1]), viLength);
def trSum   = Sum(TrueRange(high, close, low), viLength);
def viPlus  = vmPlus / trSum;
def viMinus = vmMinus / trSum;

# Fisher Transform
def fMax  = Highest(hl2, fisherLength);
def fMin  = Lowest(hl2, fisherLength);
def fRng  = Max(fMax - fMin, TickSize());
def fX    = CompoundValue(1, 0.66 * ((hl2 - fMin) / fRng - 0.5) + 0.67 * fX[1], 0);
def fXc   = if fX > 0.99 then 0.999 else if fX < -0.99 then -0.999 else fX;
def fisher = CompoundValue(1, 0.5 * Log((1 + fXc) / (1 - fXc)) + 0.5 * fisher[1], 0);

# Connors RSI
def streak = CompoundValue(1,
    if close > close[1] then (if streak[1] >= 1 then streak[1] + 1 else 1)
    else if close < close[1] then (if streak[1] <= -1 then streak[1] - 1 else -1)
    else 0, 0);
def roc1 = if close[1] != 0 then close / close[1] - 1 else 0;
def pctRank = fold i = 1 to 101 with cnt = 0
              do cnt + (if GetValue(roc1, i) < roc1 then 1 else 0);
def crsi = (RSI(price = close, length = 3) + RSI(price = streak, length = 2) + pctRank) / 3;

# Williams %R
def hh14 = Highest(high, 14);
def ll14 = Lowest(low, 14);
def wpr  = if hh14 - ll14 == 0 then -50 else -100 * (hh14 - close) / (hh14 - ll14);

# Squeeze (Bollinger inside Keltner) - release doubles as a leading trigger
def bbSd  = StDev(close, 20);
def bbMid = Average(close, 20);
def atr20 = WildersAverage(TrueRange(high, close, low), 20);
def kMid  = ExpAverage(close, 20);
def squeezed = bbMid + 2 * bbSd < kMid + 1.5 * atr20
           and bbMid - 2 * bbSd > kMid - 1.5 * atr20;

def chandLong  = Highest(high, chandLength) - chandMult * atrVal;
def chandShort = Lowest(low, chandLength)  + chandMult * atrVal;

# ---------------- regime & mode ----------------
def regimeBull = close > sma200;
def regimeBear = close < sma200;
def trendMode  = adxVal >= modeADX;
def chopMode   = adxVal <  modeADX;

# ---------------- trend engine scoring (0-7) ----------------
def bullScore = (emaF > emaS) + (close > superTrend) + (viPlus > viMinus)
              + (macdDiff > macdDiff[1]) + (relVol >= minRelVolume)
              + (cmf > 0) + (hma > hma[1]);
def bearScore = (emaF < emaS) + (close < superTrend) + (viMinus > viPlus)
              + (macdDiff < macdDiff[1]) + (relVol >= minRelVolume)
              + (cmf < 0) + (hma < hma[1]);

def leadLong  = (rsi2 > 10 and rsi2[1] <= 10)
             or (fisher > fisher[1] and fisher[1] <= fisher[2] and fisher < 0)
             or (wpr > -80 and wpr[1] <= -80)
             or (crsi > 20 and crsi[1] <= 20)
             or (squeezed[1] and !squeezed and close > open);
def leadShort = (rsi2 < 90 and rsi2[1] >= 90)
             or (fisher < fisher[1] and fisher[1] >= fisher[2] and fisher > 0)
             or (wpr < -20 and wpr[1] >= -20)
             or (crsi < 80 and crsi[1] >= 80)
             or (squeezed[1] and !squeezed and close < open);

def atrPctOk   = atrVal / close * 100 <= maxAtrPercent;
def notExtUp   = (close - emaS) / atrVal <= maxExtensionATR;
def notExtDown = (emaS - close) / atrVal <= maxExtensionATR;

def tfLongSetup  = regimeBull and trendMode
               and bullScore >= minScore and (leadLong or leadLong[1])
               and atrPctOk and notExtUp and rsi14 < 70;
def tfShortSetup = enableShorts and regimeBear and trendMode
               and bearScore >= minScore and (leadShort or leadShort[1])
               and atrPctOk and notExtDown and rsi14 > 30;

# ---------------- mean-reversion engine (long-only) ----------------
def mrSetup = regimeBull and chopMode and rsi2 < mrBuyBelow and atrPctOk;

# ---------------- position bookkeeping ----------------
def ep = EntryPrice();
def flat = IsNaN(ep);
def barsHeld = CompoundValue(1, if flat then 0 else barsHeld[1] + 1, 0);

# Which engine owns the open position: 1 = TF long, -1 = TF short, 2 = MR long
def engineSel = CompoundValue(1,
    if flat then (if tfLongSetup then 1
                  else if mrSetup then 2
                  else if tfShortSetup then -1
                  else 0)
    else engineSel[1], 0);

# ---------------- exits ----------------
def tfLongExit = engineSel == 1 and !flat and (
       close < Max(chandLong, ep - stopAtrMult * atrVal)
    or close >= ep + targetRMult * stopAtrMult * atrVal
    or (close < superTrend and close[1] >= superTrend[1])
    or (fisher < fisher[1] and fisher[1] >= fisher[2] and fisher[1] > 1.5)
    or barsHeld >= tfMaxBars);

def tfShortExit = engineSel == -1 and !flat and (
       close > Min(chandShort, ep + stopAtrMult * atrVal)
    or close <= ep - targetRMult * stopAtrMult * atrVal
    or (close > superTrend and close[1] <= superTrend[1])
    or (fisher > fisher[1] and fisher[1] <= fisher[2] and fisher[1] < -1.5)
    or barsHeld >= tfMaxBars);

def mrExit = engineSel == 2 and !flat and (
       close > sma5
    or (useMrRsiExit and rsi2 > 70)
    or (useMrStop and close < ep - mrStopMult * atrVal)
    or barsHeld >= mrMaxBars);

# ---------------- orders ----------------
AddOrder(OrderType.BUY_TO_OPEN, tfLongSetup and flat, open[-1], tradeSize,
         Color.GREEN, Color.GREEN, "TF LE");
AddOrder(OrderType.SELL_TO_CLOSE, tfLongExit, open[-1], tradeSize,
         Color.RED, Color.RED, "TF LX");

AddOrder(OrderType.BUY_TO_OPEN, mrSetup and flat and !tfLongSetup, open[-1], tradeSize,
         Color.CYAN, Color.CYAN, "MR LE");
AddOrder(OrderType.SELL_TO_CLOSE, mrExit, open[-1], tradeSize,
         Color.ORANGE, Color.ORANGE, "MR LX");

AddOrder(OrderType.SELL_TO_OPEN, tfShortSetup and flat and !tfLongSetup and !mrSetup,
         open[-1], tradeSize, Color.MAGENTA, Color.MAGENTA, "TF SE");
AddOrder(OrderType.BUY_TO_CLOSE, tfShortExit, open[-1], tradeSize,
         Color.PINK, Color.PINK, "TF SX");

# ---------------- labels ----------------
AddLabel(yes, if regimeBull then "Regime: BULL" else "Regime: BEAR",
    if regimeBull then Color.GREEN else Color.RED);
AddLabel(yes, (if trendMode then "Mode: TREND" else "Mode: CHOP")
    + " (ADX " + Round(adxVal, 0) + ")",
    if trendMode then Color.WHITE else Color.GRAY);
AddLabel(yes, "Bull " + bullScore + "/7",
    if bullScore >= minScore then Color.GREEN else Color.GRAY);
AddLabel(!flat, if engineSel == 2 then "MR position"
    else if engineSel == 1 then "TF long" else "TF short",
    if engineSel == 2 then Color.CYAN
    else if engineSel == 1 then Color.GREEN else Color.MAGENTA);
