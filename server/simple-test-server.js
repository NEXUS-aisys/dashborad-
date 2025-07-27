const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Simple technical indicators calculation
const calculateRSI = (prices, period = 14) => {
  if (prices.length < period + 1) return { value: 50, signal: 'neutral' };
  
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
    signal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
  };
};

const calculateMACD = (prices) => {
  if (prices.length < 26) return { signal: 'neutral', histogram: 0 };
  
  const ema12 = prices.slice(-12).reduce((a, b) => a + b, 0) / 12;
  const ema26 = prices.slice(-26).reduce((a, b) => a + b, 0) / 26;
  const macdLine = ema12 - ema26;
  const signalLine = macdLine * 0.9;
  const histogram = macdLine - signalLine;
  
  return {
    signal: macdLine > signalLine ? 'bullish' : 'bearish',
    histogram: histogram
  };
};

const calculateBollingerBands = (prices, period = 20) => {
  if (prices.length < period) return { percentB: 0.5 };
  
  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const variance = prices.slice(-period).reduce((sum, price) => {
    return sum + Math.pow(price - sma, 2);
  }, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  
  const upper = sma + (2 * standardDeviation);
  const lower = sma - (2 * standardDeviation);
  const currentPrice = prices[prices.length - 1];
  
  const percentB = (currentPrice - lower) / (upper - lower);
  
  return { percentB };
};

// Generate futures data
const generateFuturesData = (symbol) => {
  const symbolUpper = symbol.toUpperCase();
  
  // Base prices for different futures
  const basePrices = {
    'ES': 4800, 'NQ': 16500, 'YM': 38000, 'RTY': 2000,
    'CL': 75, 'GC': 2000, 'SI': 25, 'NG': 3,
    'ZN': 110, '6E': 1.08, '6J': 0.007
  };
  
  const basePrice = basePrices[symbolUpper] || 100;
  const volatility = 0.02;
  
  // Generate historical data
  const historical = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const randomChange = (Math.random() - 0.5) * volatility * basePrice * 0.02;
    const price = basePrice + randomChange;
    
    historical.push({
      date,
      open: price * (1 + (Math.random() - 0.5) * 0.01),
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: Math.floor(Math.random() * 1000000) + 100000
    });
  }

  const currentPrice = historical[historical.length - 1].close;
  const previousPrice = historical[historical.length - 2].close;
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;

  // Contract info
  const contractInfo = {
    'ES': { name: 'E-mini S&P 500', exchange: 'CME', tickSize: 0.25, tickValue: 12.50, margin: 12000 },
    'NQ': { name: 'E-mini NASDAQ-100', exchange: 'CME', tickSize: 0.25, tickValue: 5.00, margin: 15000 },
    'YM': { name: 'E-mini Dow Jones', exchange: 'CBOT', tickSize: 1.00, tickValue: 5.00, margin: 8000 },
    'RTY': { name: 'E-mini Russell 2000', exchange: 'CME', tickSize: 0.10, tickValue: 5.00, margin: 8000 },
    'CL': { name: 'Crude Oil', exchange: 'NYMEX', tickSize: 0.01, tickValue: 10.00, margin: 5000 },
    'GC': { name: 'Gold', exchange: 'COMEX', tickSize: 0.10, tickValue: 10.00, margin: 8000 },
    'SI': { name: 'Silver', exchange: 'COMEX', tickSize: 0.005, tickValue: 25.00, margin: 10000 },
    'NG': { name: 'Natural Gas', exchange: 'NYMEX', tickSize: 0.001, tickValue: 10.00, margin: 3000 },
    'ZN': { name: '10-Year Treasury Note', exchange: 'CBOT', tickSize: 0.015625, tickValue: 15.625, margin: 2000 },
    '6E': { name: 'Euro FX', exchange: 'CME', tickSize: 0.0001, tickValue: 12.50, margin: 3000 },
    '6J': { name: 'Japanese Yen', exchange: 'CME', tickSize: 0.000001, tickValue: 12.50, margin: 3000 }
  };

  return {
    symbol: symbolUpper,
    currentPrice,
    change,
    changePercent,
    volume: historical[historical.length - 1].volume,
    historical,
    instrumentType: 'futures',
    contractInfo: contractInfo[symbolUpper] || {
      name: 'Unknown Futures Contract',
      exchange: 'Unknown',
      tickSize: 0.01,
      tickValue: 10.00,
      margin: 5000
    }
  };
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Trade Signals Server Running',
    features: ['Futures Support', 'Technical Indicators', 'Multi-Provider Data']
  });
});

// Market data providers status
app.get('/api/trading/market/providers', (req, res) => {
  const providers = [
    { name: 'yahoo', displayName: 'Yahoo Finance', enabled: true, priority: 1, hasApiKey: false },
    { name: 'alphaVantage', displayName: 'Alpha Vantage', enabled: false, priority: 2, hasApiKey: false },
    { name: 'finnhub', displayName: 'Finnhub', enabled: false, priority: 3, hasApiKey: false },
    { name: 'polygon', displayName: 'Polygon.io', enabled: false, priority: 4, hasApiKey: false },
    { name: 'iex', displayName: 'IEX Cloud', enabled: false, priority: 5, hasApiKey: false }
  ];
  
  res.json({
    success: true,
    data: {
      providers,
      cache: { size: 0, timeout: 120000 }
    }
  });
});

// Clear cache
app.post('/api/trading/market/clear-cache', (req, res) => {
  res.json({
    success: true,
    message: 'Market data cache cleared successfully'
  });
});

// Get trade signals for a symbol
app.get('/api/trading/signals/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Generate market data
    const marketData = generateFuturesData(symbol);
    
    // Calculate technical indicators
    const prices = marketData.historical.map(d => d.close);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bb = calculateBollingerBands(prices);
    
    // Generate AI analysis (simplified)
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
    const signals = ['BUY', 'SELL', 'HOLD'];
    const signal = signals[Math.floor(Math.random() * signals.length)];
    const sentiments = ['bullish', 'bearish', 'neutral'];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    
    const tradeSignal = {
      symbol: symbol.toUpperCase(),
      timestamp: new Date().toISOString(),
      marketData: marketData,
      technicalIndicators: {
        rsi,
        macd,
        bollingerBands: bb,
        volumeAnalysis: {
          volumeRatio: (Math.random() * 2) + 0.5,
          trend: Math.random() > 0.5 ? 'above_average' : 'below_average'
        },
        support: { level: marketData.currentPrice * 0.98 },
        resistance: { level: marketData.currentPrice * 1.02 },
        volatility: { level: 'medium', annualized: (Math.random() * 20) + 10 }
      },
      aiAnalysis: {
        signal,
        confidence,
        sentiment,
        reasoning: `Analysis based on technical indicators and market conditions for ${symbol}`,
        entryPrice: { 
          min: marketData.currentPrice * 0.995, 
          max: marketData.currentPrice * 1.005 
        },
        targetPrice: signal === 'BUY' ? marketData.currentPrice * 1.03 : marketData.currentPrice * 0.97,
        stopLoss: signal === 'BUY' ? marketData.currentPrice * 0.985 : marketData.currentPrice * 1.015,
        riskRewardRatio: '1:2.5',
        risks: ['Market volatility', 'Liquidity risk', 'Overnight gap risk'],
        recommendations: [`Consider ${signal.toLowerCase()}ing ${symbol} with proper risk management`]
      },
      summary: {
        signal,
        confidence,
        sentiment,
        entryPrice: { 
          min: marketData.currentPrice * 0.995, 
          max: marketData.currentPrice * 1.005 
        },
        targetPrice: signal === 'BUY' ? marketData.currentPrice * 1.03 : marketData.currentPrice * 0.97,
        stopLoss: signal === 'BUY' ? marketData.currentPrice * 0.985 : marketData.currentPrice * 1.015,
        riskRewardRatio: '1:2.5'
      }
    };

    res.json({
      success: true,
      data: tradeSignal
    });
  } catch (error) {
    console.error('Error generating trade signals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trade signals',
      error: error.message
    });
  }
});

// Get indicator signals for a symbol
app.get('/api/trading/indicators/signals/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Generate market data
    const marketData = generateFuturesData(symbol);
    
    // Calculate indicators
    const prices = marketData.historical.map(d => d.close);
    const rsi = calculateRSI(prices);
    const macd = calculateMACD(prices);
    const bb = calculateBollingerBands(prices);
    
    // Generate signals
    const signals = [];
    
    if (rsi.signal === 'oversold') signals.push({ indicator: 'RSI', signal: 'BUY', strength: 'strong' });
    if (rsi.signal === 'overbought') signals.push({ indicator: 'RSI', signal: 'SELL', strength: 'strong' });
    if (macd.signal === 'bullish') signals.push({ indicator: 'MACD', signal: 'BUY', strength: 'medium' });
    if (macd.signal === 'bearish') signals.push({ indicator: 'MACD', signal: 'SELL', strength: 'medium' });
    if (bb.percentB < 0.2) signals.push({ indicator: 'Bollinger Bands', signal: 'BUY', strength: 'strong' });
    if (bb.percentB > 0.8) signals.push({ indicator: 'Bollinger Bands', signal: 'SELL', strength: 'strong' });
    
    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        indicators: { rsi, macd, bollingerBands: bb },
        signals,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating indicator signals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate indicator signals',
      error: error.message
    });
  }
});

// Performance metrics (mock)
app.get('/api/trading/signals/performance', (req, res) => {
  const performance = {
    totalSignals: 156,
    accuracy: 0.72,
    profitableSignals: 112,
    averageReturn: 0.045,
    bestSignal: {
      symbol: 'NQ',
      date: '2024-01-15',
      return: 0.15,
      signal: 'BUY'
    },
    worstSignal: {
      symbol: 'ES',
      date: '2024-01-10',
      return: -0.08,
      signal: 'SELL'
    },
    bySignalType: {
      buy: { count: 67, accuracy: 0.68, avgReturn: 0.052 },
      sell: { count: 45, accuracy: 0.75, avgReturn: 0.038 },
      hold: { count: 44, accuracy: 0.71, avgReturn: 0.041 }
    }
  };

  res.json({
    success: true,
    data: performance
  });
});

// Watchlist (mock)
app.get('/api/trading/signals/watchlist', (req, res) => {
  const mockWatchlist = [
    {
      symbol: 'ES',
      alertPrice: 4800.00,
      alertType: 'price',
      createdAt: '2024-01-15T00:00:00Z',
      lastSignal: {
        signal: 'BUY',
        confidence: 85,
        timestamp: '2024-01-15T10:30:00Z'
      }
    },
    {
      symbol: 'NQ',
      alertPrice: 16500.00,
      alertType: 'price',
      createdAt: '2024-01-15T00:00:00Z',
      lastSignal: {
        signal: 'SELL',
        confidence: 78,
        timestamp: '2024-01-15T10:30:00Z'
      }
    }
  ];

  res.json({
    success: true,
    data: mockWatchlist
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trade Signals Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Market providers: http://localhost:${PORT}/api/trading/market/providers`);
  console.log(`🎯 Trade signals: http://localhost:${PORT}/api/trading/signals/ES`);
  console.log(`🔧 Test with futures: ES, NQ, YM, RTY, CL, GC, SI, NG, ZN, 6E, 6J`);
  console.log(`📱 Frontend: http://localhost:5173/analytics`);
});