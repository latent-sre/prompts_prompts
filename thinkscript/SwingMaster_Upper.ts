# =============================================================================
# SwingMaster_Upper — chart study for the regime-switched dual-engine system
# =============================================================================
# Companion to SwingMaster_Strategy (same logic, painted live on the chart).
#
#   Regime : longs only above the 200-SMA (yellow line)
#   Mode   : ADX >= modeADX -> TREND mode -> pullback-in-trend engine
#            ADX <  modeADX -> CHOP mode  -> RSI(2) mean-reversion engine
#
# Arrows: GREEN up = trend-engine buy, RED down = trend-engine sell,
#         CYAN up = mean-reversion buy, ORANGE down = mean-reversion sell,
#         MAGENTA/PINK = optional trend-engine short/cover.
# While in a simulated trade it draws the stop and (for trend trades) the
# 2R target. Labels show regime, mode, score, and the active engine.
# Note: the study tracks one simulated position per engine for display;
# the Strategy file is the source of truth for backtests.
# =============================================================================

declare upper;

input enableShorts   = no;
input showSignals    = yes;
input showLevels     = yes;
input showLabels     = yes;
input alertsOn       = yes;

input regimeMaLength = 200;
input modeADX        = 20;
input adxLength      = 14;

input atrLength      = 14;
input stAtrMult      = 2.5;
input chandLength    = 22;
input chandMult      = 3.0;
input stopAtrMult    = 2.0;
input targetRMult    = 2.0;
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

input mrBuyBelow     = 10;
input mrExitMaLen    = 5;
input useMrRsiExit   = yes;
input mrStopMult     = 3.0;

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

def hlRange = high - low;
def adv = if hlRange == 0 then 0
          else ((close - low) - (high - close)) / hlRange * volume;
def cmf = Sum(adv, cmfLength) / Sum(volume, cmfLength);

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

# ---------------- trend engine ----------------
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

def mrSetup = regimeBull and chopMode and rsi2 < mrBuyBelow and atrPctOk;

# ---------------- simulated positions (display only) ----------------
# Each state var holds the entry price while in that engine's trade (0 = flat).
def mrPos = CompoundValue(1,
    if mrPos[1] == 0 then (if mrSetup then close else 0)
    else if close > sma5
         or (useMrRsiExit and rsi2 > 70)
         or close < mrPos[1] - mrStopMult * atrVal
    then 0 else mrPos[1], 0);

def tfLong = CompoundValue(1,
    if tfLong[1] == 0 then (if tfLongSetup and mrPos == 0 then close else 0)
    else if close < Max(chandLong, tfLong[1] - stopAtrMult * atrVal)
         or close >= tfLong[1] + targetRMult * stopAtrMult * atrVal
         or (close < superTrend and close[1] >= superTrend[1])
         or (fisher < fisher[1] and fisher[1] >= fisher[2] and fisher[1] > 1.5)
    then 0 else tfLong[1], 0);

def tfShort = CompoundValue(1,
    if tfShort[1] == 0 then (if tfShortSetup and mrPos == 0 and tfLong == 0 then close else 0)
    else if close > Min(chandShort, tfShort[1] + stopAtrMult * atrVal)
         or close <= tfShort[1] - targetRMult * stopAtrMult * atrVal
         or (close > superTrend and close[1] <= superTrend[1])
         or (fisher > fisher[1] and fisher[1] <= fisher[2] and fisher[1] < -1.5)
    then 0 else tfShort[1], 0);

# ---------------- plots ----------------
plot TFBuy = showSignals and tfLong != 0 and tfLong[1] == 0;
TFBuy.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
TFBuy.SetDefaultColor(Color.GREEN);
TFBuy.SetLineWeight(3);

plot TFSell = showSignals and tfLong == 0 and tfLong[1] != 0;
TFSell.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
TFSell.SetDefaultColor(Color.RED);
TFSell.SetLineWeight(3);

plot MRBuy = showSignals and mrPos != 0 and mrPos[1] == 0;
MRBuy.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
MRBuy.SetDefaultColor(Color.CYAN);
MRBuy.SetLineWeight(3);

plot MRSell = showSignals and mrPos == 0 and mrPos[1] != 0;
MRSell.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
MRSell.SetDefaultColor(Color.ORANGE);
MRSell.SetLineWeight(3);

plot TFShortSig = showSignals and tfShort != 0 and tfShort[1] == 0;
TFShortSig.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_DOWN);
TFShortSig.SetDefaultColor(Color.MAGENTA);
TFShortSig.SetLineWeight(3);

plot TFCover = showSignals and tfShort == 0 and tfShort[1] != 0;
TFCover.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);
TFCover.SetDefaultColor(Color.PINK);
TFCover.SetLineWeight(3);

plot StopLine = if !showLevels then Double.NaN
    else if tfLong != 0 then Max(chandLong, tfLong - stopAtrMult * atrVal)
    else if tfShort != 0 then Min(chandShort, tfShort + stopAtrMult * atrVal)
    else if mrPos != 0 then mrPos - mrStopMult * atrVal
    else Double.NaN;
StopLine.SetPaintingStrategy(PaintingStrategy.DASHES);
StopLine.SetDefaultColor(Color.RED);

plot TargetLine = if !showLevels then Double.NaN
    else if tfLong != 0 then tfLong + targetRMult * stopAtrMult * atrVal
    else if tfShort != 0 then tfShort - targetRMult * stopAtrMult * atrVal
    else Double.NaN;   # MR engine exits on the 5-SMA, not a fixed target
TargetLine.SetPaintingStrategy(PaintingStrategy.DASHES);
TargetLine.SetDefaultColor(Color.GREEN);

plot RegimeMA = sma200;
RegimeMA.SetDefaultColor(Color.YELLOW);
RegimeMA.SetLineWeight(2);

plot MrExitMA = if mrPos != 0 then sma5 else Double.NaN;
MrExitMA.SetDefaultColor(Color.CYAN);

plot STrend = superTrend;
STrend.AssignValueColor(if close > superTrend then Color.DARK_GREEN else Color.DARK_RED);

# ---------------- labels ----------------
AddLabel(showLabels, if regimeBull then "Regime: BULL" else "Regime: BEAR",
    if regimeBull then Color.GREEN else Color.RED);
AddLabel(showLabels, (if trendMode then "Mode: TREND" else "Mode: CHOP")
    + " (ADX " + Round(adxVal, 0) + ")",
    if trendMode then Color.WHITE else Color.GRAY);
AddLabel(showLabels, "Bull " + bullScore + "/7  Bear " + bearScore + "/7",
    if bullScore >= minScore then Color.GREEN
    else if bearScore >= minScore then Color.RED else Color.GRAY);
AddLabel(showLabels, "RSI(2) " + Round(rsi2, 0),
    if rsi2 < mrBuyBelow then Color.CYAN
    else if rsi2 > 90 then Color.RED else Color.GRAY);
AddLabel(showLabels and squeezed, "SQUEEZE", Color.YELLOW);
AddLabel(showLabels and tfLong != 0,  "TF LONG from "  + Round(tfLong, 2),  Color.GREEN);
AddLabel(showLabels and mrPos != 0,   "MR LONG from "  + Round(mrPos, 2),   Color.CYAN);
AddLabel(showLabels and tfShort != 0, "TF SHORT from " + Round(tfShort, 2), Color.MAGENTA);

# ---------------- alerts ----------------
Alert(alertsOn and TFBuy,      "SwingMaster: TREND BUY",  Alert.BAR, Sound.Ding);
Alert(alertsOn and TFSell,     "SwingMaster: TREND SELL", Alert.BAR, Sound.Ding);
Alert(alertsOn and MRBuy,      "SwingMaster: MR BUY",     Alert.BAR, Sound.Ding);
Alert(alertsOn and MRSell,     "SwingMaster: MR SELL",    Alert.BAR, Sound.Ding);
Alert(alertsOn and TFShortSig, "SwingMaster: SHORT",      Alert.BAR, Sound.Ding);
Alert(alertsOn and TFCover,    "SwingMaster: COVER",      Alert.BAR, Sound.Ding);
