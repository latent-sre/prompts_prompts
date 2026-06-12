# =============================================================================
# SwingConfluence_Upper — chart (upper) study for steady swing trading
# =============================================================================
# Philosophy: no moon shots. Enter established trends on pullback recoveries,
# exit at a measured ATR target or a trailing stop. Signals require confluence
# between LAGGING trend filters and a LEADING timing trigger.
#
# LAGGING (trend confirmation):
#   - EMA 8/21 stack                      (common)
#   - SuperTrend (ATR trailing line)      (common-ish)
#   - Vortex Indicator VI+/VI-            (uncommon)
#   - MACD histogram slope                (common)
# LEADING (timing / mean reversion):
#   - RSI(2) snap-back                    (uncommon - Connors style)
#   - Connors RSI                         (uncommon)
#   - Ehlers Fisher Transform turn        (uncommon)
#   - Williams %R hook                    (common)
# QUALITY FILTERS (keeps trades "steady", blocks chases):
#   - ADX minimum (trend must exist)
#   - Max extension from EMA21 in ATRs (no chasing vertical moves)
#   - Max ATR% of price (skips hyper-volatile tickers)
#   - RSI(14) not already overbought/oversold in trade direction
#
# Paint: BUY/SELL arrows, trailing stop + profit target lines while in a
# position, SuperTrend line, EMAs, info labels. Toggle everything via inputs.
# Suggested timeframe: Daily (also works on 4h/2h for faster swings).
# =============================================================================

declare upper;

# ---------------- inputs ----------------
input enableShorts   = no;        # long-only by default for equity swings
input showSignals    = yes;       # entry/exit arrows on the chart
input showLevels     = yes;       # trailing stop + target lines
input showLabels     = yes;
input showEMAs       = yes;
input alertsOn       = yes;

input atrLength      = 14;
input stAtrMult      = 2.5;       # SuperTrend multiplier
input chandLength    = 22;        # Chandelier lookback
input chandMult      = 3.0;       # Chandelier ATR multiplier
input stopAtrMult    = 2.0;       # initial stop distance in ATRs
input targetRMult    = 2.0;       # profit target in R (multiples of initial risk)

input fastEmaLen     = 8;
input slowEmaLen     = 21;
input viLength       = 14;        # Vortex
input fisherLength   = 10;
input minScore       = 3;         # of 5 lagging/volume points required
input adxMin         = 15;
input maxExtensionATR = 2.0;      # max distance of close from EMA21, in ATRs
input maxAtrPercent  = 8.0;       # skip if ATR > this % of price
input minRelVolume   = 1.0;       # relative volume scores a confluence point

# ---------------- core series ----------------
def atrVal  = WildersAverage(TrueRange(high, close, low), atrLength);
def emaF    = ExpAverage(close, fastEmaLen);
def emaS    = ExpAverage(close, slowEmaLen);
def rsi14   = RSI(price = close, length = 14);
def rsi2    = RSI(price = close, length = 2);
def adxVal  = ADX(length = 14);
def macdDiff = MACD(fastLength = 12, slowLength = 26, MACDLength = 9).Diff;
def relVol  = volume / Average(volume, 50);

# --- SuperTrend (lagging trail) ---
def stUp = hl2 + stAtrMult * atrVal;
def stDn = hl2 - stAtrMult * atrVal;
def superTrend = CompoundValue(1, if close < superTrend[1] then stUp else stDn, stDn);

# --- Vortex Indicator (uncommon lagging trend gauge) ---
def vmPlus  = Sum(AbsValue(high - low[1]),  viLength);
def vmMinus = Sum(AbsValue(low  - high[1]), viLength);
def trSum   = Sum(TrueRange(high, close, low), viLength);
def viPlus  = vmPlus / trSum;
def viMinus = vmMinus / trSum;

# --- Ehlers Fisher Transform (leading) ---
def fMax  = Highest(hl2, fisherLength);
def fMin  = Lowest(hl2, fisherLength);
def fRng  = Max(fMax - fMin, TickSize());
def fX    = CompoundValue(1, 0.66 * ((hl2 - fMin) / fRng - 0.5) + 0.67 * fX[1], 0);
def fXc   = if fX > 0.99 then 0.999 else if fX < -0.99 then -0.999 else fX;
def fisher = CompoundValue(1, 0.5 * Log((1 + fXc) / (1 - fXc)) + 0.5 * fisher[1], 0);

# --- Connors RSI (uncommon leading) ---
def streak = CompoundValue(1,
    if close > close[1] then (if streak[1] >= 1 then streak[1] + 1 else 1)
    else if close < close[1] then (if streak[1] <= -1 then streak[1] - 1 else -1)
    else 0, 0);
def roc1 = if close[1] != 0 then close / close[1] - 1 else 0;
def pctRank = fold i = 1 to 101 with cnt = 0
              do cnt + (if GetValue(roc1, i) < roc1 then 1 else 0);
def crsi = (RSI(price = close, length = 3) + RSI(price = streak, length = 2) + pctRank) / 3;

# --- Williams %R (common leading) ---
def hh22 = Highest(high, 14);
def ll22 = Lowest(low, 14);
def wpr  = if hh22 - ll22 == 0 then -50 else -100 * (hh22 - close) / (hh22 - ll22);

# --- Chandelier trailing exits ---
def chandLong  = Highest(high, chandLength) - chandMult * atrVal;
def chandShort = Lowest(low, chandLength)  + chandMult * atrVal;

# ---------------- confluence scoring ----------------
# Lagging trend points (long)
def tL1 = emaF > emaS;
def tL2 = close > superTrend;
def tL3 = viPlus > viMinus;
def tL4 = macdDiff > macdDiff[1];
def tLV = relVol >= minRelVolume;
def bullScore = tL1 + tL2 + tL3 + tL4 + tLV;

# Lagging trend points (short)
def tS1 = emaF < emaS;
def tS2 = close < superTrend;
def tS3 = viMinus > viPlus;
def tS4 = macdDiff < macdDiff[1];
def bearScore = tS1 + tS2 + tS3 + tS4 + tLV;

# Leading triggers (long): a pullback that is turning back up
def lL1 = rsi2 > 10 and rsi2[1] <= 10;
def lL2 = fisher > fisher[1] and fisher[1] <= fisher[2] and fisher < 0;
def lL3 = wpr > -80 and wpr[1] <= -80;
def lL4 = crsi > 20 and crsi[1] <= 20;
def leadLong = lL1 or lL2 or lL3 or lL4;
def leadLongRecent = leadLong or leadLong[1];

# Leading triggers (short): a bounce that is rolling back over
def lS1 = rsi2 < 90 and rsi2[1] >= 90;
def lS2 = fisher < fisher[1] and fisher[1] >= fisher[2] and fisher > 0;
def lS3 = wpr < -20 and wpr[1] >= -20;
def lS4 = crsi < 80 and crsi[1] >= 80;
def leadShort = lS1 or lS2 or lS3 or lS4;
def leadShortRecent = leadShort or leadShort[1];

# Quality / no-chase filters
def atrPctOk   = atrVal / close * 100 <= maxAtrPercent;
def adxOk      = adxVal >= adxMin;
def notExtUp   = (close - emaS) / atrVal <= maxExtensionATR;
def notExtDown = (emaS - close) / atrVal <= maxExtensionATR;
def qualityLong  = atrPctOk and adxOk and notExtUp  and rsi14 < 70;
def qualityShort = atrPctOk and adxOk and notExtDown and rsi14 > 30;

def longSetup  = bullScore >= minScore and leadLongRecent  and qualityLong;
def shortSetup = enableShorts and bearScore >= minScore and leadShortRecent and qualityShort;

# ---------------- position state machine ----------------
# longEntry holds the entry price while in a long (0 = flat). Exit when the
# close violates the trailing stop, hits the R-multiple target, the SuperTrend
# flips, or the Fisher Transform hooks down from overbought (leading exit).
def longEntry = CompoundValue(1,
    if longEntry[1] == 0 then (if longSetup then close else 0)
    else if close < Max(chandLong, longEntry[1] - stopAtrMult * atrVal)
         or close >= longEntry[1] + targetRMult * stopAtrMult * atrVal
         or (close < superTrend and close[1] >= superTrend[1])
         or (fisher < fisher[1] and fisher[1] >= fisher[2] and fisher[1] > 1.5)
    then 0 else longEntry[1], 0);

def shortEntry = CompoundValue(1,
    if shortEntry[1] == 0 then (if shortSetup and longEntry == 0 then close else 0)
    else if close > Min(chandShort, shortEntry[1] + stopAtrMult * atrVal)
         or close <= shortEntry[1] - targetRMult * stopAtrMult * atrVal
         or (close > superTrend and close[1] <= superTrend[1])
         or (fisher > fisher[1] and fisher[1] <= fisher[2] and fisher[1] < -1.5)
    then 0 else shortEntry[1], 0);

def inLong  = longEntry != 0;
def inShort = shortEntry != 0;

# ---------------- plots ----------------
plot BuySignal = showSignals and inLong and !inLong[1];
BuySignal.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
BuySignal.SetDefaultColor(Color.GREEN);
BuySignal.SetLineWeight(3);

plot SellSignal = showSignals and !inLong and inLong[1];
SellSignal.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
SellSignal.SetDefaultColor(Color.RED);
SellSignal.SetLineWeight(3);

plot ShortSignal = showSignals and inShort and !inShort[1];
ShortSignal.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
ShortSignal.SetDefaultColor(Color.MAGENTA);
ShortSignal.SetLineWeight(3);

plot CoverSignal = showSignals and !inShort and inShort[1];
CoverSignal.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
CoverSignal.SetDefaultColor(Color.CYAN);
CoverSignal.SetLineWeight(3);

plot TrailStop = if !showLevels then Double.NaN
    else if inLong then Max(chandLong, longEntry - stopAtrMult * atrVal)
    else if inShort then Min(chandShort, shortEntry + stopAtrMult * atrVal)
    else Double.NaN;
TrailStop.SetPaintingStrategy(PaintingStrategy.DASHES);
TrailStop.SetDefaultColor(Color.RED);

plot ProfitTarget = if !showLevels then Double.NaN
    else if inLong then longEntry + targetRMult * stopAtrMult * atrVal
    else if inShort then shortEntry - targetRMult * stopAtrMult * atrVal
    else Double.NaN;
ProfitTarget.SetPaintingStrategy(PaintingStrategy.DASHES);
ProfitTarget.SetDefaultColor(Color.GREEN);

plot STrend = superTrend;
STrend.AssignValueColor(if close > superTrend then Color.DARK_GREEN else Color.DARK_RED);
STrend.SetLineWeight(2);

plot EmaFast = if showEMAs then emaF else Double.NaN;
EmaFast.SetDefaultColor(Color.CYAN);
plot EmaSlow = if showEMAs then emaS else Double.NaN;
EmaSlow.SetDefaultColor(Color.ORANGE);

# ---------------- labels ----------------
AddLabel(showLabels, "Bull " + bullScore + "/5  Bear " + bearScore + "/5",
    if bullScore >= minScore then Color.GREEN
    else if bearScore >= minScore then Color.RED else Color.GRAY);
AddLabel(showLabels, "ADX " + Round(adxVal, 0) + (if adxOk then " ok" else " weak"),
    if adxOk then Color.GREEN else Color.GRAY);
AddLabel(showLabels, "RelVol " + Round(relVol, 1) + "x",
    if relVol >= minRelVolume then Color.GREEN else Color.GRAY);
AddLabel(showLabels and !atrPctOk, "ATR " + Round(atrVal / close * 100, 1) + "% — too volatile", Color.RED);
AddLabel(showLabels and inLong, "LONG from " + Round(longEntry, 2), Color.GREEN);
AddLabel(showLabels and inShort, "SHORT from " + Round(shortEntry, 2), Color.MAGENTA);

# ---------------- alerts ----------------
Alert(alertsOn and BuySignal,   "SwingConfluence: BUY",   Alert.BAR, Sound.Ding);
Alert(alertsOn and SellSignal,  "SwingConfluence: SELL",  Alert.BAR, Sound.Ding);
Alert(alertsOn and ShortSignal, "SwingConfluence: SHORT", Alert.BAR, Sound.Ding);
Alert(alertsOn and CoverSignal, "SwingConfluence: COVER", Alert.BAR, Sound.Ding);
