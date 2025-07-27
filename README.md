# 🚀 NexusTradeAI - Advanced Trading Analytics Platform

A sophisticated trading analytics platform featuring 11 unique strategy-specific visualizations and 13 ML models with real-time data streaming via WebSocket.

## ✨ Features

### 🎯 **11 Strategy-Specific Charts**
Each chart represents what that specific strategy actually does - no generic charts, only strategy-specific visualizations:

1. **Cumulative Delta Flow** - Real-time delta analysis with buy/sell pressure visualization
2. **Liquidation Detection** - Live liquidation zone scanning with risk assessment
3. **Momentum Breakout** - Dynamic momentum analysis with breakout detection
4. **Delta Divergence** - Advanced divergence analysis with signal generation
5. **HVN Rejection** - High Volume Node rejection scanning
6. **Liquidity Absorption** - Real-time liquidity absorption monitoring
7. **Liquidity Traps** - Live trap detection with visual alerts
8. **Iceberg Detection** - Hidden order detection and analysis
9. **Stop Run Anticipation** - Stop loss anticipation with risk metrics
10. **LVN Breakout** - Low Volume Node breakout analysis
11. **Volume Imbalance** - Trader-friendly volume imbalance with timeframe selection

### 🤖 **13 ML Models**
Real-time machine learning model performance and predictions:

- **LSTM** - Long Short-Term Memory for time series prediction
- **Transformer** - Attention-based sequence modeling
- **CNN1D** - Convolutional Neural Network for 1D data
- **CatBoost** - Gradient boosting on decision trees
- **LightGBM** - Light Gradient Boosting Machine
- **XGBoost** - Extreme Gradient Boosting
- **TabNet** - Deep learning for tabular data
- **Volatility Hybrid** - Hybrid volatility modeling
- **Uncertainty** - Uncertainty quantification models
- **Regime Detector** - Market regime detection
- **Ensemble Meta** - Meta-learning ensemble methods
- **Autoencoder** - Dimensionality reduction and feature learning
- **Bayesian Risk** - Bayesian risk assessment models

### 🔌 **Real-Time Data Streaming**
- **WebSocket Integration** - Centralized WebSocket service for all data
- **Live Trading Data** - Real-time data from trading bot
- **Auto-Reconnection** - Robust connection handling with exponential backoff
- **Connection Status** - Visual indicators for all components

### 🎨 **Modern UI/UX**
- **Professional Dashboard** - Clean, trader-friendly interface
- **Responsive Design** - Works on all devices
- **Dark Theme** - Professional trading platform aesthetic
- **Interactive Charts** - SVG-based custom visualizations
- **Real-Time Updates** - Live data without page refresh

## 🏗️ Architecture

```
NexusTradeAI/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── pages/         # Main application pages
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API and WebSocket services
│   │   └── contexts/      # React contexts
│   └── package.json
├── server/                 # Node.js Backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── models/            # Database models
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Trading bot with WebSocket data stream

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/NEXUS-aisys/dashborad-.git
cd dashborad-
```

2. **Install dependencies**
```bash
# Install all dependencies (client + server)
npm run install:all

# Or install separately:
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

3. **Start the development servers**
```bash
# Start both client and server simultaneously
npm run dev

# Or start separately:
# Terminal 1 - Frontend (Port 5175)
cd client
npm run dev

# Terminal 2 - Backend (Port 3000)
cd server
npm start
```

4. **Access the application**
- Frontend: http://localhost:5175
- Backend API: http://localhost:3000

## 🔧 Configuration

### WebSocket Connection
The platform connects to your trading bot via WebSocket at `ws://localhost:3000/trading-data`. Ensure your trading bot is running and streaming data in the expected format.

### Environment Variables
Create `.env` files in both `client/` and `server/` directories:

```env
# Client .env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000

# Server .env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## 📊 Data Flow

1. **Trading Bot** → WebSocket → **Backend Server**
2. **Backend Server** → WebSocket → **Frontend Components**
3. **Frontend** → Real-time updates → **Strategy Charts & ML Models**

## 🎯 Strategy Implementation

Each strategy chart is implemented as a React component that:
- Subscribes to specific WebSocket data streams
- Displays real-time metrics and visualizations
- Shows connection status indicators
- Provides trader-friendly interfaces

## 🤖 ML Model Integration

ML models are displayed as cards showing:
- Real-time accuracy, precision, recall, F1-score
- Current trading signals and confidence levels
- Model status and performance metrics
- Live predictions and risk assessments

## 🔒 Security Features

- JWT-based authentication
- Secure WebSocket connections
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🛠️ Development

### Adding New Strategies
1. Create new component in `client/src/pages/AdvancedCharts.jsx`
2. Add WebSocket subscription for strategy data
3. Implement strategy-specific visualization
4. Add to strategies array and selector

### Adding New ML Models
1. Add model to `client/src/pages/MLModels.jsx`
2. Configure WebSocket subscription
3. Display model metrics and predictions

## 📈 Performance

- **Real-time Updates**: < 100ms latency
- **WebSocket Efficiency**: Single connection for all data
- **Component Optimization**: React.memo and useMemo usage
- **Bundle Size**: Optimized with Vite

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React, Node.js, and WebSocket technology
- Designed for professional traders and quantitative analysts
- Inspired by modern trading platform interfaces

---

**🎯 Ready for professional trading analytics with real-time data streaming!**
