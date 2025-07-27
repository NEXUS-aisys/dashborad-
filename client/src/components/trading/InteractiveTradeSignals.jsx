import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  Signal, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Clock, 
  Target, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Brain,
  Zap,
  Eye,
  Bell,
  Settings,
  Download,
  Share2,
  Database,
  Wifi,
  WifiOff,
  Activity,
  Layers,
  Filter,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';

// Context for sharing data between components
export const TradeSignalsContext = createContext();

export const useTradeSignals = () => {
  const context = useContext(TradeSignalsContext);
  if (!context) {
    throw new Error('useTradeSignals must be used within a TradeSignalsProvider');
  }
  return context;
};

const InteractiveTradeSignals = () => {
  const [symbol, setSymbol] = useState('');
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'TSLA', 'NVDA']);
  const [performance, setPerformance] = useState(null);
  const [providers, setProviders] = useState([]);
  const [cacheStats, setCacheStats] = useState(null);
  const [expandedView, setExpandedView] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [indicatorSignals, setIndicatorSignals] = useState([]);
  const [connectedComponents, setConnectedComponents] = useState([]);

  // Fetch trade signals for a single symbol
  const fetchSignals = async (symbolToFetch, refresh = false) => {
    if (!symbolToFetch) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/trading/signals/${symbolToFetch}?refresh=${refresh}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSignals(data.data);
        // Notify connected components
        notifyConnectedComponents('signals_updated', data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch trade signals');
      console.error('Error fetching signals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch provider status
  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/trading/market/providers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data.providers);
        setCacheStats(data.data.cache);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  // Fetch indicator signals
  const fetchIndicatorSignals = async (symbol) => {
    try {
      const response = await fetch(`/api/trading/indicators/signals/${symbol}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIndicatorSignals(data.data.signals);
      }
    } catch (err) {
      console.error('Error fetching indicator signals:', err);
    }
  };

  // Clear cache
  const clearCache = async () => {
    try {
      const response = await fetch('/api/trading/market/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchProviders(); // Refresh provider status
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
    }
  };

  // Notify connected components
  const notifyConnectedComponents = (event, data) => {
    // This would be used to communicate with other components on the page
    window.dispatchEvent(new CustomEvent('tradeSignalsUpdate', {
      detail: { event, data, timestamp: new Date().toISOString() }
    }));
  };

  // Listen for events from other components
  useEffect(() => {
    const handleTradeSignalsUpdate = (event) => {
      const { event: eventType, data } = event.detail;
      
      switch (eventType) {
        case 'portfolio_update':
          // Update signals based on portfolio changes
          if (data.symbols) {
            setSelectedSymbols(data.symbols);
          }
          break;
        case 'watchlist_update':
          // Update watchlist
          setWatchlist(data.watchlist || []);
          break;
        case 'settings_update':
          // Update settings
          if (data.autoRefresh !== undefined) setAutoRefresh(data.autoRefresh);
          if (data.realTimeMode !== undefined) setRealTimeMode(data.realTimeMode);
          break;
        default:
          break;
      }
    };

    window.addEventListener('tradeSignalsUpdate', handleTradeSignalsUpdate);
    return () => window.removeEventListener('tradeSignalsUpdate', handleTradeSignalsUpdate);
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && symbol) {
      const interval = setInterval(() => {
        fetchSignals(symbol, true);
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, symbol]);

  // Initial data fetch
  useEffect(() => {
    fetchProviders();
  }, []);

  // Fetch indicator signals when symbol changes
  useEffect(() => {
    if (symbol) {
      fetchIndicatorSignals(symbol);
    }
  }, [symbol]);

  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'HOLD':
        return <Minus className="w-5 h-5 text-yellow-500" />;
      default:
        return <Signal className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProviderStatusIcon = (enabled, hasApiKey) => {
    if (!enabled) return <WifiOff className="w-4 h-4 text-gray-400" />;
    if (!hasApiKey) return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <Wifi className="w-4 h-4 text-green-500" />;
  };

  return (
    <TradeSignalsContext.Provider value={{
      signals,
      setSignals,
      symbol,
      setSymbol,
      loading,
      error,
      realTimeMode,
      setRealTimeMode,
      autoRefresh,
      setAutoRefresh,
      fetchSignals,
      notifyConnectedComponents
    }}>
      <div className={`space-y-6 ${expandedView ? 'fixed inset-0 z-50 bg-background p-6 overflow-auto' : ''}`}>
        {/* Header with Controls */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Interactive Trade Signals</h2>
            <p className="text-[var(--text-muted)]">Advanced analysis with multi-provider data and real-time updates</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={expandedView ? "outline" : "default"}
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
            >
              {expandedView ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {expandedView ? 'Minimize' : 'Expand'}
            </Button>
            <Button
              variant={realTimeMode ? "default" : "outline"}
              size="sm"
              onClick={() => setRealTimeMode(!realTimeMode)}
            >
              <Zap className="w-4 h-4 mr-2" />
              {realTimeMode ? 'Live' : 'Real-time'}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchProviders}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Provider Status */}
        {providers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Data Providers Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {providers.map((provider) => (
                  <div key={provider.name} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    {getProviderStatusIcon(provider.enabled, provider.hasApiKey)}
                    <div>
                      <div className="text-sm font-medium">{provider.displayName}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {provider.enabled ? (provider.hasApiKey ? 'Active' : 'No API Key') : 'Disabled'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {cacheStats && (
                <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
                  <span>Cache: {cacheStats.size} items</span>
                  <Button variant="outline" size="sm" onClick={clearCache}>
                    Clear Cache
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Enter symbol (e.g., AAPL, TSLA)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && fetchSignals(symbol)}
              />
            </div>
            <Button onClick={() => fetchSignals(symbol)} disabled={!symbol || loading}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Signal className="w-4 h-4" />}
              Analyze
            </Button>
            <Button variant="outline" onClick={() => fetchSignals(symbol, true)} disabled={!symbol}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh">Auto-refresh</Label>
            </div>
            
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {providers.filter(p => p.enabled).map(provider => (
                  <SelectItem key={provider.name} value={provider.name}>
                    {provider.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {signals && (
          <div className="space-y-6">
            {/* Signal Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{signals.symbol} Signal Summary</span>
                  <div className="flex items-center space-x-2">
                    {getSignalIcon(signals.summary.signal)}
                    <Badge variant={signals.summary.signal === 'BUY' ? 'default' : signals.summary.signal === 'SELL' ? 'destructive' : 'secondary'}>
                      {signals.summary.signal}
                    </Badge>
                    <Badge variant="outline">
                      {signals.marketData.provider || 'Unknown Provider'}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Confidence</span>
                      <span className={`text-sm font-bold ${getConfidenceColor(signals.summary.confidence)}`}>
                        {signals.summary.confidence}%
                      </span>
                    </div>
                    <Progress value={signals.summary.confidence} className="h-2" />
                  </div>

                  {/* Sentiment */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Sentiment</span>
                      <Badge className="capitalize">
                        {signals.summary.sentiment}
                      </Badge>
                    </div>
                  </div>

                  {/* Risk/Reward */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Risk/Reward</span>
                      <span className="text-sm font-bold">{signals.summary.riskRewardRatio}</span>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Price Targets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Entry Price</div>
                    <div className="text-lg font-bold text-green-700">
                      ${signals.summary.entryPrice.min} - ${signals.summary.entryPrice.max}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Target Price</div>
                    <div className="text-lg font-bold text-blue-700">
                      ${signals.summary.targetPrice}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-red-600 font-medium">Stop Loss</div>
                    <div className="text-lg font-bold text-red-700">
                      ${signals.summary.stopLoss}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Indicators */}
            {signals.technicalIndicators && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Layers className="w-5 h-5 mr-2" />
                    Technical Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">RSI</div>
                      <div className="text-lg font-bold">{signals.technicalIndicators.rsi?.value?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-[var(--text-muted)] capitalize">
                        {signals.technicalIndicators.rsi?.signal || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">MACD</div>
                      <div className="text-lg font-bold capitalize">{signals.technicalIndicators.macd?.signal || 'N/A'}</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {signals.technicalIndicators.macd?.histogram?.toFixed(3) || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Stochastic</div>
                      <div className="text-lg font-bold">{signals.technicalIndicators.stochastic?.k?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-[var(--text-muted)] capitalize">
                        {signals.technicalIndicators.stochastic?.signal || 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Volume</div>
                      <div className="text-lg font-bold">{signals.technicalIndicators.volumeAnalysis?.volumeRatio?.toFixed(2) || 'N/A'}x</div>
                      <div className="text-xs text-[var(--text-muted)] capitalize">
                        {signals.technicalIndicators.volumeAnalysis?.trend || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Indicator Signals */}
            {indicatorSignals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Indicator Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {indicatorSignals.map((signal, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          {getSignalIcon(signal.signal)}
                          <span className="font-medium">{signal.indicator}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={signal.signal === 'BUY' ? 'default' : signal.signal === 'SELL' ? 'destructive' : 'secondary'}>
                            {signal.signal}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {signal.strength}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Add Alert
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Updated: {new Date(signals.timestamp).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!signals && !loading && (
          <div className="text-center py-12">
            <Signal className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-muted)]">
              Enter a symbol to get comprehensive trade signals and analysis
            </p>
          </div>
        )}
      </div>
    </TradeSignalsContext.Provider>
  );
};

export default InteractiveTradeSignals;