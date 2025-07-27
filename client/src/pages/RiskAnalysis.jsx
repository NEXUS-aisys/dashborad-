import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Target, TrendingDown } from 'lucide-react';

const RiskAnalysis = () => {
  const [riskMetrics, setRiskMetrics] = useState({
    portfolioRiskScore: 0,
    valueAtRisk: 0,
    beta: 0,
    maxDrawdown: 0
  });
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        // Fetch risk metrics from bot API
        const metricsResponse = await fetch('http://localhost:5000/api/risk/metrics');
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setRiskMetrics(metricsData);
        }

        // Fetch risk alerts from bot API
        const alertsResponse = await fetch('http://localhost:5000/api/risk/alerts');
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json();
          setRiskAlerts(alertsData.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch risk data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskData();
    const interval = setInterval(fetchRiskData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    {
      title: 'Portfolio Risk Score',
      value: `${riskMetrics.portfolioRiskScore?.toFixed(1) || '0'}/10`,
      status: riskMetrics.portfolioRiskScore > 7 ? 'High' : riskMetrics.portfolioRiskScore > 4 ? 'Moderate' : 'Low',
      icon: Shield,
      color: riskMetrics.portfolioRiskScore > 7 ? 'text-red-500' : riskMetrics.portfolioRiskScore > 4 ? 'text-yellow-500' : 'text-green-500'
    },
    {
      title: 'Value at Risk (VaR)',
      value: `$${riskMetrics.valueAtRisk?.toLocaleString() || '0'}`,
      status: '95% confidence',
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    {
      title: 'Beta',
      value: riskMetrics.beta?.toFixed(2) || '0.00',
      status: 'vs S&P 500',
      icon: Target,
      color: 'text-blue-500'
    },
    {
      title: 'Max Drawdown',
      value: `${riskMetrics.maxDrawdown?.toFixed(1) || '0'}%`,
      status: 'Last 12 months',
      icon: TrendingDown,
      color: 'text-purple-500'
    }
  ];

  const getAlertIcon = (type) => {
    switch (type) {
      case 'concentration': return AlertTriangle;
      case 'correlation': return Target;
      case 'volatility': return TrendingDown;
      default: return AlertTriangle;
    }
  };

  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-yellow-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Risk Analysis</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Risk Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <div key={index} className="professional-card fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-opacity-20 ${metric.color}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-1">{metric.title}</h3>
              <p className="text-2xl font-bold text-[var(--text-primary)] mb-1">{metric.value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{metric.status}</p>
            </div>
          );
        })}
      </div>

      {/* Risk Distribution Chart */}
      <div className="professional-card fade-in" style={{ animationDelay: `400ms` }}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Risk Distribution by Asset Class</h2>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-[var(--border-primary)] rounded-lg">
          <div className="text-center">
            <Shield className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-2" />
            <p className="text-[var(--text-secondary)]">
              {isLoading ? 'Loading risk distribution data...' : 'Risk distribution chart will be displayed here'}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="professional-card fade-in" style={{ animationDelay: `500ms` }}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Risk Alerts</h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
              <p className="text-[var(--text-secondary)] mt-2">Loading risk alerts...</p>
            </div>
          ) : riskAlerts.length > 0 ? (
            riskAlerts.map((alert, index) => {
              const AlertIcon = getAlertIcon(alert.type);
              const alertColor = getAlertColor(alert.severity);
              
              return (
                <div key={index} className={`flex items-center p-3 bg-${alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}-500 bg-opacity-10 border border-${alert.severity === 'high' ? 'red' : alert.severity === 'medium' ? 'yellow' : 'blue'}-500 border-opacity-20 rounded-lg`}>
                  <AlertIcon className={`w-5 h-5 ${alertColor} mr-3`} />
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">{alert.title}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{alert.description}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-2" />
              <p className="text-[var(--text-secondary)]">No risk alerts at this time</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;
