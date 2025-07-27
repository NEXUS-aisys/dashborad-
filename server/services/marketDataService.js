const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;

class MarketDataService {
  constructor() {
    this.providers = {
      yahoo: {
        name: 'Yahoo Finance',
        enabled: true,
        priority: 1
      },
      alphaVantage: {
        name: 'Alpha Vantage',
        enabled: !!process.env.ALPHA_VANTAGE_API_KEY,
        priority: 2,
        apiKey: process.env.ALPHA_VANTAGE_API_KEY
      },
      finnhub: {
        name: 'Finnhub',
        enabled: !!process.env.FINNHUB_API_KEY,
        priority: 3,
        apiKey: process.env.FINNHUB_API_KEY
      },
      polygon: {
        name: 'Polygon.io',
        enabled: !!process.env.POLYGON_API_KEY,
        priority: 4,
        apiKey: process.env.POLYGON_API_KEY
      },
      iex: {
        name: 'IEX Cloud',
        enabled: !!process.env.IEX_API_KEY,
        priority: 5,
        apiKey: process.env.IEX_API_KEY
      }
    };
    
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
  }

  // Get market data from multiple providers with fallback
  async getMarketData(symbol, period = '1mo') {
    const cacheKey = `${symbol}_${period}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Handle futures contracts
    const isFutures = this.isFuturesContract(symbol);
    if (isFutures) {
      return await this.getFuturesData(symbol, period);
    }

    // Try providers in priority order
    const sortedProviders = Object.entries(this.providers)
      .filter(([_, config]) => config.enabled)
      .sort((a, b) => a[1].priority - b[1].priority);

    for (const [providerName, config] of sortedProviders) {
      try {
        const data = await this.fetchFromProvider(providerName, symbol, period);
        if (data) {
          // Cache the result
          this.cache.set(cacheKey, {
            timestamp: Date.now(),
            data: { ...data, provider: providerName }
          });
          return data;
        }
      } catch (error) {
        console.error(`Error fetching from ${providerName}:`, error.message);
        continue;
      }
    }

    throw new Error('All market data providers failed');
  }

  // Check if symbol is a futures contract
  isFuturesContract(symbol) {
    const futuresPatterns = [
      /^[A-Z]{1,2}\d{1,2}$/, // ES, NQ, YM, RTY, CL, GC, etc.
      /^[A-Z]{1,2}\d{4}$/,   // ES24, NQ24, etc.
      /^[A-Z]{1,2}[A-Z]\d{2}$/, // ESZ24, NQH25, etc.
      /^[A-Z]{1,2}\d{2}[A-Z]$/, // ES24Z, NQ25H, etc.
    ];
    
    return futuresPatterns.some(pattern => pattern.test(symbol.toUpperCase()));
  }

  // Get futures data
  async getFuturesData(symbol, period = '1mo') {
    try {
      // Try Yahoo Finance first (supports some futures)
      const data = await this.fetchFromYahoo(symbol, period);
      if (data) {
        return { ...data, provider: 'yahoo', instrumentType: 'futures' };
      }
    } catch (error) {
      console.log(`Yahoo Finance failed for futures ${symbol}, trying alternative sources`);
    }

    // For futures, we'll use a combination of sources
    const futuresData = await this.generateFuturesData(symbol);
    return { ...futuresData, provider: 'futures_synthetic', instrumentType: 'futures' };
  }

  // Generate synthetic futures data (for demonstration)
  async generateFuturesData(symbol, period = '1mo') {
    const basePrice = this.getBasePriceForFutures(symbol);
    const volatility = this.getVolatilityForFutures(symbol);
    
    // Generate historical data
    const historical = [];
    const now = new Date();
    const days = period === '1mo' ? 30 : period === '3mo' ? 90 : 7;
    
    for (let i = days; i >= 0; i--) {
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

    return {
      symbol: symbol.toUpperCase(),
      currentPrice,
      change,
      changePercent,
      volume: historical[historical.length - 1].volume,
      historical,
      instrumentType: 'futures',
      contractInfo: this.getFuturesContractInfo(symbol)
    };
  }

  // Get base price for futures contracts
  getBasePriceForFutures(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    // E-mini S&P 500
    if (symbolUpper.startsWith('ES')) return 4800;
    // E-mini NASDAQ-100
    if (symbolUpper.startsWith('NQ')) return 16500;
    // E-mini Dow Jones
    if (symbolUpper.startsWith('YM')) return 38000;
    // E-mini Russell 2000
    if (symbolUpper.startsWith('RTY')) return 2000;
    // Crude Oil
    if (symbolUpper.startsWith('CL')) return 75;
    // Gold
    if (symbolUpper.startsWith('GC')) return 2000;
    // Silver
    if (symbolUpper.startsWith('SI')) return 25;
    // Natural Gas
    if (symbolUpper.startsWith('NG')) return 3;
    // 10-Year Treasury Note
    if (symbolUpper.startsWith('ZN')) return 110;
    // Euro FX
    if (symbolUpper.startsWith('6E')) return 1.08;
    // Japanese Yen
    if (symbolUpper.startsWith('6J')) return 0.007;
    
    return 100; // Default
  }

  // Get volatility for futures contracts
  getVolatilityForFutures(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    // High volatility
    if (symbolUpper.startsWith('NQ')) return 0.03;
    if (symbolUpper.startsWith('RTY')) return 0.025;
    
    // Medium volatility
    if (symbolUpper.startsWith('ES')) return 0.02;
    if (symbolUpper.startsWith('CL')) return 0.025;
    if (symbolUpper.startsWith('GC')) return 0.015;
    
    // Lower volatility
    if (symbolUpper.startsWith('YM')) return 0.015;
    if (symbolUpper.startsWith('ZN')) return 0.01;
    if (symbolUpper.startsWith('6E')) return 0.012;
    if (symbolUpper.startsWith('6J')) return 0.01;
    
    return 0.02; // Default
  }

  // Get futures contract information
  getFuturesContractInfo(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    const contractInfo = {
      'ES': { name: 'E-mini S&P 500', exchange: 'CME', tickSize: 0.25, tickValue: 12.50 },
      'NQ': { name: 'E-mini NASDAQ-100', exchange: 'CME', tickSize: 0.25, tickValue: 5.00 },
      'YM': { name: 'E-mini Dow Jones', exchange: 'CBOT', tickSize: 1.00, tickValue: 5.00 },
      'RTY': { name: 'E-mini Russell 2000', exchange: 'CME', tickSize: 0.10, tickValue: 5.00 },
      'CL': { name: 'Crude Oil', exchange: 'NYMEX', tickSize: 0.01, tickValue: 10.00 },
      'GC': { name: 'Gold', exchange: 'COMEX', tickSize: 0.10, tickValue: 10.00 },
      'SI': { name: 'Silver', exchange: 'COMEX', tickSize: 0.005, tickValue: 25.00 },
      'NG': { name: 'Natural Gas', exchange: 'NYMEX', tickSize: 0.001, tickValue: 10.00 },
      'ZN': { name: '10-Year Treasury Note', exchange: 'CBOT', tickSize: 0.015625, tickValue: 15.625 },
      '6E': { name: 'Euro FX', exchange: 'CME', tickSize: 0.0001, tickValue: 12.50 },
      '6J': { name: 'Japanese Yen', exchange: 'CME', tickSize: 0.000001, tickValue: 12.50 }
    };

    // Find the base contract
    for (const [base, info] of Object.entries(contractInfo)) {
      if (symbolUpper.startsWith(base)) {
        return {
          ...info,
          symbol: symbolUpper,
          contractSize: this.getContractSize(symbolUpper),
          margin: this.getMarginRequirement(symbolUpper)
        };
      }
    }

    return {
      name: 'Unknown Futures Contract',
      exchange: 'Unknown',
      tickSize: 0.01,
      tickValue: 10.00,
      symbol: symbolUpper
    };
  }

  // Get contract size
  getContractSize(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    if (symbolUpper.startsWith('ES')) return 50; // $50 × S&P 500 Index
    if (symbolUpper.startsWith('NQ')) return 20; // $20 × NASDAQ-100 Index
    if (symbolUpper.startsWith('YM')) return 5;  // $5 × Dow Jones Index
    if (symbolUpper.startsWith('RTY')) return 50; // $50 × Russell 2000 Index
    if (symbolUpper.startsWith('CL')) return 1000; // 1,000 barrels
    if (symbolUpper.startsWith('GC')) return 100; // 100 troy ounces
    if (symbolUpper.startsWith('SI')) return 5000; // 5,000 troy ounces
    if (symbolUpper.startsWith('NG')) return 10000; // 10,000 MMBtu
    if (symbolUpper.startsWith('ZN')) return 100000; // $100,000 face value
    if (symbolUpper.startsWith('6E')) return 125000; // €125,000
    if (symbolUpper.startsWith('6J')) return 12500000; // ¥12,500,000
    
    return 1000; // Default
  }

  // Get margin requirement
  getMarginRequirement(symbol) {
    const symbolUpper = symbol.toUpperCase();
    
    if (symbolUpper.startsWith('ES')) return 12000; // $12,000
    if (symbolUpper.startsWith('NQ')) return 15000; // $15,000
    if (symbolUpper.startsWith('YM')) return 8000;  // $8,000
    if (symbolUpper.startsWith('RTY')) return 8000; // $8,000
    if (symbolUpper.startsWith('CL')) return 5000;  // $5,000
    if (symbolUpper.startsWith('GC')) return 8000;  // $8,000
    if (symbolUpper.startsWith('SI')) return 10000; // $10,000
    if (symbolUpper.startsWith('NG')) return 3000;  // $3,000
    if (symbolUpper.startsWith('ZN')) return 2000;  // $2,000
    if (symbolUpper.startsWith('6E')) return 3000;  // $3,000
    if (symbolUpper.startsWith('6J')) return 3000;  // $3,000
    
    return 5000; // Default
  }

  async fetchFromProvider(providerName, symbol, period) {
    switch (providerName) {
      case 'yahoo':
        return this.fetchFromYahoo(symbol, period);
      case 'alphaVantage':
        return this.fetchFromAlphaVantage(symbol, period);
      case 'finnhub':
        return this.fetchFromFinnhub(symbol, period);
      case 'polygon':
        return this.fetchFromPolygon(symbol, period);
      case 'iex':
        return this.fetchFromIEX(symbol, period);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  async fetchFromYahoo(symbol, period) {
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
        dividendYield: quote.dividendYield,
        beta: quote.beta,
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
      throw new Error(`Yahoo Finance error: ${error.message}`);
    }
  }

  async fetchFromAlphaVantage(symbol, period) {
    try {
      const apiKey = this.providers.alphaVantage.apiKey;
      const [quoteResponse, historicalResponse] = await Promise.all([
        axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`),
        axios.get(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`)
      ]);

      const quote = quoteResponse.data['Global Quote'];
      const timeSeries = historicalResponse.data['Time Series (Daily)'];

      if (!quote || !timeSeries) {
        throw new Error('Invalid response from Alpha Vantage');
      }

      const historical = Object.entries(timeSeries)
        .slice(0, 30)
        .map(([date, data]) => ({
          date: new Date(date),
          open: parseFloat(data['1. open']),
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          close: parseFloat(data['4. close']),
          volume: parseInt(data['5. volume'])
        }))
        .reverse();

      return {
        symbol: quote['01. symbol'],
        currentPrice: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        historical
      };
    } catch (error) {
      throw new Error(`Alpha Vantage error: ${error.message}`);
    }
  }

  async fetchFromFinnhub(symbol, period) {
    try {
      const apiKey = this.providers.finnhub.apiKey;
      const [quoteResponse, historicalResponse] = await Promise.all([
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
        axios.get(`https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60}&to=${Math.floor(Date.now() / 1000)}&token=${apiKey}`)
      ]);

      const quote = quoteResponse.data;
      const historical = historicalResponse.data;

      if (historical.s !== 'ok') {
        throw new Error('Invalid response from Finnhub');
      }

      const historicalData = historical.t.map((timestamp, index) => ({
        date: new Date(timestamp * 1000),
        open: historical.o[index],
        high: historical.h[index],
        low: historical.l[index],
        close: historical.c[index],
        volume: historical.v[index]
      }));

      return {
        symbol,
        currentPrice: quote.c,
        change: quote.d,
        changePercent: quote.dp,
        volume: quote.v,
        historical: historicalData
      };
    } catch (error) {
      throw new Error(`Finnhub error: ${error.message}`);
    }
  }

  async fetchFromPolygon(symbol, period) {
    try {
      const apiKey = this.providers.polygon.apiKey;
      const [quoteResponse, historicalResponse] = await Promise.all([
        axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`),
        axios.get(`https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}/${new Date().toISOString().split('T')[0]}?adjusted=true&sort=asc&apiKey=${apiKey}`)
      ]);

      const quote = quoteResponse.data.results[0];
      const historical = historicalResponse.data.results;

      return {
        symbol,
        currentPrice: quote.c,
        change: quote.c - quote.o,
        changePercent: ((quote.c - quote.o) / quote.o) * 100,
        volume: quote.v,
        historical: historical.map(d => ({
          date: new Date(d.t),
          open: d.o,
          high: d.h,
          low: d.l,
          close: d.c,
          volume: d.v
        }))
      };
    } catch (error) {
      throw new Error(`Polygon error: ${error.message}`);
    }
  }

  async fetchFromIEX(symbol, period) {
    try {
      const apiKey = this.providers.iex.apiKey;
      const [quoteResponse, historicalResponse] = await Promise.all([
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${apiKey}`),
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/chart/1m?token=${apiKey}`)
      ]);

      const quote = quoteResponse.data;
      const historical = historicalResponse.data;

      return {
        symbol: quote.symbol,
        currentPrice: quote.latestPrice,
        change: quote.change,
        changePercent: quote.changePercent * 100,
        volume: quote.latestVolume,
        marketCap: quote.marketCap,
        pe: quote.peRatio,
        historical: historical.map(d => ({
          date: new Date(d.date),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume
        }))
      };
    } catch (error) {
      throw new Error(`IEX error: ${error.message}`);
    }
  }

  // Get provider status
  getProviderStatus() {
    return Object.entries(this.providers).map(([name, config]) => ({
      name,
      displayName: config.name,
      enabled: config.enabled,
      priority: config.priority,
      hasApiKey: !!config.apiKey
    }));
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout
    };
  }
}

module.exports = new MarketDataService();