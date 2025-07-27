import React, { useState, useRef, useEffect } from 'react';
import { Search, TrendingUp, X } from 'lucide-react';

const SymbolSelector = ({ selectedSymbol, onSymbolChange, placeholder = "Search symbols..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentSymbols, setRecentSymbols] = useState([]);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Popular symbols for quick selection
  const popularSymbols = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'BTC-USD', name: 'Bitcoin USD' },
    { symbol: 'ETH-USD', name: 'Ethereum USD' },
    { symbol: 'NQ=F', name: 'NASDAQ 100 Futures' },
    { symbol: 'ES=F', name: 'S&P 500 Futures' },
    { symbol: 'YM=F', name: 'Dow Jones Futures' },
    { symbol: 'RTY=F', name: 'Russell 2000 Futures' },
  ];

  // Load recent symbols from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nexus_recent_symbols');
    if (saved) {
      setRecentSymbols(JSON.parse(saved));
    }
  }, []);

  // Filter symbols based on search term
  const filteredSymbols = popularSymbols.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add custom symbol if search term doesn't match existing ones
  const customSymbol = searchTerm.toUpperCase();
  const showCustom = searchTerm && !filteredSymbols.some(s => s.symbol === customSymbol);

  const handleSymbolSelect = (symbol) => {
    onSymbolChange(symbol);
    
    // Add to recent symbols
    const updated = [symbol, ...recentSymbols.filter(s => s !== symbol)].slice(0, 5);
    setRecentSymbols(updated);
    localStorage.setItem('nexus_recent_symbols', JSON.stringify(updated));
    
    setIsOpen(false);
    setSearchTerm('');
  };

  const removeRecentSymbol = (symbol, e) => {
    e.stopPropagation();
    const updated = recentSymbols.filter(s => s !== symbol);
    setRecentSymbols(updated);
    localStorage.setItem('nexus_recent_symbols', JSON.stringify(updated));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : selectedSymbol}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 pr-4 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-80 overflow-auto">
          {/* Recent Symbols */}
          {recentSymbols.length > 0 && (
            <div className="p-3 border-b border-[var(--border-primary)]">
              <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Recent</div>
              <div className="flex flex-wrap gap-1">
                {recentSymbols.map(symbol => (
                  <div
                    key={symbol}
                    onClick={() => handleSymbolSelect(symbol)}
                    className="flex items-center px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs cursor-pointer hover:bg-[var(--accent-primary)] hover:text-white transition-colors"
                  >
                    <span>{symbol}</span>
                    <X 
                      className="w-3 h-3 ml-1 hover:text-[var(--error)]"
                      onClick={(e) => removeRecentSymbol(symbol, e)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Symbol */}
          {showCustom && (
            <div
              onClick={() => handleSymbolSelect(customSymbol)}
              className="px-4 py-3 hover:bg-[var(--bg-tertiary)] cursor-pointer border-b border-[var(--border-primary)]"
            >
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 text-[var(--accent-primary)] mr-3" />
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{customSymbol}</div>
                  <div className="text-xs text-[var(--text-muted)]">Search for this symbol</div>
                </div>
              </div>
            </div>
          )}

          {/* Popular Symbols */}
          <div className="p-3">
            <div className="text-xs font-medium text-[var(--text-muted)] mb-2">Popular Symbols</div>
            {filteredSymbols.map(item => (
              <div
                key={item.symbol}
                onClick={() => handleSymbolSelect(item.symbol)}
                className="px-3 py-2 hover:bg-[var(--bg-tertiary)] cursor-pointer rounded"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{item.symbol}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">{item.name}</div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>
              </div>
            ))}
          </div>

          {filteredSymbols.length === 0 && !showCustom && (
            <div className="px-4 py-3 text-center text-[var(--text-muted)]">
              No symbols found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SymbolSelector; 