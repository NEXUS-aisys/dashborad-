class TechnicalIndicatorsService {
  constructor() {
    this.defaultPeriods = {
      rsi: 14,
      macd: { fast: 12, slow: 26, signal: 9 },
      bollinger: { period: 20, stdDev: 2 },
      sma: { short: 10, medium: 20, long: 50 },
      ema: { short: 12, medium: 26, long: 50 },
      stochastic: { k: 14, d: 3 },
      williamsR: 14,
      cci: 20,
      adx: 14,
      atr: 14,
      obv: null,
      mfi: 14,
      roc: 10
    };
  }

  // Calculate all technical indicators
  calculateAllIndicators(historicalData) {
    if (!historicalData || historicalData.length < 50) {
      return null;
    }

    const closes = historicalData.map(d => d.close);
    const highs = historicalData.map(d => d.high);
    const lows = historicalData.map(d => d.low);
    const volumes = historicalData.map(d => d.volume);

    return {
      // Trend Indicators
      sma: this.calculateSMA(closes),
      ema: this.calculateEMA(closes),
      macd: this.calculateMACD(closes),
      adx: this.calculateADX(highs, lows, closes),
      
      // Momentum Indicators
      rsi: this.calculateRSI(closes),
      stochastic: this.calculateStochastic(highs, lows, closes),
      williamsR: this.calculateWilliamsR(highs, lows, closes),
      cci: this.calculateCCI(highs, lows, closes),
      roc: this.calculateROC(closes),
      mfi: this.calculateMFI(highs, lows, closes, volumes),
      
      // Volatility Indicators
      bollingerBands: this.calculateBollingerBands(closes),
      atr: this.calculateATR(highs, lows, closes),
      
      // Volume Indicators
      obv: this.calculateOBV(closes, volumes),
      volumeSMA: this.calculateSMA(volumes, 20),
      
      // Support and Resistance
      support: this.calculateSupport(closes),
      resistance: this.calculateResistance(closes),
      
      // Additional Analysis
      priceAction: this.analyzePriceAction(historicalData),
      volumeAnalysis: this.analyzeVolume(volumes),
      volatility: this.calculateVolatility(closes)
    };
  }

  // Simple Moving Average
  calculateSMA(prices, period = 20) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  // Exponential Moving Average
  calculateEMA(prices, period = 12) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // First EMA is SMA
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    ema.push(sum / period);
    
    // Calculate EMA
    for (let i = period; i < prices.length; i++) {
      const newEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(newEMA);
    }
    
    return ema;
  }

  // MACD (Moving Average Convergence Divergence)
  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    
    const macdLine = [];
    for (let i = 0; i < ema26.length; i++) {
      macdLine.push(ema12[i + (ema26.length - ema12.length)] - ema26[i]);
    }
    
    const signalLine = this.calculateEMA(macdLine, signalPeriod);
    const histogram = [];
    
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i + (macdLine.length - signalLine.length)] - signalLine[i]);
    }
    
    return {
      macdLine: macdLine[macdLine.length - 1],
      signalLine: signalLine[signalLine.length - 1],
      histogram: histogram[histogram.length - 1],
      signal: macdLine[macdLine.length - 1] > signalLine[signalLine.length - 1] ? 'bullish' : 'bearish',
      divergence: Math.abs(macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1])
    };
  }

  // RSI (Relative Strength Index)
  calculateRSI(prices, period = 14) {
    const gains = [];
    const losses = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return {
      value: rsi,
      signal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral',
      strength: Math.abs(50 - rsi) / 50
    };
  }

  // Bollinger Bands
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = this.calculateSMA(prices, period);
    const smaValue = sma[sma.length - 1];
    
    const variance = prices.slice(-period).reduce((sum, price) => {
      return sum + Math.pow(price - smaValue, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: smaValue + (stdDev * standardDeviation),
      middle: smaValue,
      lower: smaValue - (stdDev * standardDeviation),
      bandwidth: ((smaValue + (stdDev * standardDeviation)) - (smaValue - (stdDev * standardDeviation))) / smaValue,
      percentB: (prices[prices.length - 1] - (smaValue - (stdDev * standardDeviation))) / ((smaValue + (stdDev * standardDeviation)) - (smaValue - (stdDev * standardDeviation)))
    };
  }

  // Stochastic Oscillator
  calculateStochastic(highs, lows, closes, kPeriod = 14, dPeriod = 3) {
    const kValues = [];
    
    for (let i = kPeriod - 1; i < highs.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
      const currentClose = closes[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    const dValues = this.calculateSMA(kValues, dPeriod);
    
    return {
      k: kValues[kValues.length - 1],
      d: dValues[dValues.length - 1],
      signal: kValues[kValues.length - 1] > 80 ? 'overbought' : kValues[kValues.length - 1] < 20 ? 'oversold' : 'neutral'
    };
  }

  // Williams %R
  calculateWilliamsR(highs, lows, closes, period = 14) {
    const highestHigh = Math.max(...highs.slice(-period));
    const lowestLow = Math.min(...lows.slice(-period));
    const currentClose = closes[closes.length - 1];
    
    const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    
    return {
      value: williamsR,
      signal: williamsR < -80 ? 'oversold' : williamsR > -20 ? 'overbought' : 'neutral'
    };
  }

  // CCI (Commodity Channel Index)
  calculateCCI(highs, lows, closes, period = 20) {
    const typicalPrices = [];
    for (let i = 0; i < closes.length; i++) {
      typicalPrices.push((highs[i] + lows[i] + closes[i]) / 3);
    }
    
    const sma = this.calculateSMA(typicalPrices, period);
    const smaValue = sma[sma.length - 1];
    const currentTP = typicalPrices[typicalPrices.length - 1];
    
    const meanDeviation = typicalPrices.slice(-period).reduce((sum, tp) => {
      return sum + Math.abs(tp - smaValue);
    }, 0) / period;
    
    const cci = (currentTP - smaValue) / (0.015 * meanDeviation);
    
    return {
      value: cci,
      signal: cci > 100 ? 'overbought' : cci < -100 ? 'oversold' : 'neutral'
    };
  }

  // ROC (Rate of Change)
  calculateROC(prices, period = 10) {
    const currentPrice = prices[prices.length - 1];
    const pastPrice = prices[prices.length - 1 - period];
    
    const roc = ((currentPrice - pastPrice) / pastPrice) * 100;
    
    return {
      value: roc,
      signal: roc > 0 ? 'bullish' : 'bearish',
      strength: Math.abs(roc)
    };
  }

  // MFI (Money Flow Index)
  calculateMFI(highs, lows, closes, volumes, period = 14) {
    const moneyFlow = [];
    
    for (let i = 0; i < closes.length; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      moneyFlow.push(typicalPrice * volumes[i]);
    }
    
    let positiveFlow = 0;
    let negativeFlow = 0;
    
    for (let i = 1; i < period + 1; i++) {
      const index = moneyFlow.length - i;
      if (moneyFlow[index] > moneyFlow[index - 1]) {
        positiveFlow += moneyFlow[index];
      } else {
        negativeFlow += moneyFlow[index];
      }
    }
    
    const mfi = 100 - (100 / (1 + (positiveFlow / negativeFlow)));
    
    return {
      value: mfi,
      signal: mfi > 80 ? 'overbought' : mfi < 20 ? 'oversold' : 'neutral'
    };
  }

  // ADX (Average Directional Index)
  calculateADX(highs, lows, closes, period = 14) {
    const trueRanges = [];
    const directionalMovement = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
      
      const dm = highs[i] - highs[i - 1] > lows[i - 1] - lows[i] ? 
        Math.max(highs[i] - highs[i - 1], 0) : 0;
      directionalMovement.push(dm);
    }
    
    const atr = this.calculateSMA(trueRanges, period);
    const dmSMA = this.calculateSMA(directionalMovement, period);
    
    const di = (dmSMA[dmSMA.length - 1] / atr[atr.length - 1]) * 100;
    
    return {
      value: di,
      signal: di > 25 ? 'strong_trend' : di < 20 ? 'weak_trend' : 'neutral'
    };
  }

  // ATR (Average True Range)
  calculateATR(highs, lows, closes, period = 14) {
    const trueRanges = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr = Math.max(
        highs[i] - lows[i],
        Math.abs(highs[i] - closes[i - 1]),
        Math.abs(lows[i] - closes[i - 1])
      );
      trueRanges.push(tr);
    }
    
    const atr = this.calculateSMA(trueRanges, period);
    
    return {
      value: atr[atr.length - 1],
      volatility: atr[atr.length - 1] / closes[closes.length - 1] * 100
    };
  }

  // OBV (On-Balance Volume)
  calculateOBV(closes, volumes) {
    let obv = 0;
    
    for (let i = 1; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) {
        obv += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        obv -= volumes[i];
      }
    }
    
    return {
      value: obv,
      signal: obv > 0 ? 'bullish' : 'bearish',
      trend: obv > 0 ? 'increasing' : 'decreasing'
    };
  }

  // Support and Resistance Levels
  calculateSupport(closes, period = 10) {
    const recentLows = closes.slice(-period);
    const support = Math.min(...recentLows);
    
    return {
      level: support,
      strength: this.calculateSupportStrength(closes, support),
      distance: ((closes[closes.length - 1] - support) / closes[closes.length - 1]) * 100
    };
  }

  calculateResistance(closes, period = 10) {
    const recentHighs = closes.slice(-period);
    const resistance = Math.max(...recentHighs);
    
    return {
      level: resistance,
      strength: this.calculateResistanceStrength(closes, resistance),
      distance: ((resistance - closes[closes.length - 1]) / closes[closes.length - 1]) * 100
    };
  }

  calculateSupportStrength(closes, support) {
    let touches = 0;
    for (let i = 0; i < closes.length; i++) {
      if (Math.abs(closes[i] - support) / support < 0.01) {
        touches++;
      }
    }
    return touches;
  }

  calculateResistanceStrength(closes, resistance) {
    let touches = 0;
    for (let i = 0; i < closes.length; i++) {
      if (Math.abs(closes[i] - resistance) / resistance < 0.01) {
        touches++;
      }
    }
    return touches;
  }

  // Price Action Analysis
  analyzePriceAction(historicalData) {
    const recent = historicalData.slice(-5);
    const highs = recent.map(d => d.high);
    const lows = recent.map(d => d.low);
    const closes = recent.map(d => d.close);
    
    const higherHighs = highs.every((high, i) => i === 0 || high >= highs[i - 1]);
    const higherLows = lows.every((low, i) => i === 0 || low >= lows[i - 1]);
    const lowerHighs = highs.every((high, i) => i === 0 || high <= highs[i - 1]);
    const lowerLows = lows.every((low, i) => i === 0 || low <= lows[i - 1]);
    
    let pattern = 'sideways';
    if (higherHighs && higherLows) pattern = 'uptrend';
    else if (lowerHighs && lowerLows) pattern = 'downtrend';
    else if (higherHighs && lowerLows) pattern = 'consolidation';
    else if (lowerHighs && higherLows) pattern = 'reversal';
    
    return {
      pattern,
      higherHighs,
      higherLows,
      lowerHighs,
      lowerLows,
      momentum: closes[closes.length - 1] > closes[0] ? 'positive' : 'negative'
    };
  }

  // Volume Analysis
  analyzeVolume(volumes) {
    const recentVolumes = volumes.slice(-20);
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    const currentVolume = volumes[volumes.length - 1];
    
    return {
      currentVolume,
      averageVolume: avgVolume,
      volumeRatio: currentVolume / avgVolume,
      trend: currentVolume > avgVolume ? 'above_average' : 'below_average',
      strength: Math.abs(currentVolume - avgVolume) / avgVolume
    };
  }

  // Volatility Calculation
  calculateVolatility(prices, period = 20) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const recentReturns = returns.slice(-period);
    const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / recentReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
    
    return {
      daily: Math.sqrt(variance),
      annualized: volatility,
      level: volatility > 0.3 ? 'high' : volatility > 0.15 ? 'medium' : 'low'
    };
  }

  // Generate trading signals based on indicators
  generateSignals(indicators) {
    const signals = [];
    
    // RSI signals
    if (indicators.rsi.signal === 'oversold') signals.push({ indicator: 'RSI', signal: 'BUY', strength: 'strong' });
    if (indicators.rsi.signal === 'overbought') signals.push({ indicator: 'RSI', signal: 'SELL', strength: 'strong' });
    
    // MACD signals
    if (indicators.macd.signal === 'bullish' && indicators.macd.histogram > 0) {
      signals.push({ indicator: 'MACD', signal: 'BUY', strength: 'medium' });
    }
    if (indicators.macd.signal === 'bearish' && indicators.macd.histogram < 0) {
      signals.push({ indicator: 'MACD', signal: 'SELL', strength: 'medium' });
    }
    
    // Stochastic signals
    if (indicators.stochastic.signal === 'oversold') signals.push({ indicator: 'Stochastic', signal: 'BUY', strength: 'medium' });
    if (indicators.stochastic.signal === 'overbought') signals.push({ indicator: 'Stochastic', signal: 'SELL', strength: 'medium' });
    
    // Bollinger Bands signals
    if (indicators.bollingerBands.percentB < 0.2) signals.push({ indicator: 'Bollinger Bands', signal: 'BUY', strength: 'strong' });
    if (indicators.bollingerBands.percentB > 0.8) signals.push({ indicator: 'Bollinger Bands', signal: 'SELL', strength: 'strong' });
    
    // Volume confirmation
    if (indicators.volumeAnalysis.trend === 'above_average') {
      signals.forEach(signal => signal.strength = signal.strength === 'strong' ? 'very_strong' : 'strong');
    }
    
    return signals;
  }
}

module.exports = new TechnicalIndicatorsService();