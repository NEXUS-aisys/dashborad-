import React, { useState, useEffect, useRef } from 'react';
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
  Share2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';

const EnhancedTradeSignals = () => {
  const [symbol, setSymbol] = useState('');
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'TSLA', 'NVDA']);
  const [performance, setPerformance] = useState(null);
  const eventSourceRef = useRef(null);

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

  // Fetch batch signals for multiple symbols
  const fetchBatchSignals = async (symbols) => {
    try {
      const response = await fetch('/api/trading/signals/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ symbols })
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      }
    } catch (err) {
      console.error('Error fetching batch signals:', err);
    }
  };

  // Fetch signal performance
  const fetchPerformance = async () => {
    try {
      const response = await fetch('/api/trading/signals/performance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPerformance(data.data);
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
    }
  };

  // Fetch watchlist
  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/trading/signals/watchlist', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setWatchlist(data.data);
      }
    } catch (err) {
      console.error('Error fetching watchlist:', err);
    }
  };

  // Set up real-time updates
  const setupRealTimeUpdates = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const symbols = selectedSymbols.join(',');
    eventSourceRef.current = new EventSource(`/api/trading/signals/realtime/${symbols}`);

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.success) {
        // Update signals for each symbol
        data.data.forEach(signal => {
          if (!signal.error) {
            setSignals(prev => {
              if (prev && prev.symbol === signal.symbol) {
                return signal;
              }
              return prev;
            });
          }
        });
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('EventSource error:', error);
      setRealTimeMode(false);
    };
  };

  // Add to watchlist
  const addToWatchlist = async (symbol, alertPrice) => {
    try {
      const response = await fetch(`/api/trading/signals/${symbol}/watch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ alertPrice })
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchWatchlist();
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
    }
  };

  useEffect(() => {
    fetchPerformance();
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (realTimeMode) {
      setupRealTimeUpdates();
    } else if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [realTimeMode, selectedSymbols]);

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

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-500 bg-green-50';
      case 'bearish':
        return 'text-red-500 bg-red-50';
      default:
        return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Advanced Trade Signals</h2>
          <p className="text-[var(--text-muted)]">Real-time analysis from multiple data sources and AI</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={realTimeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setRealTimeMode(!realTimeMode)}
          >
            <Zap className="w-4 h-4 mr-2" />
            {realTimeMode ? 'Live' : 'Real-time'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchPerformance()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Symbol Input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Enter symbol (e.g., AAPL, TSLA)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && fetchSignals(symbol)}
        />
        <Button onClick={() => fetchSignals(symbol)} disabled={!symbol || loading}>
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Signal className="w-4 h-4" />}
          Analyze
        </Button>
        <Button variant="outline" onClick={() => fetchSignals(symbol, true)} disabled={!symbol}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Performance Summary */}
      {performance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Signal Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)]">
                  {(performance.accuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-[var(--text-muted)]">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--success)]">
                  {performance.totalSignals}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Total Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--info)]">
                  {(performance.averageReturn * 100).toFixed(2)}%
                </div>
                <div className="text-sm text-[var(--text-muted)]">Avg Return</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--warning)]">
                  {performance.profitableSignals}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Profitable</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Signal Display */}
      {signals && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
            <TabsTrigger value="ml">ML Predictions</TabsTrigger>
            <TabsTrigger value="ai">AI Analysis</TabsTrigger>
            <TabsTrigger value="data">Data Sources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                      <Badge className={getSentimentColor(signals.summary.sentiment)}>
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

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => addToWatchlist(signals.symbol, signals.summary.targetPrice)}>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            {signals.technicalIndicators && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    Technical Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">RSI</div>
                      <div className="text-lg font-bold">{signals.technicalIndicators.rsi?.toFixed(1) || 'N/A'}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">MACD</div>
                      <div className="text-lg font-bold capitalize">{signals.technicalIndicators.macd?.signal || 'N/A'}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Support</div>
                      <div className="text-lg font-bold">${signals.technicalIndicators.support?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">Resistance</div>
                      <div className="text-lg font-bold">${signals.technicalIndicators.resistance?.toFixed(2) || 'N/A'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ml" className="space-y-4">
            {signals.mlPredictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Machine Learning Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Short Term</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Next Day:</span>
                          <span className="font-medium">${signals.mlPredictions.shortTerm?.nextDay?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Next Week:</span>
                          <span className="font-medium">${signals.mlPredictions.shortTerm?.nextWeek?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence:</span>
                          <span className="font-medium">{(signals.mlPredictions.shortTerm?.confidence * 100)?.toFixed(1) || 'N/A'}%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Medium Term</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Next Month:</span>
                          <span className="font-medium">${signals.mlPredictions.mediumTerm?.nextMonth?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Next Quarter:</span>
                          <span className="font-medium">${signals.mlPredictions.mediumTerm?.nextQuarter?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Confidence:</span>
                          <span className="font-medium">{(signals.mlPredictions.mediumTerm?.confidence * 100)?.toFixed(1) || 'N/A'}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            {signals.aiAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    AI Analysis & Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Reasoning</h4>
                      <p className="text-sm text-[var(--text-muted)] bg-gray-50 p-3 rounded-lg">
                        {signals.aiAnalysis.reasoning}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Key Risks</h4>
                      <div className="space-y-1">
                        {signals.aiAnalysis.risks?.map((risk, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                            {risk}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Position Sizing</h4>
                      <p className="text-sm text-[var(--text-muted)]">
                        {signals.aiAnalysis.positionSize}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Market Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Market Data (Yahoo Finance)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Price:</span>
                      <span className="font-medium">${signals.marketData?.currentPrice?.toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Change:</span>
                      <span className={`font-medium ${signals.marketData?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${signals.marketData?.change?.toFixed(2) || 'N/A'} ({signals.marketData?.changePercent?.toFixed(2) || 'N/A'}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Volume:</span>
                      <span className="font-medium">{signals.marketData?.volume?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Market Cap:</span>
                      <span className="font-medium">${signals.marketData?.marketCap?.toLocaleString() || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Local Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Local Data & Bot Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {signals.localData ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Bot Signals:</span>
                        <span className="font-medium">{signals.localData.botSignals?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ML Confidence:</span>
                        <span className="font-medium">{(signals.localData.mlPredictions?.confidence * 100)?.toFixed(1) || 'N/A'}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">No local data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Signal Watchlist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {watchlist.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{item.symbol}</span>
                    <Badge variant="outline">${item.alertPrice}</Badge>
                    {item.lastSignal && (
                      <Badge variant={item.lastSignal.signal === 'BUY' ? 'default' : item.lastSignal.signal === 'SELL' ? 'destructive' : 'secondary'}>
                        {item.lastSignal.signal}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedTradeSignals;