# =============================================================================
# SwingConfluence_Lower — lower-pane confluence meter
# =============================================================================
# Companion pane to SwingConfluence_Upper. Shows, at a glance:
#   - Net confluence histogram: bull score minus bear score (-5 .. +5).
#     Built from LAGGING components (EMA stack, SuperTrend, Vortex, MACD
#     slope, relative volume).
#   - Fisher Transform line (LEADING) — turns lead price at swing extremes.
#   - Connors RSI rescaled to the pane (LEADING, uncommon).
#   - TTM-style squeeze dots on the zero line (Bollinger inside Keltner =
#     compression that often precedes the next swing leg).
#   - Trigger dots when a leading long/short timing event fires.
# =============================================================================

declare lower;

input fastEmaLen   = 8;
input slowEmaLen   = 21;
input atrLength    = 14;
input stAtrMult    = 2.5;
input viLength     = 14;
input fisherLength = 10;
input minRelVolume = 1.0;

# ---------------- shared calcs (mirror the upper study) ----------------
def atrVal  = WildersAverage(TrueRange(high, close, low), atrLength);
def emaF    = ExpAverage(close, fastEmaLen);
def emaS    = ExpAverage(close, slowEmaLen);
def macdDiff = MACD(fastLength = 12, slowLength = 26, MACDLength = 9).Diff;
def relVol  = volume / Average(volume, 50);
def rsi2    = RSI(price = close, length = 2);

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
def fisherRaw = CompoundValue(1, 0.5 * Log((1 + fXc) / (1 - fXc)) + 0.5 * fisherRaw[1], 0);

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

# ---------------- scores ----------------
def tLV = relVol >= minRelVolume;
def bullScore = (emaF > emaS) + (close > superTrend) + (viPlus > viMinus)
              + (macdDiff > macdDiff[1]) + tLV;
def bearScore = (emaF < emaS) + (close < superTrend) + (viMinus > viPlus)
              + (macdDiff < macdDiff[1]) + tLV;

def leadLong  = (rsi2 > 10 and rsi2[1] <= 10)
             or (fisherRaw > fisherRaw[1] and fisherRaw[1] <= fisherRaw[2] and fisherRaw < 0)
             or (wpr > -80 and wpr[1] <= -80)
             or (crsi > 20 and crsi[1] <= 20);
def leadShort = (rsi2 < 90 and rsi2[1] >= 90)
             or (fisherRaw < fisherRaw[1] and fisherRaw[1] >= fisherRaw[2] and fisherRaw > 0)
             or (wpr < -20 and wpr[1] >= -20)
             or (crsi < 80 and crsi[1] >= 80);

# ---------------- squeeze (Bollinger inside Keltner) ----------------
def bbMid = Average(close, 20);
def bbSd  = StDev(close, 20);
def atr20 = WildersAverage(TrueRange(high, close, low), 20);
def kMid  = ExpAverage(close, 20);
def squeezed = bbMid + 2 * bbSd < kMid + 1.5 * atr20
           and bbMid - 2 * bbSd > kMid - 1.5 * atr20;

# ---------------- plots ----------------
plot NetScore = bullScore - bearScore;
NetScore.SetPaintingStrategy(PaintingStrategy.HISTOGRAM);
NetScore.SetLineWeight(3);
NetScore.AssignValueColor(
    if NetScore >= 3 then Color.GREEN
    else if NetScore > 0 then Color.DARK_GREEN
    else if NetScore <= -3 then Color.RED
    else if NetScore < 0 then Color.DARK_RED
    else Color.GRAY);

plot Fisher = fisherRaw;
Fisher.SetDefaultColor(Color.CYAN);
Fisher.SetLineWeight(2);

# Connors RSI rescaled from 0..100 to -5..+5 so it shares the pane
plot CRSIScaled = (crsi - 50) / 10;
CRSIScaled.SetDefaultColor(Color.ORANGE);

plot ZeroLine = 0;
ZeroLine.SetDefaultColor(Color.GRAY);

plot SqueezeDot = if squeezed then 0 else Double.NaN;
SqueezeDot.SetPaintingStrategy(PaintingStrategy.POINTS);
SqueezeDot.SetDefaultColor(Color.YELLOW);
SqueezeDot.SetLineWeight(3);

plot LongTrigger = if leadLong then -4.5 else Double.NaN;
LongTrigger.SetPaintingStrategy(PaintingStrategy.POINTS);
LongTrigger.SetDefaultColor(Color.GREEN);
LongTrigger.SetLineWeight(3);

plot ShortTrigger = if leadShort then 4.5 else Double.NaN;
ShortTrigger.SetPaintingStrategy(PaintingStrategy.POINTS);
ShortTrigger.SetDefaultColor(Color.MAGENTA);
ShortTrigger.SetLineWeight(3);

AddLabel(yes, "Net " + NetScore,
    if NetScore > 0 then Color.GREEN else if NetScore < 0 then Color.RED else Color.GRAY);
AddLabel(squeezed, "SQUEEZE", Color.YELLOW);
AddLabel(yes, "CRSI " + Round(crsi, 0),
    if crsi < 20 then Color.GREEN else if crsi > 80 then Color.RED else Color.GRAY);
