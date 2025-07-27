import React, { useState, useEffect } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend
} from 'recharts';

const StrategyComparisonChart = ({ height = 400 }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategyData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/strategies/performance');
        if (response.ok) {
          const strategiesData = await response.json();
          
          // Transform data for radar chart
          const radarData = Object.keys(strategiesData[0]?.metrics || {}).map(metric => {
            const dataPoint = { metric };
            strategiesData.forEach(strategy => {
              dataPoint[strategy.name] = strategy.metrics[metric];
            });
            return dataPoint;
          });

          setData({ strategies: strategiesData, radarData });
        } else {
          throw new Error('Failed to fetch strategy data');
        }
      } catch (error) {
        console.error('Error fetching strategy data:', error);
        setData({ strategies: [], radarData: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchStrategyData();
    const interval = setInterval(fetchStrategyData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-3 shadow-lg">
          <p className="text-[var(--text-primary)] font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strategy Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.strategies.map((strategy, index) => (
          <div key={strategy.name} className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: strategy.color }}
              ></div>
              <h4 className="font-medium text-[var(--text-primary)]">{strategy.name}</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Avg Return:</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {strategy.metrics['Return']}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Win Rate:</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {strategy.metrics['Win Rate']}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Sharpe:</span>
                <span className="font-medium text-[var(--text-primary)]">
                  {(strategy.metrics['Sharpe Ratio'] / 100 * 3).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Radar Chart */}
      <div style={{ height }}>
        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
          Strategy Performance Comparison
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data.radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
            <PolarGrid stroke="var(--border-primary)" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            />
            
            {data.strategies.map((strategy, index) => (
              <Radar
                key={strategy.name}
                name={strategy.name}
                dataKey={strategy.name}
                stroke={strategy.color}
                fill={strategy.color}
                fillOpacity={0.1}
                strokeWidth={2}
                dot={{ r: 4, fill: strategy.color }}
              />
            ))}
            
            <Legend 
              wrapperStyle={{ 
                fontSize: '12px',
                color: 'var(--text-primary)'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics Explanation */}
      <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
        <h5 className="font-medium text-[var(--text-primary)] mb-2">Metrics Explanation</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
          <div>
            <strong>Return:</strong> Annualized return percentage
          </div>
          <div>
            <strong>Sharpe Ratio:</strong> Risk-adjusted return measure
          </div>
          <div>
            <strong>Win Rate:</strong> Percentage of profitable trades
          </div>
          <div>
            <strong>Max Drawdown:</strong> Largest peak-to-trough decline
          </div>
          <div>
            <strong>Volatility:</strong> Standard deviation of returns
          </div>
          <div>
            <strong>Consistency:</strong> Stability of performance over time
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyComparisonChart;

