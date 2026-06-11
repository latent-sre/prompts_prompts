# =============================================================================
# SwingConfluence_Strategy — backtestable strategy version
# =============================================================================
# Same engine as SwingConfluence_Upper, expressed with AddOrder() so you can
# backtest it: add it from Edit Studies > Strategies, then right-click the
# chart > Show Report to see the trade list and P/L.
#
# Orders fill at the NEXT bar's open (the standard, non-cheating convention).
# Exits: ATR trailing stop (Chandelier), R-multiple profit target, SuperTrend
# flip, Fisher Transform overbought/oversold hook (leading exit), and a time
# stop — swing trades that go nowhere get recycled.
# =============================================================================

input tradeSize      = 100;
input enableShorts   = no;

input atrLength      = 14;
input stAtrMult      = 2.5;
input chandLength    = 22;
input chandMult      = 3.0;
input stopAtrMult    = 2.0;
input targetRMult    = 2.0;
input maxBarsInTrade = 15;        # time stop (bars)

input fastEmaLen     = 8;
input slowEmaLen     = 21;
input viLength       = 14;
input fisherLength   = 10;
input minScore       = 3;
input adxMin         = 15;
input maxExtensionATR = 2.0;
input maxAtrPercent  = 8.0;
input minRelVolume   = 1.0;

# ---------------- core series ----------------
def atrVal  = WildersAverage(TrueRange(high, close, low), atrLength);
def emaF    = ExpAverage(close, fastEmaLen);
def emaS    = ExpAverage(close, slowEmaLen);
def rsi14   = RSI(price = close, length = 14);
def rsi2    = RSI(price = close, length = 2);
def adxVal  = ADX(length = 14);
def macdDiff = MACD(fastLength = 12, slowLength = 26, MACDLength = 9).Diff;
def relVol  = volume / Average(volume, 50);

def stUp = hl2 + stAtrMult * atrVal;
def stDn = hl2 - stAtrMult * atrVal;
def superTrend = CompoundValue(1, if close < superTrend[1] then stUp else stDn, stDn);

def vmPlus  = Sum(AbsValue(high - low[1]),  viLength);
def vmMinus = Sum(AbsValue(low  - high[1]), viLength);
def trSum   = Sum(TrueRange(high, close, low), viLength);
def viPlus  = vmPlus / trSum;
def viMinus = vmMinus / trSum;

def fMax  = Highest(hl2, fisherLength);
def fMin  = Lowest(hl2, fisherLength);
def fRng  = Max(fMax - fMin, TickSize());
def fX    = CompoundValue(1, 0.66 * ((hl2 - fMin) / fRng - 0.5) + 0.67 * fX[1], 0);
def fXc   = if fX > 0.99 then 0.999 else if fX < -0.99 then -0.999 else fX;
def fisher = CompoundValue(1, 0.5 * Log((1 + fXc) / (1 - fXc)) + 0.5 * fisher[1], 0);

def streak = CompoundValue(1,
    if close > close[1] then (if streak[1] >= 1 then streak[1] + 1 else 1)
    else if close < close[1] then (if streak[1] <= -1 then streak[1] - 1 else -1)
    else 0, 0);
def roc1 = if close[1] != 0 then close / close[1] - 1 else 0;
def pctRank = fold i = 1 to 101 with cnt = 0
              do cnt + (if GetValue(roc1, i) < roc1 then 1 else 0);
def crsi = (RSI(price = close, length = 3) + RSI(price = streak, length = 2) + pctRank) / 3;

def hh14 = Highest(high, 14);
def ll14 = Lowest(low, 14);
def wpr  = if hh14 - ll14 == 0 then -50 else -100 * (hh14 - close) / (hh14 - ll14);

def chandLong  = Highest(high, chandLength) - chandMult * atrVal;
def chandShort = Lowest(low, chandLength)  + chandMult * atrVal;

# ---------------- scoring (identical to the upper study) ----------------
def tLV = relVol >= minRelVolume;
def bullScore = (emaF > emaS) + (close > superTrend) + (viPlus > viMinus)
              + (macdDiff > macdDiff[1]) + tLV;
def bearScore = (emaF < emaS) + (close < superTrend) + (viMinus > viPlus)
              + (macdDiff < macdDiff[1]) + tLV;

def leadLong  = (rsi2 > 10 and rsi2[1] <= 10)
             or (fisher > fisher[1] and fisher[1] <= fisher[2] and fisher < 0)
             or (wpr > -80 and wpr[1] <= -80)
             or (crsi > 20 and crsi[1] <= 20);
def leadShort = (rsi2 < 90 and rsi2[1] >= 90)
             or (fisher < fisher[1] and fisher[1] >= fisher[2] and fisher > 0)
             or (wpr < -20 and wpr[1] >= -20)
             or (crsi < 80 and crsi[1] >= 80);

def atrPctOk   = atrVal / close * 100 <= maxAtrPercent;
def adxOk      = adxVal >= adxMin;
def notExtUp   = (close - emaS) / atrVal <= maxExtensionATR;
def notExtDown = (emaS - close) / atrVal <= maxExtensionATR;

def longSetup  = bullScore >= minScore and (leadLong or leadLong[1])
             and atrPctOk and adxOk and notExtUp and rsi14 < 70;
def shortSetup = enableShorts and bearScore >= minScore and (leadShort or leadShort[1])
             and atrPctOk and adxOk and notExtDown and rsi14 > 30;

# ---------------- position bookkeeping ----------------
def ep = EntryPrice();
def flat = IsNaN(ep);
def barsHeld = CompoundValue(1, if flat then 0 else barsHeld[1] + 1, 0);

def longStop    = Max(chandLong, ep - stopAtrMult * atrVal);
def longTarget  = ep + targetRMult * stopAtrMult * atrVal;
def shortStop   = Min(chandShort, ep + stopAtrMult * atrVal);
def shortTarget = ep - targetRMult * stopAtrMult * atrVal;

def longExit = !flat and (
       close < longStop
    or close >= longTarget
    or (close < superTrend and close[1] >= superTrend[1])
    or (fisher < fisher[1] and fisher[1] >= fisher[2] and fisher[1] > 1.5)
    or barsHeld >= maxBarsInTrade);

def shortExit = !flat and (
       close > shortStop
    or close <= shortTarget
    or (close > superTrend and close[1] <= superTrend[1])
    or (fisher > fisher[1] and fisher[1] <= fisher[2] and fisher[1] < -1.5)
    or barsHeld >= maxBarsInTrade);

# ---------------- orders (fill at next bar's open) ----------------
AddOrder(OrderType.BUY_TO_OPEN,  longSetup and flat, open[-1], tradeSize,
         Color.GREEN, Color.GREEN, "SwingConf LE");
AddOrder(OrderType.SELL_TO_CLOSE, longExit, open[-1], tradeSize,
         Color.RED, Color.RED, "SwingConf LX");

AddOrder(OrderType.SELL_TO_OPEN, shortSetup and flat, open[-1], tradeSize,
         Color.MAGENTA, Color.MAGENTA, "SwingConf SE");
AddOrder(OrderType.BUY_TO_CLOSE, shortExit, open[-1], tradeSize,
         Color.CYAN, Color.CYAN, "SwingConf SX");
