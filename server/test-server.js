const express = require('express');
const cors = require('cors');
const marketDataService = require('./services/marketDataService');
const technicalIndicatorsService = require('./services/technicalIndicatorsService');
const tradeSignalsService = require('./services/tradeSignalsService');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Trade Signals Server Running' });
});

// Market data providers status
app.get('/api/trading/market/providers', (req, res) => {
  try {
    const providers = marketDataService.getProviderStatus();
    const cacheStats = marketDataService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        providers,
        cache: cacheStats
      }
    });
  } catch (error) {
    console.error('Error fetching provider status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch provider status',
      error: error.message
    });
  }
});

// Clear cache
app.post('/api/trading/market/clear-cache', (req, res) => {
  try {
    marketDataService.clearCache();
    
    res.json({
      success: true,
      message: 'Market data cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// Calculate indicators
app.post('/api/trading/indicators/calculate', (req, res) => {
  try {
    const { historicalData } = req.body;
    
    if (!historicalData || !Array.isArray(historicalData)) {
      return res.status(400).json({
        success: false,
        message: 'Historical data array is required'
      });
    }

    const indicators = technicalIndicatorsService.calculateAllIndicators(historicalData);
    const signals = technicalIndicatorsService.generateSignals(indicators);
    
    res.json({
      success: true,
      data: {
        indicators,
        signals
      }
    });
  } catch (error) {
    console.error('Error calculating indicators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate indicators',
      error: error.message
    });
  }
});

// Get indicator signals for a symbol
app.get('/api/trading/indicators/signals/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1mo' } = req.query;
    
    // Get market data
    marketDataService.getMarketData(symbol, period)
      .then(marketData => {
        // Calculate indicators
        const indicators = technicalIndicatorsService.calculateAllIndicators(marketData.historical);
        const signals = technicalIndicatorsService.generateSignals(indicators);
        
        res.json({
          success: true,
          data: {
            symbol: symbol.toUpperCase(),
            indicators,
            signals,
            timestamp: new Date().toISOString()
          }
        });
      })
      .catch(error => {
        console.error('Error fetching market data:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch market data',
          error: error.message
        });
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

// Get trade signals for a symbol
app.get('/api/trading/signals/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const { refresh = false } = req.query;
    
    tradeSignalsService.generateTradeSignals(symbol)
      .then(signals => {
        res.json({
          success: true,
          data: signals
        });
      })
      .catch(error => {
        console.error('Error generating trade signals:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate trade signals',
          error: error.message
        });
      });
  } catch (error) {
    console.error('Error in trade signals endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
});

// Get batch signals
app.post('/api/trading/signals/batch', (req, res) => {
  try {
    const { symbols } = req.body;
    
    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        message: 'Symbols array is required'
      });
    }

    tradeSignalsService.getBatchSignals(symbols)
      .then(signals => {
        res.json({
          success: true,
          data: signals
        });
      })
      .catch(error => {
        console.error('Error generating batch signals:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to generate batch signals',
          error: error.message
        });
      });
  } catch (error) {
    console.error('Error in batch signals endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request',
      error: error.message
    });
  }
});

// Performance metrics (mock)
app.get('/api/trading/signals/performance', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching signal performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signal performance',
      error: error.message
    });
  }
});

// Watchlist (mock)
app.get('/api/trading/signals/watchlist', (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching signal watchlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch signal watchlist',
      error: error.message
    });
  }
});

// Add to watchlist (mock)
app.post('/api/trading/signals/:symbol/watch', (req, res) => {
  try {
    const { symbol } = req.params;
    const { alertPrice, alertType = 'price' } = req.body;

    const watchItem = {
      symbol: symbol.toUpperCase(),
      alertPrice: parseFloat(alertPrice),
      alertType,
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: watchItem,
      message: `Signal watch added for ${symbol.toUpperCase()}`
    });
  } catch (error) {
    console.error('Error adding signal watch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add signal watch',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trade Signals Test Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Market providers: http://localhost:${PORT}/api/trading/market/providers`);
  console.log(`🎯 Trade signals: http://localhost:${PORT}/api/trading/signals/ES`);
  console.log(`🔧 Test with futures: ES, NQ, YM, RTY, CL, GC, SI, NG, ZN, 6E, 6J`);
});