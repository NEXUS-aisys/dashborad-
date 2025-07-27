const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  setAuthToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Get latest trading signals
  async getLatestSignals() {
    return this.request('/signals/latest');
  }

  // Get portfolio data
  async getPortfolio() {
    return this.request('/portfolio');
  }

  // Get market data for a symbol
  async getMarketData(symbol) {
    return this.request(`/market/${symbol}`);
  }

  // Get recent trades
  async getRecentTrades(params) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/trades/recent?${query}`);
  }

  // Get subscription
  async getSubscription() {
    return this.request('/subscription');
  }

  // Create subscription
  async createSubscription() {
    return this.request('/subscribe', { method: 'POST' });
  }

  // Activate Telegram notifications for user
  async activateTelegramNotifications(phoneNumber) {
    return this.request('/telegram/activate', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber })
    });
  }

  // Get user's Telegram activation status
  async getTelegramActivationStatus() {
    return this.request('/telegram/activation-status');
  }

  // Admin: Test Telegram connection
  async testTelegramConnection(botToken, chatId) {
    return this.request('/telegram/test', {
      method: 'POST',
      body: JSON.stringify({ botToken, chatId })
    });
  }

  // Admin: Send test signal
  async sendTestTelegramSignal() {
    return this.request('/telegram/test-signal', {
      method: 'POST'
    });
  }

  // WebSocket connection for real-time updates
  connectWebSocket() {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Emit custom events for different data types
      window.dispatchEvent(new CustomEvent('realtime-update', { detail: data }));
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt reconnection after 3 seconds
      setTimeout(() => this.connectWebSocket(), 3000);
    };
    
    return ws;
  }
}

export default new ApiService(); 