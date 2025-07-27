import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Target, 
  Zap, 
  BarChart3, 
  Activity,
  RefreshCw,
  Lightbulb,
  Shield,
  DollarSign,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  HelpCircle,
  Info,
  Eye,
  BarChart,
  PieChart,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useSymbol } from '../contexts/SymbolContext';
import mlBotService from '../services/mlBotService';
import apiService from '../services/apiService';
import tradingService from '../services/tradingService';

const AIInsights = () => {
  const { selectedSymbol } = useSymbol();
  const [insights, setInsights] = useState([]);
  const [marketSentiment, setMarketSentiment] = useState({ overall: 0, portfolio: 0 });
  const [mlPredictions, setMlPredictions] = useState({});
  const [tradingSignals, setTradingSignals] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [botConnected, setBotConnected] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load all insights data
  const loadInsightsData = async () => {
    setIsLoading(true);
    try {
      // Check bot connection
      const botStatus = await mlBotService.checkBotStatus();
      setBotConnected(botStatus);

      // Load ML predictions for all models
      const modelIds = ['cnn1d', 'lstm', 'transformer', 'catboost', 'lightgbm', 'xgboost'];
      const predictions = {};
      
      for (const modelId of modelIds) {
        try {
          const prediction = await mlBotService.getModelPrediction(modelId, selectedSymbol || 'BTC');
          if (prediction) {
            predictions[modelId] = prediction;
          }
        } catch (error) {
          console.error(`Error loading prediction for ${modelId}:`, error);
        }
      }
      setMlPredictions(predictions);

      // Load trading signals
      try {
        const signals = await tradingService.getTradingSignals([selectedSymbol || 'BTC']);
        setTradingSignals(signals || []);
      } catch (error) {
        console.error('Error loading trading signals:', error);
      }

      // Load portfolio data
      try {
        const portfolio = await tradingService.getPortfolio();
        setPortfolioData(portfolio);
      } catch (error) {
        console.error('Error loading portfolio:', error);
      }

      // Generate intelligent insights
      generateInsights(predictions, signals, portfolio);
      
      // Calculate market sentiment
      calculateMarketSentiment(predictions, signals, portfolio);

    } catch (error) {
      console.error('Error loading insights data:', error);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date());
    }
  };

  // Generate intelligent insights based on data
  const generateInsights = (predictions, signals, portfolio) => {
    const newInsights = [];

    // Analyze ML model consensus
    const bullishModels = Object.values(predictions).filter(p => 
      p.signal && p.signal.toLowerCase().includes('bullish')
    ).length;
    const bearishModels = Object.values(predictions).filter(p => 
      p.signal && p.signal.toLowerCase().includes('bearish')
    ).length;
    const totalModels = Object.keys(predictions).length;

    if (bullishModels > totalModels * 0.6) {
      newInsights.push({
        type: 'opportunity',
        title: 'Strong ML Consensus - Bullish',
        description: `${bullishModels}/${totalModels} ML models showing bullish signals for ${selectedSymbol || 'BTC'}`,
        confidence: Math.round((bullishModels / totalModels) * 100),
        action: 'Consider increasing position',
        icon: TrendingUp,
        color: 'text-green-500',
        priority: 'high',
        explanation: `When more than 60% of our ML models agree on a bullish signal, it indicates strong market confidence. This is a high-probability trading opportunity.`
      });
    } else if (bearishModels > totalModels * 0.6) {
      newInsights.push({
        type: 'warning',
        title: 'Strong ML Consensus - Bearish',
        description: `${bearishModels}/${totalModels} ML models showing bearish signals for ${selectedSymbol || 'BTC'}`,
        confidence: Math.round((bearishModels / totalModels) * 100),
        action: 'Consider reducing exposure',
        icon: TrendingDown,
        color: 'text-red-500',
        priority: 'high',
        explanation: `When more than 60% of our ML models agree on a bearish signal, it suggests potential market decline. Consider risk management strategies.`
      });
    }

    // Analyze signal strength
    const strongSignals = signals.filter(s => s.confidence > 80);
    if (strongSignals.length > 0) {
      newInsights.push({
        type: 'strategy',
        title: 'High Confidence Signals Detected',
        description: `${strongSignals.length} trading signals with >80% confidence`,
        confidence: Math.round(strongSignals.reduce((sum, s) => sum + s.confidence, 0) / strongSignals.length),
        action: 'Review signal details',
        icon: Target,
        color: 'text-blue-500',
        priority: 'medium',
        explanation: `High-confidence signals (>80%) have historically shown better accuracy. These signals deserve special attention for potential trades.`
      });
    }

    // Portfolio analysis
    if (portfolio && portfolio.positions) {
      const totalValue = portfolio.totalValue || 0;
      const dailyPnL = portfolio.dailyPnL || 0;
      const dailyPnLPercent = totalValue > 0 ? (dailyPnL / totalValue) * 100 : 0;

      if (dailyPnLPercent > 2) {
        newInsights.push({
          type: 'opportunity',
          title: 'Strong Daily Performance',
          description: `Portfolio up ${dailyPnLPercent.toFixed(2)}% today (+$${dailyPnL.toFixed(2)})`,
          confidence: Math.min(95, 70 + Math.abs(dailyPnLPercent) * 5),
          action: 'Consider taking partial profits',
          icon: DollarSign,
          color: 'text-green-500',
          priority: 'medium',
          explanation: `Your portfolio is performing exceptionally well today. Consider taking partial profits to lock in gains while maintaining exposure.`
        });
      } else if (dailyPnLPercent < -2) {
        newInsights.push({
          type: 'warning',
          title: 'Portfolio Under Pressure',
          description: `Portfolio down ${Math.abs(dailyPnLPercent).toFixed(2)}% today (-$${Math.abs(dailyPnL).toFixed(2)})`,
          confidence: Math.min(95, 70 + Math.abs(dailyPnLPercent) * 5),
          action: 'Review risk management',
          icon: Shield,
          color: 'text-red-500',
          priority: 'high',
          explanation: `Your portfolio is experiencing significant losses today. Review your positions and consider implementing stop-loss orders.`
        });
      }
    }

    // Volatility analysis
    const avgConfidence = Object.values(predictions).reduce((sum, p) => sum + (p.confidence || 0), 0) / Object.keys(predictions).length;
    if (avgConfidence < 60) {
      newInsights.push({
        type: 'warning',
        title: 'High Market Uncertainty',
        description: `Average ML confidence is ${avgConfidence.toFixed(1)}% - market volatility detected`,
        confidence: Math.round(100 - avgConfidence),
        action: 'Reduce position sizes',
        icon: AlertCircle,
        color: 'text-yellow-500',
        priority: 'medium',
        explanation: `Low average confidence across ML models indicates high market uncertainty. This is a sign to reduce position sizes and be more cautious.`
      });
    }

    // Model performance insights
    const topModel = Object.entries(predictions).reduce((best, [model, data]) => 
      (data.confidence || 0) > (best.confidence || 0) ? { model, ...data } : best, {}
    );
    
    if (topModel.model && topModel.confidence > 85) {
      newInsights.push({
        type: 'strategy',
        title: `${topModel.model.toUpperCase()} Leading Performance`,
        description: `${topModel.model} showing ${topModel.confidence}% confidence with ${topModel.signal}`,
        confidence: topModel.confidence,
        action: 'Focus on this model\'s signals',
        icon: Brain,
        color: 'text-purple-500',
        priority: 'medium',
        explanation: `This model is currently showing the highest confidence among all our ML models. Its signals may be more reliable in current market conditions.`
      });
    }

    setInsights(newInsights);
  };

  // Calculate market sentiment
  const calculateMarketSentiment = (predictions, signals, portfolio) => {
    let bullishScore = 0;
    let totalScore = 0;

    // ML predictions sentiment
    Object.values(predictions).forEach(pred => {
      if (pred.signal) {
        const signal = pred.signal.toLowerCase();
        const confidence = pred.confidence || 0;
        
        if (signal.includes('bullish')) {
          bullishScore += confidence;
        } else if (signal.includes('bearish')) {
          bullishScore -= confidence;
        }
        totalScore += confidence;
      }
    });

    // Trading signals sentiment
    signals.forEach(signal => {
      const confidence = signal.confidence || 0;
      if (signal.type === 'BUY') {
        bullishScore += confidence;
      } else if (signal.type === 'SELL') {
        bullishScore -= confidence;
      }
      totalScore += confidence;
    });

    // Portfolio sentiment
    if (portfolio && portfolio.dailyPnL) {
      const pnlPercent = portfolio.totalValue > 0 ? (portfolio.dailyPnL / portfolio.totalValue) * 100 : 0;
      bullishScore += pnlPercent * 10; // Weight portfolio performance
      totalScore += 100;
    }

    const overallSentiment = totalScore > 0 ? Math.max(0, Math.min(100, (bullishScore / totalScore) * 100 + 50)) : 50;
    const portfolioSentiment = portfolio && portfolio.dailyPnL ? 
      Math.max(0, Math.min(100, (portfolio.dailyPnL / Math.max(portfolio.totalValue, 1)) * 1000 + 50)) : 50;

    setMarketSentiment({
      overall: Math.round(overallSentiment),
      portfolio: Math.round(portfolioSentiment)
    });
  };

  // Load data on mount and symbol change
  useEffect(() => {
    loadInsightsData();
  }, [selectedSymbol]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadInsightsData, 30000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-l-red-500';
      case 'medium': return 'border-l-4 border-l-yellow-500';
      case 'low': return 'border-l-4 border-l-blue-500';
      default: return '';
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment >= 70) return 'text-green-500';
    if (sentiment >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment >= 70) return <TrendingUp className="w-4 h-4" />;
    if (sentiment >= 50) return <Minus className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getSentimentLabel = (sentiment) => {
    if (sentiment >= 80) return 'Very Bullish';
    if (sentiment >= 70) return 'Bullish';
    if (sentiment >= 60) return 'Slightly Bullish';
    if (sentiment >= 50) return 'Neutral';
    if (sentiment >= 40) return 'Slightly Bearish';
    if (sentiment >= 30) return 'Bearish';
    return 'Very Bearish';
  };

  const getSentimentDescription = (sentiment) => {
    if (sentiment >= 80) return 'Strong positive market sentiment. Consider increasing positions.';
    if (sentiment >= 70) return 'Positive market sentiment. Good time for strategic entries.';
    if (sentiment >= 60) return 'Slightly positive sentiment. Monitor for opportunities.';
    if (sentiment >= 50) return 'Neutral market sentiment. Wait for clearer signals.';
    if (sentiment >= 40) return 'Slightly negative sentiment. Exercise caution.';
    if (sentiment >= 30) return 'Negative market sentiment. Consider reducing exposure.';
    return 'Very negative sentiment. High risk environment.';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-[var(--accent-primary)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Insights</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Intelligent analysis powered by ML models and market data
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            botConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${botConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {botConnected ? 'ML Bot Connected' : 'ML Bot Offline'}
            </span>
          </div>
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Help & Information"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={loadInsightsData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="professional-card bg-blue-50/50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="space-y-3">
              <h3 className="font-semibold text-[var(--text-primary)]">How AI Insights Works</h3>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p><strong>🤖 ML Models:</strong> We analyze predictions from 6 different AI models (CNN1D, LSTM, Transformer, CatBoost, LightGBM, XGBoost) to find consensus patterns.</p>
                <p><strong>📊 Sentiment Analysis:</strong> We calculate market sentiment by combining ML predictions, trading signals, and your portfolio performance.</p>
                <p><strong>🎯 Smart Insights:</strong> Our system generates actionable insights when it detects significant patterns or opportunities.</p>
                <p><strong>⚡ Real-time Updates:</strong> Data refreshes automatically every 30 seconds to keep you informed of market changes.</p>
                <p><strong>🎨 Priority System:</strong> Insights are color-coded by priority - Red (High), Yellow (Medium), Blue (Low).</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-sm text-[var(--text-secondary)] text-center">
        Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh every 30 seconds
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-[var(--bg-tertiary)] p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Eye },
          { id: 'sentiment', label: 'Sentiment', icon: BarChart },
          { id: 'models', label: 'ML Models', icon: Brain },
          { id: 'insights', label: 'Insights', icon: Lightbulb },
          { id: 'signals', label: 'Signals', icon: Zap }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === id 
                ? 'bg-[var(--accent-primary)] text-white' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* AI Analysis Summary */}
          <div className="professional-card fade-in">
            <div className="flex items-center space-x-3 mb-6">
              <Lightbulb className="w-6 h-6 text-[var(--accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Intelligence Summary</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-2xl font-bold text-green-500">{insights.filter(i => i.type === 'opportunity').length}</p>
                <p className="text-sm text-[var(--text-secondary)]">Opportunities</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Bullish signals & gains</p>
              </div>
              <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-2xl font-bold text-yellow-500">{insights.filter(i => i.type === 'warning').length}</p>
                <p className="text-sm text-[var(--text-secondary)]">Warnings</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Risks & bearish signals</p>
              </div>
              <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-2xl font-bold text-blue-500">{insights.filter(i => i.type === 'strategy').length}</p>
                <p className="text-sm text-[var(--text-secondary)]">Strategies</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Actionable insights</p>
              </div>
              <div className="text-center p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <p className="text-2xl font-bold text-[var(--accent-primary)]">
                  {insights.length > 0 ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) : 0}%
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Avg Confidence</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Insight reliability</p>
              </div>
            </div>
          </div>

          {/* Quick Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="professional-card text-center p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-[var(--text-primary)]">Market Status</span>
              </div>
              <p className={`text-lg font-bold ${getSentimentColor(marketSentiment.overall)}`}>
                {getSentimentLabel(marketSentiment.overall)}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {getSentimentDescription(marketSentiment.overall)}
              </p>
            </div>
            
            <div className="professional-card text-center p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <PieChart className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-[var(--text-primary)]">Portfolio Status</span>
              </div>
              <p className={`text-lg font-bold ${getSentimentColor(marketSentiment.portfolio)}`}>
                {getSentimentLabel(marketSentiment.portfolio)}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Based on daily P&L performance
              </p>
            </div>

            <div className="professional-card text-center p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Brain className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-[var(--text-primary)]">ML Consensus</span>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">
                {Object.keys(mlPredictions).length}/6 Models
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                {botConnected ? 'All models active' : 'Some models offline'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <div className="space-y-6">
          {/* Market Sentiment */}
          <div className="professional-card fade-in">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Market Sentiment Analysis</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Sentiment is calculated by analyzing ML model predictions, trading signals, and portfolio performance to give you a comprehensive market view.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[var(--text-primary)]">Overall Market</h3>
                  <div className={`flex items-center space-x-1 ${getSentimentColor(marketSentiment.overall)}`}>
                    {getSentimentIcon(marketSentiment.overall)}
                    <span className="font-semibold">{marketSentiment.overall}%</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      marketSentiment.overall >= 70 ? 'bg-green-500' : 
                      marketSentiment.overall >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${marketSentiment.overall}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {getSentimentDescription(marketSentiment.overall)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-[var(--text-primary)]">Your Portfolio</h3>
                  <div className={`flex items-center space-x-1 ${getSentimentColor(marketSentiment.portfolio)}`}>
                    {getSentimentIcon(marketSentiment.portfolio)}
                    <span className="font-semibold">{marketSentiment.portfolio}%</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-3 mb-2">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      marketSentiment.portfolio >= 70 ? 'bg-green-500' : 
                      marketSentiment.portfolio >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} 
                    style={{ width: `${marketSentiment.portfolio}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Based on your portfolio's daily performance and P&L
                </p>
              </div>
            </div>
          </div>

          {/* Sentiment Breakdown */}
          <div className="professional-card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Sentiment Breakdown</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-[var(--text-primary)]">ML Model Predictions</span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  {Object.keys(mlPredictions).length} models analyzed
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-[var(--text-primary)]">Trading Signals</span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  {tradingSignals.length} recent signals
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-[var(--text-primary)]">Portfolio Performance</span>
                </div>
                <span className="text-sm text-[var(--text-secondary)]">
                  {portfolioData ? 'Included' : 'Not available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ML Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          {/* ML Model Consensus */}
          {Object.keys(mlPredictions).length > 0 ? (
            <div className="professional-card fade-in">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">ML Model Consensus</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Each model analyzes market data differently. When multiple models agree, it increases confidence in the prediction.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(mlPredictions).map(([model, data]) => (
                  <div key={model} className="text-center p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">
                      {model.toUpperCase()}
                    </div>
                    <div className={`text-lg font-bold ${
                      data.signal && data.signal.toLowerCase().includes('bullish') ? 'text-green-500' :
                      data.signal && data.signal.toLowerCase().includes('bearish') ? 'text-red-500' : 'text-[var(--text-primary)]'
                    }`}>
                      {data.confidence || 0}%
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {data.signal || 'No Signal'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="professional-card text-center py-8">
              <Brain className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">
                {isLoading ? 'Loading ML model predictions...' : 'No ML predictions available'}
              </p>
            </div>
          )}

          {/* Model Information */}
          <div className="professional-card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">About Our ML Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">CNN1D</p>
                    <p className="text-xs text-[var(--text-secondary)]">Convolutional Neural Network for pattern recognition</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">LSTM</p>
                    <p className="text-xs text-[var(--text-secondary)]">Long Short-Term Memory for time series analysis</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Transformer</p>
                    <p className="text-xs text-[var(--text-secondary)]">Attention-based model for complex relationships</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">CatBoost</p>
                    <p className="text-xs text-[var(--text-secondary)]">Gradient boosting for structured data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">LightGBM</p>
                    <p className="text-xs text-[var(--text-secondary)]">Light Gradient Boosting Machine</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">XGBoost</p>
                    <p className="text-xs text-[var(--text-secondary)]">Extreme Gradient Boosting</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          {/* AI Insights List */}
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <div 
                    key={index} 
                    className={`professional-card fade-in ${getPriorityColor(insight.priority)}`} 
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-opacity-20 ${insight.color}`}>
                          <IconComponent className={`w-5 h-5 ${insight.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[var(--text-primary)]">{insight.title}</h3>
                          <p className="text-sm text-[var(--text-secondary)] capitalize">{insight.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--text-secondary)]">Confidence</p>
                        <p className="font-semibold text-[var(--text-primary)]">{insight.confidence}%</p>
                      </div>
                    </div>
                    <p className="text-[var(--text-primary)] mb-3">{insight.description}</p>
                    {insight.explanation && (
                      <div className="mb-3 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                        <p className="text-sm text-[var(--text-secondary)]">{insight.explanation}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--accent-primary)]">{insight.action}</span>
                      <button className="px-3 py-1 bg-[var(--accent-primary)] text-white rounded text-sm hover:bg-opacity-90 transition-colors">
                        Take Action
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="professional-card text-center py-8">
                <Activity className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
                <p className="text-[var(--text-secondary)]">
                  {isLoading ? 'Analyzing market data...' : 'No insights available at the moment'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Insights are generated when significant patterns or opportunities are detected
                </p>
              </div>
            )}
          </div>

          {/* Insight Types Guide */}
          <div className="professional-card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Understanding Insight Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Opportunities</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Bullish signals, strong performance, or favorable market conditions that suggest potential gains.
                </p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Warnings</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Bearish signals, poor performance, or high volatility that suggest potential risks.
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">Strategies</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Actionable insights, model performance highlights, or strategic recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signals Tab */}
      {activeTab === 'signals' && (
        <div className="space-y-6">
          {/* Real-time Trading Signals */}
          {tradingSignals.length > 0 ? (
            <div className="professional-card fade-in">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Trading Signals</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                These are the most recent trading signals generated by our system. Higher confidence signals are generally more reliable.
              </p>
              <div className="space-y-3">
                {tradingSignals.slice(0, 5).map((signal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded ${
                        signal.type === 'BUY' ? 'bg-green-500/20 text-green-500' :
                        signal.type === 'SELL' ? 'bg-red-500/20 text-red-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {signal.type === 'BUY' ? <ArrowUpRight className="w-4 h-4" /> :
                         signal.type === 'SELL' ? <ArrowDownRight className="w-4 h-4" /> :
                         <Minus className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{signal.symbol}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{signal.strategy}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[var(--text-primary)]">{signal.confidence}%</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="professional-card text-center py-8">
              <Zap className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">
                {isLoading ? 'Loading trading signals...' : 'No trading signals available'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                Trading signals are generated when our system detects actionable opportunities
              </p>
            </div>
          )}

          {/* Signal Types Guide */}
          <div className="professional-card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">Signal Types</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-green-500/10 rounded-lg">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">BUY Signal</p>
                  <p className="text-xs text-[var(--text-secondary)]">Suggests entering a long position or buying the asset</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-500/10 rounded-lg">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">SELL Signal</p>
                  <p className="text-xs text-[var(--text-secondary)]">Suggests exiting a position or selling the asset</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 rounded-lg">
                <Minus className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">HOLD Signal</p>
                  <p className="text-xs text-[var(--text-secondary)]">Suggests maintaining current positions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;

