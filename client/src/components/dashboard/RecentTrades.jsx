import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';
import { TrendingUp, TrendingDown } from 'lucide-react';

const RecentTrades = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setLoading(true);
        setError(null);
        // This endpoint doesn't exist yet, we will need to add it
        const fetchedTrades = await apiService.getRecentTrades({ limit: 4 });
        setTrades(fetchedTrades);
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError('Failed to fetch recent trade data');
        setTrades([]); // Ensure no old data is shown
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-sm text-[var(--error)]">{error}</div>;
  }

  return (
    <div className="space-y-3">
      {trades.map((trade, index) => (
        <div key={index} className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`px-2 py-1 text-xs font-medium rounded ${
              trade.action === 'BUY' 
                ? 'bg-[var(--success)]/10 text-[var(--success)]' 
                : 'bg-[var(--error)]/10 text-[var(--error)]'
            }`}>
              {trade.action}
            </div>
            <div>
              <div className="font-medium text-[var(--text-primary)]">{trade.symbol}</div>
              <div className="text-caption">{trade.quantity} shares @ {trade.price}</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-medium ${
              trade.pnl >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'
            }`}>
              {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString()}
            </div>
            <div className="text-caption">{new Date(trade.time).toLocaleTimeString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentTrades; 