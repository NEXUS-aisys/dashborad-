class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.subscribers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    try {
      // Check if already connected
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket('ws://localhost:3000/trading-data');
      
      this.ws.onopen = () => {
        console.log('✅ Connected to trading data WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to all data types
        this.subscribeToAllData();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('❌ Disconnected from trading data WebSocket');
        this.isConnected = false;
        // Only reconnect if not manually disconnected
        if (this.ws) {
          this.handleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
      };
      
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  subscribeToAllData() {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('WebSocket not ready for subscription');
      return;
    }

    try {
      // Subscribe to all strategy data
      const strategies = [
        'cumulative-delta',
        'liquidation-detection', 
        'momentum-breakout',
        'delta-divergence',
        'hvn-rejection',
        'liquidity-absorption',
        'liquidity-traps',
        'iceberg-detection',
        'stop-run-anticipation',
        'lvn-breakout',
        'volume-imbalance'
      ];

      // Subscribe to ML model data
      const mlModels = [
        'lstm',
        'transformer',
        'cnn1d',
        'catboost',
        'lightgbm',
        'xgboost',
        'tabnet',
        'volatility-hybrid',
        'uncertainty',
        'regime-detector',
        'ensemble-meta',
        'autoencoder',
        'bayesian-risk'
      ];

      // Subscribe to all data types
      const subscriptions = [
        ...strategies.map(strategy => ({ type: 'strategy', name: strategy })),
        ...mlModels.map(model => ({ type: 'ml', name: model })),
        { type: 'market-data', name: 'general' },
        { type: 'volume-data', name: 'general' },
        { type: 'price-data', name: 'general' }
      ];

      subscriptions.forEach(sub => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'subscribe',
            dataType: sub.type,
            name: sub.name
          }));
        }
      });
    } catch (error) {
      console.error('Error subscribing to data:', error);
    }
  }

  handleMessage(data) {
    const { type, strategy, mlModel, marketData, volumeData, priceData, timestamp } = data;

    switch (type) {
      case 'strategy_data':
        this.notifySubscribers('strategy', strategy, data);
        break;
      
      case 'ml_data':
        this.notifySubscribers('ml', mlModel, data);
        break;
      
      case 'market_data':
        this.notifySubscribers('market', 'general', data);
        break;
      
      case 'volume_data':
        this.notifySubscribers('volume', 'general', data);
        break;
      
      case 'price_data':
        this.notifySubscribers('price', 'general', data);
        break;
      
      default:
        console.log('Unknown message type:', type);
    }
  }

  subscribe(dataType, name, callback) {
    const key = `${dataType}-${name}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  notifySubscribers(dataType, name, data) {
    const key = `${dataType}-${name}`;
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.subscribers.clear();
    this.reconnectAttempts = 0;
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 