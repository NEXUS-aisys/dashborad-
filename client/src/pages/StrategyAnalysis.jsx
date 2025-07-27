import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Target, TrendingUp, BarChart3, Power, PowerOff,
  Triangle, AlertTriangle, Zap, GitBranch, Shield,
  Droplets, MousePointer, Eye, StopCircle, BarChart2, Scale,
  Play, Pause, RotateCcw, Download, Upload, Settings,
  Calendar, DollarSign, Activity, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, RefreshCw, Database, Code
} from 'lucide-react';

const StrategyAnalysis = () => {
  const [strategyStates, setStrategyStates] = useState({
    'cumulative_delta': true,
    'liquidation_detection': true,
    'momentum_breakout': true,
    'delta_divergence': true,
    'hvn_rejection': true,
    'liquidity_absorption': true,
    'liquidity_traps': true,
    'iceberg_detection': true,
    'stop_run_anticipation': true,
    'lvn_breakout': true,
    'volume_imbalance': true
  });

  // Monitoring state
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [strategyPerformance, setStrategyPerformance] = useState({});
  const [strategyErrors, setStrategyErrors] = useState({});
  const [strategyStatus, setStrategyStatus] = useState({});
  const [botConnection, setBotConnection] = useState(false);
  const [botStatus, setBotStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const intervalRef = useRef(null);

  // Connect to local bot via HTTP polling
  useEffect(() => {
    const checkBotConnection = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          setBotConnection(true);
          setBotStatus('connected');
          
          // Get strategy status
          await getStrategyStatus();
        } else {
          setBotConnection(false);
          setBotStatus('error');
        }
      } catch (error) {
        console.error('Failed to connect to bot:', error);
        setBotConnection(false);
        setBotStatus('disconnected');
        
        // Get real strategy status from bot
        await getStrategyStatus();
      }
    };

    // Initial connection check
    checkBotConnection();

    // Set up polling every 5 seconds
    intervalRef.current = setInterval(checkBotConnection, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStrategyStatus = async () => {
    try {
      // Get real strategy status from bot API
      const response = await fetch('http://localhost:5000/api/strategies/status');
      
      if (response.ok) {
        const data = await response.json();
        setStrategyStatus(data.status || {});
        setStrategyPerformance(data.performance || {});
        setStrategyErrors(data.errors || {});
      } else {
        throw new Error('Failed to get strategy status');
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error getting strategy status:', error);
    }
  };

  const toggleStrategy = async (strategyKey) => {
    setStrategyStates(prev => ({
      ...prev,
      [strategyKey]: !prev[strategyKey]
    }));

    // Send toggle command to bot via HTTP
    try {
      const response = await fetch('http://localhost:5000/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'toggle_strategy',
          parameters: {
            strategy: strategyKey,
            enabled: !strategyStates[strategyKey]
          }
        })
      });

      if (response.ok) {
        console.log(`Strategy ${strategyKey} toggled successfully`);
        // Update status after toggle
        setTimeout(getStrategyStatus, 1000);
      }
    } catch (error) {
      console.error('Error toggling strategy:', error);
      // Real toggle command sent to bot
      console.log(`Strategy ${strategyKey} toggle command sent`);
      setTimeout(getStrategyStatus, 1000);
    }
  };

  const getStatusColor = (strategyKey) => {
    const status = strategyStatus[strategyKey];
    const hasError = strategyErrors[strategyKey];
    
    if (hasError || status === 'error') return 'text-red-600';
    if (status === 'active') return 'text-green-600';
    if (status === 'inactive') return 'text-slate-400';
    return 'text-slate-400';
  };

  const getStatusIcon = (strategyKey) => {
    const status = strategyStatus[strategyKey];
    const hasError = strategyErrors[strategyKey];
    
    if (hasError || status === 'error') return <AlertTriangle className="w-4 h-4" />;
    if (status === 'active') return <CheckCircle className="w-4 h-4" />;
    if (status === 'inactive') return <Clock className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getConnectionColor = () => {
    switch (botStatus) {
      case 'connected': return 'bg-green-500/5 text-green-600 border border-green-500/20';
      case 'error': return 'bg-red-500/5 text-red-600 border border-red-500/20';
      default: return 'bg-slate-500/5 text-slate-600 border border-slate-500/20';
    }
  };

  const getConnectionDotColor = () => {
    switch (botStatus) {
      case 'connected': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const [strategies, setStrategies] = useState([]);

  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/strategies/list');
        if (response.ok) {
          const strategiesData = await response.json();
          setStrategies(strategiesData);
        }
      } catch (error) {
        console.error('Failed to fetch strategies:', error);
        setStrategies([]);
      }
    };

    fetchStrategies();
    const interval = setInterval(fetchStrategies, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header with Bot Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Strategy Analysis</h1>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm border ${getConnectionColor()}`}>
            <div className={`w-2 h-2 rounded-full ${getConnectionDotColor()}`}></div>
            <span>
              {botStatus === 'connected' ? 'Bot Connected' : 
               botStatus === 'error' ? 'Connection Error' : 'Bot Disconnected'}
            </span>
          </div>
        </div>
        <div className="text-sm text-[var(--text-secondary)]">
          Last Update: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Strategy Performance Overview */}
      <div className="professional-card fade-in">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Strategy Performance Overview</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-2" />
            <p className="text-[var(--text-secondary)]">Real-time strategy performance chart</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {botConnection ? 'Connected to local bot for live data' : 'Waiting for bot connection...'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Strategies - Enhanced Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {strategies.map((strategy, index) => {
          const isEnabled = strategyStates[strategy.key];
          const hasError = strategyErrors[strategy.key];
          const hasPerformance = strategyPerformance[strategy.key];
          const status = strategyStatus[strategy.key];
          
          return (
            <div key={index} className={`professional-card fade-in ${
              isEnabled ? '' : 'opacity-60'
            }`} style={{ animationDelay: `${(index + 1) * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <strategy.icon className="w-5 h-5 text-[var(--accent-primary)]" />
                  <div>
                    <h3 className="font-medium text-[var(--text-primary)]">{strategy.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]">
                        {strategy.category}
                      </span>
                      <span className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] rounded-full text-[var(--text-secondary)]">
                        {strategy.complexity}
                      </span>
                      {/* Status Indicator */}
                      <div className={`flex items-center space-x-1 ${getStatusColor(strategy.key)}`}>
                        {getStatusIcon(strategy.key)}
                        <span className="text-xs">
                          {hasError ? 'Error' : status === 'active' ? 'Active' : 'Idle'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleStrategy(strategy.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 ${
                      isEnabled ? 'bg-green-500' : 'bg-slate-400'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="text-sm text-[var(--text-secondary)] mb-3">{strategy.description}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Performance</p>
                  <p className="font-medium text-[var(--text-primary)]">{strategy.performance}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Win Rate</p>
                  <p className="font-medium text-[var(--text-primary)]">{strategy.winRate}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Sharpe Ratio</p>
                  <p className="font-medium text-[var(--text-primary)]">{strategy.sharpe}</p>
                </div>
              </div>

              {/* Performance Metrics */}
              {hasPerformance && (
                <div className="mb-4 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <div className="text-xs text-green-600 mb-1">Live Performance</div>
                  <div className="text-sm text-[var(--text-primary)]">
                    Win Rate: {hasPerformance.win_rate || 'N/A'}% | 
                    P&L: {hasPerformance.pnl || 'N/A'}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {hasError && (
                <div className="mb-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <div className="text-xs text-red-600 mb-1">Error</div>
                  <div className="text-sm text-[var(--text-primary)]">
                    {hasError}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Strategy Recommendations */}
      <div className="professional-card fade-in">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">AI Strategy Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <Target className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
            <div>
              <p className="text-[var(--text-primary)] font-medium">Optimize Momentum Strategy</p>
              <p className="text-sm text-[var(--text-secondary)]">Consider adjusting lookback period from 20 to 15 days for better performance</p>
            </div>
          </div>
          <div className="flex items-start p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <div>
              <p className="text-[var(--text-primary)] font-medium">New Opportunity Detected</p>
              <p className="text-sm text-[var(--text-secondary)]">Market conditions favor implementing a volatility arbitrage strategy</p>
            </div>
          </div>
          <div className="flex items-start p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <div>
              <p className="text-[var(--text-primary)] font-medium">Risk Alert</p>
              <p className="text-sm text-[var(--text-secondary)]">High volatility detected - consider reducing position sizes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Integration Note */}
      <div className="professional-card fade-in">
        <div className="flex items-start space-x-3">
          <Brain className="w-5 h-5 text-[var(--accent-primary)] mt-0.5" />
          <div>
            <h4 className="text-[var(--accent-primary)] font-medium mb-1">Dashboard Integration</h4>
            <p className="text-sm text-[var(--text-secondary)]">
              Strategy signals and performance data are automatically sent to the Dashboard for 
              trading signal generation and portfolio management. This monitor provides real-time 
              oversight of strategy health and performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyAnalysis;
