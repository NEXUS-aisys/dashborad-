import React, { useState, useEffect } from 'react';
import { Grid, TrendingUp, AlertCircle, Zap, BarChart3, Clock, RefreshCw, Info, X, BookOpen, Target, Shield, TrendingDown } from 'lucide-react';

const CorrelationMatrix = () => {
  const [correlationData, setCorrelationData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showHelp, setShowHelp] = useState(false);

  const fetchCorrelationData = async () => {
    setIsLoading(true);
    try {
      // Fetch real correlation data from bot API
      const response = await fetch(`http://localhost:5000/api/correlation/matrix?timeframe=${timeframe}`);
      
      if (response.ok) {
        const data = await response.json();
        setCorrelationData(data.correlations || []);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch correlation data');
      }
    } catch (error) {
      console.error('Error fetching correlation data:', error);
      setCorrelationData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelationData();
  }, [timeframe]);

  const getCorrelationColor = (correlation) => {
    const absCorr = Math.abs(correlation);
    if (absCorr > 0.8) return 'text-red-600';
    if (absCorr > 0.6) return 'text-orange-600';
    if (absCorr > 0.4) return 'text-yellow-600';
    if (absCorr > 0.2) return 'text-blue-600';
    return 'text-green-600';
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'Very Strong': return 'bg-red-500/5 text-red-600 border border-red-500/20';
      case 'Strong': return 'bg-orange-500/5 text-orange-600 border border-orange-500/20';
      case 'Moderate': return 'bg-yellow-500/5 text-yellow-600 border border-yellow-500/20';
      case 'Weak': return 'bg-blue-500/5 text-blue-600 border border-blue-500/20';
      case 'Very Weak': return 'bg-green-500/5 text-green-600 border border-green-500/20';
      default: return 'bg-slate-500/5 text-slate-600 border border-slate-500/20';
    }
  };

  const futuresCorrelations = correlationData.filter(item => item.category === 'futures');
  const stockCorrelations = correlationData.filter(item => item.category === 'stocks');

  // Help Modal Component
  const HelpModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-primary)] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Correlation Matrix Guide</h2>
            <button
              onClick={() => setShowHelp(false)}
              className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Understanding Correlations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">Correlation Values</h4>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• <span className="text-red-600">0.8 - 1.0:</span> Very Strong (High risk)</li>
                    <li>• <span className="text-orange-600">0.6 - 0.8:</span> Strong</li>
                    <li>• <span className="text-yellow-600">0.4 - 0.6:</span> Moderate</li>
                    <li>• <span className="text-blue-600">0.2 - 0.4:</span> Weak</li>
                    <li>• <span className="text-green-600">0.0 - 0.2:</span> Very Weak (Low risk)</li>
                  </ul>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">Trading Implications</h4>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• High correlations = Limited diversification</li>
                    <li>• Low correlations = Better portfolio balance</li>
                    <li>• Negative correlations = Hedging opportunities</li>
                    <li>• Monitor for regime changes</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Asset Categories</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">Futures Contracts</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">High-leverage derivatives with specific correlations:</p>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• <strong>NQ/ES:</strong> Tech vs S&P 500 correlation</li>
                    <li>• <strong>GC/CL:</strong> Gold vs Oil relationship</li>
                    <li>• <strong>RTY/YM:</strong> Small cap vs Dow correlation</li>
                  </ul>
                </div>
                <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <h4 className="font-medium text-[var(--text-primary)] mb-2">Stock Assets</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">Individual stocks with sector correlations:</p>
                  <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                    <li>• <strong>AAPL/MSFT:</strong> Tech sector correlation</li>
                    <li>• <strong>TSLA/NVDA:</strong> Growth stock relationship</li>
                    <li>• <strong>GOOGL/AMD:</strong> Tech vs Semiconductor</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Asset Correlation Matrix</h1>
          <p className="text-[var(--text-secondary)]">Real-time correlation analysis for portfolio diversification</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHelp(true)}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            title="Help"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={fetchCorrelationData}
            disabled={isLoading}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-sm text-[var(--text-secondary)]">Timeframe:</span>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-sm text-[var(--text-primary)]"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
            </select>
          </div>
          {lastUpdated && (
            <div className="text-xs text-[var(--text-secondary)]">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading correlation data...</p>
        </div>
      )}

      {/* Correlation Data */}
      {!isLoading && (
        <div className="space-y-6">
          {/* Futures Correlations */}
          {futuresCorrelations.length > 0 && (
            <div className="professional-card fade-in">
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Futures Correlations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {futuresCorrelations.map((item, index) => (
                  <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {item.asset1} ↔ {item.asset2}
                      </span>
                      <span className={`text-sm font-medium ${getCorrelationColor(item.correlation)}`}>
                        {item.correlation.toFixed(3)}
                      </span>
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs ${getStrengthColor(item.strength)}`}>
                      {item.strength}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Correlations */}
          {stockCorrelations.length > 0 && (
            <div className="professional-card fade-in">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Stock Correlations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stockCorrelations.map((item, index) => (
                  <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[var(--text-primary)]">
                        {item.asset1} ↔ {item.asset2}
                      </span>
                      <span className={`text-sm font-medium ${getCorrelationColor(item.correlation)}`}>
                        {item.correlation.toFixed(3)}
                      </span>
                    </div>
                    <div className={`inline-block px-2 py-1 rounded text-xs ${getStrengthColor(item.strength)}`}>
                      {item.strength}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Data State */}
          {correlationData.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Grid className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">No correlation data available</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Start trading to generate correlation data
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && <HelpModal />}
    </div>
  );
};

export default CorrelationMatrix;
