const axios = require('axios');
const { sendLLMRequest } = require('./llmService');
const yahooFinance = require('yahoo-finance2').default;

class TradeSignalsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get market data from Yahoo Finance
  async getYahooData(symbol, period = '1mo') {
    try {
      const quote = await yahooFinance.quote(symbol);
      const historical = await yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: '1d'
      });

      return {
        symbol: quote.symbol,
        currentPrice: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        pe: quote.trailingPE,
        historical: historical.map(d => ({
          date: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        }))
      };
    } catch (error) {
      console.error(`Error fetching Yahoo data for ${symbol}:`, error);
      throw error;
    }
  }

  // Get local data (from bot or database)
  async getLocalData(symbol) {
    try {
      // TODO: Implement actual local data fetching from your bot/database
      // This is a mock implementation
      const mockLocalData = {
        botSignals: [
          {
            timestamp: new Date().toISOString(),
            signal: 'BUY',
            confidence: 0.85,
            price: 175.50,
            volume: 45678900
          }
        ],
        mlPredictions: {
          nextDay: 176.20,
          nextWeek: 178.50,
          nextMonth: 182.00,
          confidence: 0.78
        },
        technicalIndicators: {
          rsi: 68.2,
          macd: 'bullish',
          bollingerBands: {
            upper: 180.50,
            middle: 175.50,
            lower: 170.50
          },
          support: 172.00,
          resistance: 178.00
        }
      };

      return mockLocalData;
    } catch (error) {
      console.error(`Error fetching local data for ${symbol}:`, error);
      return null;
    }
  }

  // Calculate technical indicators
  calculateTechnicalIndicators(historicalData) {
    if (!historicalData || historicalData.length < 14) {
      return null;
    }

    const closes = historicalData.map(d => d.close);
    const volumes = historicalData.map(d => d.volume);

    // RSI calculation
    const rsi = this.calculateRSI(closes, 14);
    
    // MACD calculation
    const macd = this.calculateMACD(closes);
    
    // Bollinger Bands
    const bb = this.calculateBollingerBands(closes, 20, 2);
    
    // Volume analysis
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;

    return {
      rsi: rsi[rsi.length - 1],
      macd: macd,
      bollingerBands: bb,
      volumeRatio: volumeRatio,
      support: Math.min(...closes.slice(-10)),
      resistance: Math.max(...closes.slice(-10))
    };
  }

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
    
    return [rsi];
  }

  calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    
    const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
    const signalLine = this.calculateEMA([macdLine], signalPeriod)[0];
    const histogram = macdLine - signalLine;
    
    return {
      macdLine,
      signalLine,
      histogram,
      signal: macdLine > signalLine ? 'bullish' : 'bearish'
    };
  }

  calculateEMA(prices, period) {
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return [ema];
  }

  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const variance = prices.slice(-period).reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * standardDeviation),
      middle: sma,
      lower: sma - (stdDev * standardDeviation)
    };
  }

  // Generate ML-based predictions
  async generateMLPredictions(symbol, data) {
    try {
      // TODO: Integrate with actual ML models
      // This is a mock implementation that simulates ML predictions
      const predictions = {
        shortTerm: {
          nextDay: data.currentPrice * (1 + (Math.random() - 0.5) * 0.02),
          nextWeek: data.currentPrice * (1 + (Math.random() - 0.5) * 0.05),
          confidence: 0.75 + Math.random() * 0.2
        },
        mediumTerm: {
          nextMonth: data.currentPrice * (1 + (Math.random() - 0.5) * 0.1),
          nextQuarter: data.currentPrice * (1 + (Math.random() - 0.5) * 0.15),
          confidence: 0.65 + Math.random() * 0.25
        },
        sentiment: Math.random() > 0.5 ? 'bullish' : 'bearish',
        volatility: 0.15 + Math.random() * 0.1
      };

      return predictions;
    } catch (error) {
      console.error('Error generating ML predictions:', error);
      return null;
    }
  }

  // Generate AI-powered analysis and recommendations
  async generateAIAnalysis(symbol, marketData, localData, technicalIndicators, mlPredictions) {
    try {
      const analysisPrompt = `
Analyze the following trading data for ${symbol} and provide comprehensive trading recommendations:

MARKET DATA:
- Current Price: $${marketData.currentPrice}
- Change: $${marketData.change} (${marketData.changePercent}%)
- Volume: ${marketData.volume}
- Market Cap: $${marketData.marketCap}

TECHNICAL INDICATORS:
- RSI: ${technicalIndicators?.rsi || 'N/A'}
- MACD: ${technicalIndicators?.macd?.signal || 'N/A'}
- Support: $${technicalIndicators?.support || 'N/A'}
- Resistance: $${technicalIndicators?.resistance || 'N/A'}
- Volume Ratio: ${technicalIndicators?.volumeRatio || 'N/A'}

ML PREDICTIONS:
- Next Day: $${mlPredictions?.shortTerm?.nextDay || 'N/A'}
- Next Week: $${mlPredictions?.shortTerm?.nextWeek || 'N/A'}
- Confidence: ${mlPredictions?.shortTerm?.confidence || 'N/A'}
- Sentiment: ${mlPredictions?.sentiment || 'N/A'}

BOT SIGNALS:
${localData?.botSignals ? JSON.stringify(localData.botSignals, null, 2) : 'No bot signals available'}

Please provide:
1. Overall market sentiment (Bullish/Bearish/Neutral)
2. Trading signal (BUY/SELL/HOLD)
3. Confidence level (0-100%)
4. Entry price range
5. Target price
6. Stop loss price
7. Risk/reward ratio
8. Detailed reasoning
9. Key risks to consider
10. Position sizing recommendation

Format your response as JSON with the following structure:
{
  "sentiment": "bullish/bearish/neutral",
  "signal": "BUY/SELL/HOLD",
  "confidence": 85,
  "entryPrice": {"min": 175.50, "max": 176.00},
  "targetPrice": 180.00,
  "stopLoss": 172.00,
  "riskRewardRatio": "1:2.5",
  "reasoning": "detailed explanation",
  "risks": ["risk1", "risk2"],
  "positionSize": "2% of capital"
}
`;

      const aiResponse = await sendLLMRequest('anthropic', 'claude-3-sonnet-20240229', analysisPrompt);
      
      try {
        const analysis = JSON.parse(aiResponse);
        return analysis;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to structured response parsing
        return this.parseAIResponse(aiResponse);
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      return this.generateFallbackAnalysis(symbol, marketData, technicalIndicators);
    }
  }

  parseAIResponse(response) {
    // Fallback parsing for non-JSON responses
    const analysis = {
      sentiment: 'neutral',
      signal: 'HOLD',
      confidence: 50,
      entryPrice: { min: 0, max: 0 },
      targetPrice: 0,
      stopLoss: 0,
      riskRewardRatio: '1:1',
      reasoning: response,
      risks: ['Unable to parse AI response'],
      positionSize: '1% of capital'
    };

    // Try to extract key information from text
    if (response.toLowerCase().includes('buy')) analysis.signal = 'BUY';
    if (response.toLowerCase().includes('sell')) analysis.signal = 'SELL';
    if (response.toLowerCase().includes('bullish')) analysis.sentiment = 'bullish';
    if (response.toLowerCase().includes('bearish')) analysis.sentiment = 'bearish';

    return analysis;
  }

  generateFallbackAnalysis(symbol, marketData, technicalIndicators) {
    const currentPrice = marketData.currentPrice;
    const rsi = technicalIndicators?.rsi || 50;
    const macd = technicalIndicators?.macd?.signal || 'neutral';

    let signal = 'HOLD';
    let sentiment = 'neutral';
    let confidence = 50;

    if (rsi < 30 && macd === 'bullish') {
      signal = 'BUY';
      sentiment = 'bullish';
      confidence = 75;
    } else if (rsi > 70 && macd === 'bearish') {
      signal = 'SELL';
      sentiment = 'bearish';
      confidence = 75;
    }

    return {
      sentiment,
      signal,
      confidence,
      entryPrice: { min: currentPrice * 0.99, max: currentPrice * 1.01 },
      targetPrice: signal === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95,
      stopLoss: signal === 'BUY' ? currentPrice * 0.97 : currentPrice * 1.03,
      riskRewardRatio: '1:2',
      reasoning: `Fallback analysis based on RSI (${rsi}) and MACD (${macd})`,
      risks: ['Limited data available', 'Fallback analysis used'],
      positionSize: '1% of capital'
    };
  }

  // Main method to generate comprehensive trade signals
  async generateTradeSignals(symbol) {
    try {
      const cacheKey = `${symbol}_${Date.now()}`;
      
      // Check cache first
      if (this.cache.has(symbol)) {
        const cached = this.cache.get(symbol);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Fetch data from multiple sources
      const [yahooData, localData] = await Promise.all([
        this.getYahooData(symbol),
        this.getLocalData(symbol)
      ]);

      // Calculate technical indicators
      const technicalIndicators = this.calculateTechnicalIndicators(yahooData.historical);

      // Generate ML predictions
      const mlPredictions = await this.generateMLPredictions(symbol, yahooData);

      // Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(
        symbol, 
        yahooData, 
        localData, 
        technicalIndicators, 
        mlPredictions
      );

      // Compile comprehensive signal
      const tradeSignal = {
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        marketData: yahooData,
        localData: localData,
        technicalIndicators: technicalIndicators,
        mlPredictions: mlPredictions,
        aiAnalysis: aiAnalysis,
        summary: {
          signal: aiAnalysis.signal,
          confidence: aiAnalysis.confidence,
          sentiment: aiAnalysis.sentiment,
          entryPrice: aiAnalysis.entryPrice,
          targetPrice: aiAnalysis.targetPrice,
          stopLoss: aiAnalysis.stopLoss,
          riskRewardRatio: aiAnalysis.riskRewardRatio
        }
      };

      // Cache the result
      this.cache.set(symbol, {
        timestamp: Date.now(),
        data: tradeSignal
      });

      return tradeSignal;
    } catch (error) {
      console.error(`Error generating trade signals for ${symbol}:`, error);
      throw error;
    }
  }

  // Get multiple symbols analysis
  async getBatchSignals(symbols) {
    try {
      const signals = await Promise.allSettled(
        symbols.map(symbol => this.generateTradeSignals(symbol))
      );

      return signals.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            symbol: symbols[index],
            error: result.reason.message,
            timestamp: new Date().toISOString()
          };
        }
      });
    } catch (error) {
      console.error('Error generating batch signals:', error);
      throw error;
    }
  }

  // Get real-time signal updates
  async getRealTimeSignals(symbols, callback) {
    const interval = setInterval(async () => {
      try {
        const signals = await this.getBatchSignals(symbols);
        callback(signals);
      } catch (error) {
        console.error('Error in real-time signals:', error);
        callback({ error: error.message });
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }
}

module.exports = new TradeSignalsService();