// Load environment variables
require("dotenv").config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./utils/config');
const verifyAuth = require('./utils/verifyAuth');
const SupabaseService = require('./services/supabaseService');
const StripeService = require('./services/stripeService');
const { initWebSocket, broadcast } = require('./services/websocket');
const yahooFinance = require('yahoo-finance2').default;
const telegramRoutes = require('./routes/telegramRoutes');

// Only import Stripe if properly configured
let stripe = null;
if (config.STRIPE_SECRET_KEY && config.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
  const Stripe = require('stripe');
  stripe = new Stripe(config.STRIPE_SECRET_KEY);
}

const app = express();
const server = http.createServer(app);

initWebSocket(server);

app.use(cors());
app.use(express.json());

// Telegram routes
app.use('/api/telegram', telegramRoutes);

// Auth route (just validation, since Supabase handles auth)
app.get('/api/auth', verifyAuth, (req, res) => res.json({ user: req.user }));

// Receive ML bot signals
app.post('/api/signals', async (req, res) => {
  if (req.headers['x-api-key'] !== config.ML_BOT_API_KEY) return res.status(403).json({ error: 'Invalid API key' });
  const { strategy, signal, confidence, symbol, price, target, stopLoss } = req.body;
  // Assuming userId from bot or default
  const userId = 'default-user'; // Adjust as needed
  try {
    const signalData = {
      strategy,
      signal,
      confidence,
      symbol: symbol || 'UNKNOWN',
      price: price || 0,
      target: target || 0,
      stopLoss: stopLoss || 0,
      timestamp: new Date().toISOString()
    };
    
    const data = await SupabaseService.insertSignal(userId, strategy, signal, confidence);
    
    // Broadcast to WebSocket clients
    broadcast({ type: 'new_signal', data: signalData });
    
    // Send Telegram notifications to all activated users
    try {
      const telegramService = require('./services/telegramService');
      await telegramService.sendTradingSignal(signalData);
    } catch (telegramError) {
      console.error('Telegram notification failed:', telegramError);
      // Don't fail the main request if Telegram fails
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest signals
app.get('/api/signals/latest', verifyAuth, async (req, res) => {
  try {
    const data = await SupabaseService.getLatestSignals(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch Yahoo Finance data
app.get('/api/market/:symbol', verifyAuth, async (req, res) => {
  const { symbol } = req.params;
  try {
    const end = new Date();
    const start = new Date(end - 7 * 24 * 60 * 60 * 1000);
    const quote = await yahooFinance.historical(symbol, { period1: start, period2: end });
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historical data endpoint for backtesting
app.get('/api/market/historical/:symbol', verifyAuth, async (req, res) => {
  const { symbol } = req.params;
  const { start, end } = req.query;
  
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const historicalData = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    res.json(historicalData);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({ error: 'Failed to fetch historical data' });
  }
});

// Get portfolio
app.get('/api/portfolio', verifyAuth, async (req, res) => {
  try {
    const data = await SupabaseService.getPortfolio(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent trades
app.get('/api/trades/recent', verifyAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const data = await SupabaseService.getRecentTrades(req.user.id, parseInt(limit));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get subscription
app.get('/api/subscription', verifyAuth, async (req, res) => {
  try {
    const data = await SupabaseService.getSubscription(req.user.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe
app.post('/api/subscribe', verifyAuth, async (req, res) => {
  try {
    const session = await StripeService.createCheckoutSession(req.user.id, req.user.email);
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(400).send('Stripe not configured');
  }
  
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, config.STRIPE_WEBHOOK_SECRET);
    await StripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
