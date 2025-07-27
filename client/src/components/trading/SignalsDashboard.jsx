import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  Plus,
  Filter,
  Grid,
  List,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';

const SignalsDashboard = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [filterSignal, setFilterSignal] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [selectedSymbols, setSelectedSymbols] = useState(['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']);
  const [newSymbol, setNewSymbol] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch batch signals
  const fetchBatchSignals = async () => {
    if (selectedSymbols.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/trading/signals/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ symbols: selectedSymbols })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSignals(data.data.filter(signal => !signal.error));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch signals');
      console.error('Error fetching batch signals:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add symbol to watchlist
  const addSymbol = () => {
    if (newSymbol && !selectedSymbols.includes(newSymbol.toUpperCase())) {
      setSelectedSymbols([...selectedSymbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  // Remove symbol from watchlist
  const removeSymbol = (symbolToRemove) => {
    setSelectedSymbols(selectedSymbols.filter(s => s !== symbolToRemove));
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchBatchSignals();
    
    if (autoRefresh) {
      const interval = setInterval(fetchBatchSignals, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [selectedSymbols, autoRefresh]);

  // Filter signals
  const filteredSignals = signals.filter(signal => {
    if (filterSignal !== 'all' && signal.summary?.signal !== filterSignal) return false;
    if (filterConfidence !== 'all') {
      const confidence = signal.summary?.confidence || 0;
      if (filterConfidence === 'high' && confidence < 80) return false;
      if (filterConfidence === 'medium' && (confidence < 60 || confidence >= 80)) return false;
      if (filterConfidence === 'low' && confidence >= 60) return false;
    }
    return true;
  });

  const getSignalIcon = (signal) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'HOLD':
        return <Minus className="w-4 h-4 text-yellow-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSignalCard = (signal) => (
    <Card key={signal.symbol} className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{signal.symbol}</CardTitle>
          <div className="flex items-center space-x-2">
            {getSignalIcon(signal.summary?.signal)}
            <Badge variant={signal.summary?.signal === 'BUY' ? 'default' : signal.summary?.signal === 'SELL' ? 'destructive' : 'secondary'}>
              {signal.summary?.signal || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Price Info */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-muted)]">Current Price</span>
          <span className="font-medium">${signal.marketData?.currentPrice?.toFixed(2) || 'N/A'}</span>
        </div>
        
        {/* Change */}
        {signal.marketData?.change && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-[var(--text-muted)]">Change</span>
            <span className={`font-medium ${signal.marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${signal.marketData.change.toFixed(2)} ({signal.marketData.changePercent.toFixed(2)}%)
            </span>
          </div>
        )}

        {/* Confidence */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-[var(--text-muted)]">Confidence</span>
            <span className={`text-sm font-medium ${getConfidenceColor(signal.summary?.confidence || 0)}`}>
              {signal.summary?.confidence || 0}%
            </span>
          </div>
          <Progress value={signal.summary?.confidence || 0} className="h-2" />
        </div>

        {/* Sentiment */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-muted)]">Sentiment</span>
          <Badge variant="outline" className="capitalize">
            {signal.summary?.sentiment || 'neutral'}
          </Badge>
        </div>

        {/* Price Targets */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Entry:</span>
            <span className="font-medium">${signal.summary?.entryPrice?.min?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Target:</span>
            <span className="font-medium text-green-600">${signal.summary?.targetPrice?.toFixed(2) || 'N/A'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-muted)]">Stop:</span>
            <span className="font-medium text-red-600">${signal.summary?.stopLoss?.toFixed(2) || 'N/A'}</span>
          </div>
        </div>

        {/* Risk/Reward */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-[var(--text-muted)]">R/R Ratio</span>
          <span className="text-sm font-medium">{signal.summary?.riskRewardRatio || 'N/A'}</span>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-[var(--text-muted)] text-center pt-2 border-t">
          {new Date(signal.timestamp).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Signals Dashboard</h2>
          <p className="text-[var(--text-muted)]">Monitor multiple symbols with real-time trade signals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-refresh
          </Button>
          <Button variant="outline" size="sm" onClick={fetchBatchSignals} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Symbol Management */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add symbol (e.g., AAPL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && addSymbol()}
            className="max-w-xs"
          />
          <Button onClick={addSymbol} disabled={!newSymbol}>
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>

        {/* Current Symbols */}
        <div className="flex flex-wrap gap-2">
          {selectedSymbols.map(symbol => (
            <Badge key={symbol} variant="outline" className="cursor-pointer" onClick={() => removeSymbol(symbol)}>
              {symbol} ×
            </Badge>
          ))}
        </div>

        {/* Filters and View */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={filterSignal} onValueChange={setFilterSignal}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Signal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
                <SelectItem value="HOLD">Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterConfidence} onValueChange={setFilterConfidence}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Confidence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-79%)</SelectItem>
                <SelectItem value="low">Low (<60%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Signals Grid/List */}
      {filteredSignals.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSignals.map(signal => getSignalCard(signal))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSignals.map(signal => (
              <Card key={signal.symbol}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-bold">{signal.symbol}</div>
                      <div className="flex items-center space-x-2">
                        {getSignalIcon(signal.summary?.signal)}
                        <Badge variant={signal.summary?.signal === 'BUY' ? 'default' : signal.summary?.signal === 'SELL' ? 'destructive' : 'secondary'}>
                          {signal.summary?.signal || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-medium">${signal.marketData?.currentPrice?.toFixed(2) || 'N/A'}</div>
                        <div className="text-sm text-[var(--text-muted)]">Current Price</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getConfidenceColor(signal.summary?.confidence || 0)}`}>
                          {signal.summary?.confidence || 0}%
                        </div>
                        <div className="text-sm text-[var(--text-muted)]">Confidence</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{signal.summary?.riskRewardRatio || 'N/A'}</div>
                        <div className="text-sm text-[var(--text-muted)]">R/R Ratio</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--text-muted)]">
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">
            {loading ? 'Loading signals...' : 'No signals found. Try adding some symbols or adjusting filters.'}
          </p>
        </div>
      )}

      {/* Summary Stats */}
      {signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Dashboard Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--accent-primary)]">
                  {signals.length}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Total Symbols</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {signals.filter(s => s.summary?.signal === 'BUY').length}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Buy Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {signals.filter(s => s.summary?.signal === 'SELL').length}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Sell Signals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {signals.filter(s => s.summary?.signal === 'HOLD').length}
                </div>
                <div className="text-sm text-[var(--text-muted)]">Hold Signals</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignalsDashboard;