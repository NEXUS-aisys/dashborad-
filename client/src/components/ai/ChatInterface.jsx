import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: "Hello! I'm your NEXUS AI Trading Assistant. I can help you with market analysis, portfolio insights, risk assessment, and trading strategies. What would you like to know?",
      timestamp: new Date(Date.now() - 60000)
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = async (userMessage) => {
    try {
      const response = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: 'trading_analysis'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.response,
          suggestions: data.suggestions || []
        };
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      return {
        content: "I'm currently unable to provide analysis. Please check your connection to the trading bot service.",
        suggestions: ['Retry connection', 'Check bot status', 'Manual analysis']
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputValue);
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: aiResponse.content,
        suggestions: aiResponse.suggestions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in AI chat:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: "Sorry, I encountered an error while processing your request. Please try again.",
        suggestions: ['Retry', 'Check connection', 'Manual analysis'],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center space-x-3 p-4 border-b border-[var(--border-primary)]">
        <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg">
          <Bot className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h3 className="font-medium text-[var(--text-primary)]">NEXUS AI Assistant</h3>
          <p className="text-xs text-[var(--text-muted)]">Trading & Market Analysis</p>
        </div>
        <div className="ml-auto flex items-center space-x-1">
          <div className="w-2 h-2 bg-[var(--success)] rounded-full animate-pulse"></div>
          <span className="text-xs text-[var(--text-muted)]">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.type === 'user' 
                  ? 'bg-[var(--accent-primary)]' 
                  : 'bg-[var(--bg-tertiary)]'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
                )}
              </div>

              {/* Message Content */}
              <div className={`rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Suggestions */}
                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-[var(--text-muted)]">Suggested actions:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-2 py-1 text-xs bg-[var(--bg-elevated)] hover:bg-[var(--bg-secondary)] rounded border border-[var(--border-primary)] transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-xs mt-2 opacity-70">
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex space-x-2 max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
              </div>
              <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Loader className="w-4 h-4 animate-spin text-[var(--accent-primary)]" />
                  <span className="text-sm text-[var(--text-muted)]">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-[var(--border-primary)]">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => handleSuggestionClick('Analyze my portfolio performance')}
            className="flex items-center space-x-2 p-2 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded transition-colors"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Portfolio</span>
          </button>
          <button
            onClick={() => handleSuggestionClick('Show risk analysis')}
            className="flex items-center space-x-2 p-2 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded transition-colors"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Risk</span>
          </button>
          <button
            onClick={() => handleSuggestionClick('Market sentiment analysis')}
            className="flex items-center space-x-2 p-2 text-xs bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] rounded transition-colors"
          >
            <BarChart3 className="w-3 h-3" />
            <span>Market</span>
          </button>
        </div>

        {/* Input */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your portfolio, market insights, or trading strategies..."
              className="w-full p-3 pr-12 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)]"
              rows="2"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary)]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

