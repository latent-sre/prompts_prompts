# =============================================================================
# SwingMaster_Upper v2 — chart study for the evidence-weighted dual-engine system
# =============================================================================
# Companion to SwingMaster_Strategy v2 (same logic, painted live).
# v2 changes: engines routed by PRICE STATE instead of ADX (deep RSI(2) dip ->
# MR engine; pullback recovery in trend structure -> trend engine); entry
# logic split into mandatory evidence-backed core + tiebreaker extras;
# Fisher Transform / SuperTrend / squeeze removed (no rigorous evidence —
# still available in the SwingConfluence files). ADX gate kept as an
# OPTIONAL input (default off) for A/B comparison only.
#
# Arrows: GREEN up = trend buy, RED down = trend sell,
#         CYAN up = mean-reversion buy, ORANGE down = mean-reversion sell,
#         MAGENTA/PINK = optional trend short/cover.
# Lines:  YELLOW = 200-SMA regime, ORANGE = EMA21, CYAN dashes = MR exit
#         5-SMA (only while in an MR trade), RED/GREEN dashes = stop/target.
# The study tracks simulated positions for display; the Strategy file is the
# source of truth for backtests (and adds the time stops).
# =============================================================================

declare upper;

input enableShorts   = no;
input showSignals    = yes;
input showLevels     = yes;
input showLabels     = yes;
input alertsOn       = yes;

input regimeMaLength = 200;
input useAdxGate     = no;        # legacy v1 behavior; no published support
input adxLength      = 14;
input modeADX        = 20;

input atrLength      = 14;
input fastEmaLen     = 8;
input slowEmaLen     = 21;
input chandLength    = 22;
input chandMult      = 3.0;
input stopAtrMult    = 2.0;
input targetRMult    = 2.0;
input extrasNeeded   = 2;
input maxExtensionATR = 2.0;
input maxAtrPercent  = 8.0;
input minRelVolume   = 1.0;
input cmfLength      = 21;
input viLength       = 14;
input hullLength     = 20;

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
def rsi14   = RSI(price = close, length = 14);
def rsi2    = RSI(price = close, length = 2);
def adxVal  = ADX(length = adxLength);

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

def mrSetup = regimeBull and adxGateMR and rsi2 < mrBuyBelow and atrPctOk;

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

def tfLongSetup  = regimeBull and adxGateTF and structLong
               and (trigLong or trigLong[1])
               and extrasLong >= extrasNeeded
               and atrPctOk and notExtUp and rsi14 < 70
               and !mrSetup;
def tfShortSetup = enableShorts and regimeBear and adxGateTF and structShort
               and (trigShort or trigShort[1])
               and extrasShort >= extrasNeeded
               and atrPctOk and notExtDown and rsi14 > 30;

# ---------------- simulated positions (display only) ----------------
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
         or close < emaS
    then 0 else tfLong[1], 0);

def tfShort = CompoundValue(1,
    if tfShort[1] == 0 then (if tfShortSetup and mrPos == 0 and tfLong == 0 then close else 0)
    else if close > Min(chandShort, tfShort[1] + stopAtrMult * atrVal)
         or close <= tfShort[1] - targetRMult * stopAtrMult * atrVal
         or close > emaS
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

plot TrendEMA = emaS;
TrendEMA.SetDefaultColor(Color.ORANGE);

plot MrExitMA = if mrPos != 0 then sma5 else Double.NaN;
MrExitMA.SetPaintingStrategy(PaintingStrategy.DASHES);
MrExitMA.SetDefaultColor(Color.CYAN);

# ---------------- labels ----------------
AddLabel(showLabels, if regimeBull then "Regime: BULL" else "Regime: BEAR",
    if regimeBull then Color.GREEN else Color.RED);
AddLabel(showLabels, "RSI(2) " + Round(rsi2, 0),
    if rsi2 < mrBuyBelow then Color.CYAN
    else if rsi2 > 90 then Color.RED else Color.GRAY);
AddLabel(showLabels, "Extras " + extrasLong + "/5",
    if extrasLong >= extrasNeeded then Color.GREEN else Color.GRAY);
AddLabel(showLabels and useAdxGate, "ADX gate ON (" + Round(adxVal, 0) + ")", Color.YELLOW);
AddLabel(showLabels and !atrPctOk, "ATR " + Round(atrVal / close * 100, 1) + "% — too volatile", Color.RED);
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
