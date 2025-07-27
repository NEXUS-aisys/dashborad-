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