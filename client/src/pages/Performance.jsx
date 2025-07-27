import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

const Performance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    totalReturn: 0,
    portfolioValue: 0,
    winRate: 0,
    sharpeRatio: 0
  });
  const [recentTrades, setRecentTrades] = useState([]);
  const [timeframe, setTimeframe] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // Fetch performance metrics from bot API
        const metricsResponse = await fetch('http://localhost:5000/api/performance/metrics');
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setPerformanceMetrics(metricsData);
        }

        // Fetch recent trades from database
        const tradesResponse = await fetch('http://localhost:3000/api/trades/recent?limit=10');
        if (tradesResponse.ok) {
          const tradesData = await tradesResponse.json();
          setRecentTrades(tradesData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
    const interval = setInterval(fetchPerformanceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeframe]);

  const metrics = [
    {
      title: 'Total Return',
      value: `${performanceMetrics.totalReturn?.toFixed(1) || '0'}%`,
      change: performanceMetrics.totalReturnChange || '0%',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: 'Portfolio Value',
      value: `$${performanceMetrics.portfolioValue?.toLocaleString() || '0'}`,
      change: performanceMetrics.portfolioValueChange || '$0',
      icon: DollarSign,
      color: 'text-blue-500'
    },
    {
      title: 'Win Rate',
      value: `${performanceMetrics.winRate?.toFixed(1) || '0'}%`,
      change: performanceMetrics.winRateChange || '0%',
      icon: Target,
      color: 'text-purple-500'
    },
    {
      title: 'Sharpe Ratio',
      value: performanceMetrics.sharpeRatio?.toFixed(2) || '0.00',
      change: performanceMetrics.sharpeRatioChange || '0',
      icon: BarChart3,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Performance Analysis</h1>
        <div className="flex space-x-2">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)]"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="365">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="professional-card fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-opacity-20 ${metric.color}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">{metric.change}</span>
              </div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">{metric.title}</h3>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Performance Chart */}
      <div className="professional-card fade-in" style={{ animationDelay: `400ms` }}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Portfolio Performance Over Time</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-2" />
            <p className="text-[var(--text-secondary)]">
              {isLoading ? 'Loading performance data...' : 'Performance chart will be displayed here'}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Trades Performance */}
      <div className="professional-card fade-in" style={{ animationDelay: `500ms` }}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Trade Performance</h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
              <p className="text-[var(--text-secondary)] mt-2">Loading recent trades...</p>
            </div>
          ) : recentTrades.length > 0 ? (
            recentTrades.map((trade, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="font-medium text-[var(--text-primary)]">{trade.symbol}</span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {new Date(trade.date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`font-medium ${trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trade.pnl >= 0 ? '+' : ''}{trade.pnl?.toFixed(2)}%
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)]">No recent trades found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Performance;
