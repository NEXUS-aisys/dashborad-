module.exports = {
  // Yahoo Finance (Free, no API key required)
  yahoo: {
    name: 'Yahoo Finance',
    enabled: true,
    priority: 1,
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 1000
    },
    features: ['quotes', 'historical', 'fundamentals']
  },

  // Alpha Vantage (Free tier: 5 requests per minute, 500 per day)
  alphaVantage: {
    name: 'Alpha Vantage',
    enabled: !!process.env.ALPHA_VANTAGE_API_KEY,
    priority: 2,
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
    baseUrl: 'https://www.alphavantage.co/query',
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerHour: 500
    },
    features: ['quotes', 'historical', 'fundamentals', 'technical_indicators']
  },

  // Finnhub (Free tier: 60 requests per minute)
  finnhub: {
    name: 'Finnhub',
    enabled: !!process.env.FINNHUB_API_KEY,
    priority: 3,
    apiKey: process.env.FINNHUB_API_KEY,
    baseUrl: 'https://finnhub.io/api/v1',
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600
    },
    features: ['quotes', 'historical', 'news', 'sentiment']
  },

  // Polygon.io (Free tier: 5 requests per minute)
  polygon: {
    name: 'Polygon.io',
    enabled: !!process.env.POLYGON_API_KEY,
    priority: 4,
    apiKey: process.env.POLYGON_API_KEY,
    baseUrl: 'https://api.polygon.io',
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerHour: 300
    },
    features: ['quotes', 'historical', 'fundamentals', 'options']
  },

  // IEX Cloud (Free tier: 50,000 messages per month)
  iex: {
    name: 'IEX Cloud',
    enabled: !!process.env.IEX_API_KEY,
    priority: 5,
    apiKey: process.env.IEX_API_KEY,
    baseUrl: 'https://cloud.iexapis.com/stable',
    rateLimit: {
      requestsPerMinute: 100,
      requestsPerHour: 6000
    },
    features: ['quotes', 'historical', 'fundamentals', 'news']
  },

  // Twelve Data (Free tier: 800 requests per day)
  twelveData: {
    name: 'Twelve Data',
    enabled: !!process.env.TWELVE_DATA_API_KEY,
    priority: 6,
    apiKey: process.env.TWELVE_DATA_API_KEY,
    baseUrl: 'https://api.twelvedata.com',
    rateLimit: {
      requestsPerMinute: 8,
      requestsPerHour: 800
    },
    features: ['quotes', 'historical', 'technical_indicators']
  },

  // MarketStack (Free tier: 1,000 requests per month)
  marketStack: {
    name: 'MarketStack',
    enabled: !!process.env.MARKETSTACK_API_KEY,
    priority: 7,
    apiKey: process.env.MARKETSTACK_API_KEY,
    baseUrl: 'http://api.marketstack.com/v1',
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerHour: 100
    },
    features: ['quotes', 'historical', 'intraday']
  },

  // RapidAPI - Alpha Vantage (Alternative endpoint)
  rapidApiAlphaVantage: {
    name: 'RapidAPI Alpha Vantage',
    enabled: !!process.env.RAPIDAPI_KEY,
    priority: 8,
    apiKey: process.env.RAPIDAPI_KEY,
    baseUrl: 'https://alpha-vantage.p.rapidapi.com',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'alpha-vantage.p.rapidapi.com'
    },
    rateLimit: {
      requestsPerMinute: 5,
      requestsPerHour: 500
    },
    features: ['quotes', 'historical', 'technical_indicators']
  },

  // Configuration for fallback behavior
  fallback: {
    enabled: true,
    maxRetries: 3,
    retryDelay: 1000, // milliseconds
    timeout: 10000, // milliseconds
  },

  // Cache configuration
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000, // maximum number of cached items
    cleanupInterval: 10 * 60 * 1000 // 10 minutes
  },

  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // maximum requests per window
  },

  // Error handling configuration
  errorHandling: {
    maxConsecutiveFailures: 3,
    failureTimeout: 5 * 60 * 1000, // 5 minutes
    circuitBreakerEnabled: true
  }
};