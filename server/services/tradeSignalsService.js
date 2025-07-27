const axios = require('axios');
const { sendLLMRequest } = require('./llmService');
const marketDataService = require('./marketDataService');
const technicalIndicatorsService = require('./technicalIndicatorsService');

class TradeSignalsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get market data from multiple providers
  async getMarketData(symbol, period = '1mo') {
    try {
      return await marketDataService.getMarketData(symbol, period);
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
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

  // Calculate technical indicators using enhanced service
  calculateTechnicalIndicators(historicalData) {
    if (!historicalData || historicalData.length < 50) {
      return null;
    }

    return technicalIndicatorsService.calculateAllIndicators(historicalData);
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
      const [marketData, localData] = await Promise.all([
        this.getMarketData(symbol),
        this.getLocalData(symbol)
      ]);

      // Calculate technical indicators
      const technicalIndicators = this.calculateTechnicalIndicators(marketData.historical);

      // Generate ML predictions
      const mlPredictions = await this.generateMLPredictions(symbol, marketData);

      // Generate AI analysis
      const aiAnalysis = await this.generateAIAnalysis(
        symbol, 
        marketData, 
        localData, 
        technicalIndicators, 
        mlPredictions
      );

      // Compile comprehensive signal
      const tradeSignal = {
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        marketData: marketData,
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