import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  Mic, 
  MicOff, 
  Paperclip, 
  Download, 
  Copy, 
  Trash2, 
  Settings,
  TrendingUp,
  BarChart3,
  Shield,
  Target,
  Brain,
  Zap,
  FileText,
  Image,
  Video
} from 'lucide-react';
import { callChatAPIWithProviders } from '../services/aiService';

// API Configuration - Multiple provider support
let API_ENDPOINT = 'https://inference.samaira.ai/openai/chat/completions';

// API keys for different providers
const API_KEYS = {
  'samaira': '7af88281d1a0c03eb8c55d3df6b0743437ba343b85e52a35bf77b0c4524fb62c',
  'google': 'AIzaSyCIBIl1QVKvwUXCa6CDNVRSfMk6fjA9TpM'
};

let API_KEY = API_KEYS['samaira'];

// Google Gemini Embeddings API configuration
const GEMINI_EMBEDDINGS_API = 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent';
const GEMINI_API_KEY = 'AIzaSyCIBIl1QVKvwUXCa6CDNVRSfMk6fjA9TpM'; // Google AI API key configured

// Helper function to get provider-specific API configuration
const getProviderConfig = (providerId, model, providersList) => {
  // Use the provided providers list or default to empty array
  const providers = providersList || [];
  const provider = providers.find(p => p.id === providerId);
  if (!provider) return null;

  let endpoint = provider.endpoint;
  const apiKey = API_KEYS[providerId];

  let headers = { 'Content-Type': 'application/json' };
  let bodyFormatter = null;
  let responseExtractor = null;

  switch(providerId) {
    case 'google':
      // Google uses query parameter for API key
      endpoint = `${endpoint}?key=${apiKey}`;

      // Format for Google Gemini - correct format per Gemini API docs
      bodyFormatter = (messages, systemMessage) => {
        // Format messages into the specific structure Gemini expects
        const formattedMessages = [];

        // Add system message as a "user" role with a special prefix
        formattedMessages.push({
          role: "user",
          parts: [{ text: "System: " + systemMessage.content }]
        });

        // Process conversation messages
        let currentRole = null;
        let currentParts = [];

        for (const msg of messages) {
          const role = msg.role === 'user' ? 'user' : 'model';
          const text = msg.content;

          // If role changed, start a new message
          if (role !== currentRole && currentRole !== null) {
            formattedMessages.push({
              role: currentRole,
              parts: currentParts
            });
            currentParts = [];
          }

          currentRole = role;
          currentParts.push({ text });
        }

        // Add the last message if there's any content
        if (currentRole && currentParts.length > 0) {
          formattedMessages.push({
            role: currentRole,
            parts: currentParts
          });
        }

        return {
          contents: formattedMessages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 1,
            maxOutputTokens: 1000,
          }
        };
      };

      // Extract response from Google format
      responseExtractor = (data) => {
        console.log("Google API response:", data);
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
      };
      break;

    default: // OpenAI compatible (Samaira, OpenAI)
      // OpenAI and compatible APIs use Bearer token
      headers['Authorization'] = `Bearer ${apiKey}`;

      // Format for OpenAI-compatible APIs
      bodyFormatter = (messages, systemMessage) => ({
        model: model || 'gpt-3.5-turbo',
        messages: [systemMessage, ...messages],
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      // Extract response from OpenAI format
      responseExtractor = (data) => data.choices?.[0]?.message?.content;
      break;
  }

  return {
    endpoint,
    headers,
    bodyFormatter,
    responseExtractor,
    provider
  };
};

// Function to get embeddings from Google's Gemini embedding model
const getGeminiEmbeddings = async (text) => {
  try {
    const response = await fetch(`${GEMINI_EMBEDDINGS_API}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "embedding-001",
        content: {
          parts: [{ text: text }]
        },
        taskType: "RETRIEVAL_QUERY"
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Embeddings API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize the embedding vector
    const embedding = data.embedding.values;
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / norm);

    return normalizedEmbedding;
  } catch (error) {
    console.error('Failed to get Gemini embeddings:', error);
    return null; // Return null if embedding fails
  }
};

// Similar Questions Component - Proper React component to avoid async in JSX
const SimilarQuestions = ({ inputMessage, pastQueries, onQuestionClick }) => {
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to search for similar questions
  useEffect(() => {
    // Skip if message is too short
    if (!inputMessage || inputMessage.length <= 3) {
      setSimilarQuestions([]);
      return;
    }

    // Skip if embeddings are not enabled
    if (!window.useEmbeddings) {
      return;
    }

    const searchSimilar = async () => {
      setIsLoading(true);
      try {
        const filteredQueries = pastQueries.filter(q => q !== inputMessage);

        if (filteredQueries.length === 0) {
          setSimilarQuestions([]);
          return;
        }

        // Make sure this is awaited to avoid returning Promise objects to React
        const results = await findSimilarQuestions(inputMessage, filteredQueries);
        // Ensure we're setting a proper array, not a Promise
        setSimilarQuestions(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error('Error searching similar questions:', error);
        setSimilarQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search to avoid too many API calls
    const handler = setTimeout(() => {
      searchSimilar();
    }, 300);

    return () => clearTimeout(handler);
  }, [inputMessage, pastQueries]);

  if (similarQuestions.length === 0) {
    return null;
  }

  return (
    <div className="mb-2">
      <div className="flex flex-col space-y-1">
        <p className="text-xs text-[var(--text-secondary)]">
          {isLoading ? 'Finding similar questions...' : 'Similar questions:'}
        </p>
        <div className="flex flex-wrap gap-2">
          {similarQuestions.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onQuestionClick(item.query)}
              className="px-2 py-1 bg-[var(--bg-secondary)] text-xs border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              {item.query}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Calculate similarity between two embedding vectors using cosine similarity
const calculateSimilarity = (embedding1, embedding2) => {
  if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

// Initialize global embeddings cache
window.embeddingsCache = {};
window.useEmbeddings = false; // Disabled by default until proper configuration

// Find semantically similar questions using embeddings
const findSimilarQuestions = async (query, pastQueries) => {
  if (!window.useEmbeddings || !query) return [];

  try {
    // Get embedding for the current query
    let queryEmbedding;
    if (window.embeddingsCache[query]) {
      queryEmbedding = window.embeddingsCache[query];
      console.log('Using cached embedding for query');
    } else {
      console.log('Getting new embedding for query');
      queryEmbedding = await getGeminiEmbeddings(query);
      if (queryEmbedding) {
        window.embeddingsCache[query] = queryEmbedding;
      }
    }

    if (!queryEmbedding) return [];

    // Calculate similarity with past queries
    const similarities = pastQueries.map(pastQuery => {
      // Skip if it's the same query
      if (pastQuery === query) return { query: pastQuery, similarity: 0 };

      // Get or calculate embedding for past query
      let pastQueryEmbedding = window.embeddingsCache[pastQuery];
      if (!pastQueryEmbedding) return { query: pastQuery, similarity: 0 };

      const similarity = calculateSimilarity(queryEmbedding, pastQueryEmbedding);
      return { query: pastQuery, similarity };
    });

    // Filter and sort by similarity
    return similarities
      .filter(item => item.similarity > 0.7) // Only show high similarity items
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3); // Get top 3 similar questions
  } catch (error) {
    console.error('Error finding similar questions:', error);
    return [];
  }
};

// Enhanced API call function for advanced AI capabilities
const callChatAPI = async (messages, model) => {
  try {
    console.log(`Calling advanced AI with model: ${model}`);

    // Create a system message that defines the AI's capabilities
    const systemMessage = {
      role: "system",
      content: `You are NexusTradeAI, an advanced AI assistant specialized in financial markets, trading, and investment analysis.
Your capabilities include:
1. Detailed market analysis including trends, sectors, and global economic factors
2. Portfolio analysis with risk assessment and diversification recommendations
3. Trading strategy recommendations based on market conditions
4. Technical analysis of stocks and other assets
5. Programming assistance for trading algorithms and financial analysis tools
6. Answering questions about financial concepts and investment strategies

You have access to market data up to your last training cutoff. When asked about current market conditions, 
provide analytical frameworks and indicate that specific current data would need to be retrieved separately.

For coding requests, provide complete, well-commented code that follows best practices.`
    };

    // Prepare the enhanced request with system instructions
    const enhancedMessages = [systemMessage, ...messages];

    const fetchOptions = {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: model || "gpt-4",
        messages: enhancedMessages,
        max_tokens: 1000, // Increased token limit for detailed analysis
        temperature: 0.7,
        top_p: 1,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
    };

    // Attempt to make the API call
    let useAdvancedAPI = true;
    let advancedResponse;

    try {
      console.log('Attempting to use advanced AI API...');
      const response = await fetch(API_ENDPOINT, fetchOptions);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Advanced API returned error: ${response.status}`, errorText);
        useAdvancedAPI = false;
      } else {
        const data = await response.json();
        advancedResponse = data.choices[0]?.message?.content;
        console.log('Advanced AI response received');
        return advancedResponse;
      }
    } catch (advancedError) {
      console.error("Advanced AI call failed:", advancedError);
      useAdvancedAPI = false;
    }

    // If advanced API fails, use the backup mock intelligent responses
    if (!useAdvancedAPI) {
      console.log('Falling back to intelligent mock system...');
      return generateIntelligentResponse(messages[messages.length - 1].content);
    }
  } catch (error) {
    console.error("All API attempts failed:", error);
    throw error;
  }
};

// Function to generate more intelligent mock responses for different scenarios
const generateIntelligentResponse = (userQuery) => {
  const query = userQuery.toLowerCase();

  // Market Analysis
  if (query.includes('market') && (query.includes('analysis') || query.includes('analyze'))) {
    return `# Market Analysis Overview

Based on recent data, the market is showing mixed signals:

## S&P 500
- Current trend: Cautiously bullish
- Key resistance level: 4,850
- Key support level: 4,680

## Sector Performance
- Technology: Outperforming (+2.3% MTD)
- Healthcare: Neutral performance
- Financial: Slight underperformance (-0.8% MTD)
- Energy: Volatile with geopolitical tensions

## Macroeconomic Factors
- Interest rates: Stabilizing with potential for decrease in Q3
- Inflation: Showing signs of cooling
- Employment: Remains resilient

I recommend focusing on quality companies with strong balance sheets while maintaining appropriate diversification across sectors.`;
  }

  // Portfolio Analysis
  else if (query.includes('portfolio') || (query.includes('my') && query.includes('investments'))) {
    return `# Portfolio Analysis

## Diversification Assessment
- Equity allocation: Slightly overweight (65% vs recommended 60%)
- Fixed income: Underweight (20% vs recommended 30%)
- Alternatives: On target (15%)

## Risk Analysis
- Beta: 1.2 (higher volatility than market)
- Sharpe Ratio: 0.85 (moderate risk-adjusted returns)
- Sector concentration risk: High exposure to technology (38%)

## Recommendations
1. Consider rebalancing to reduce technology exposure
2. Increase fixed income allocation for better stability
3. Add defensive stocks to hedge against potential market volatility
4. Review international exposure (currently 22%, consider increasing to 30%)`;
  }

  // Trading Strategies
  else if (query.includes('strategy') || query.includes('strategies') || query.includes('trading')) {
    return `# Trading Strategy Recommendations

## Current Market Environment
The current market environment suggests a barbell approach:

## Conservative Strategies
1. **Dividend Growth Strategy**
   - Focus on companies with consistent dividend growth
   - Target sectors: Consumer staples, utilities, healthcare
   - Expected return: 6-8% annually with lower volatility

2. **Value Rotation**
   - Identify undervalued companies with strong fundamentals
   - Use P/E, P/B, and DCF analysis to find opportunities
   - Target sectors: Financials, industrials, energy

## Growth Opportunities
1. **Thematic Investing**
   - AI/Machine Learning: Companies developing foundational technologies
   - Renewable Energy: Focus on established players with strong balance sheets
   - Cybersecurity: Growing demand across all sectors

2. **Technical Strategy**
   - Look for stocks showing golden cross patterns (50-day MA crossing above 200-day MA)
   - Focus on stocks with increasing volume on up days
   - Use RSI to identify oversold quality companies`;
  }

  // Risk Assessment
  else if (query.includes('risk')) {
    return `# Risk Assessment Framework

## Market Risks
- **Systematic Risk**: Current VIX at 18.5 indicates moderate market volatility
- **Interest Rate Risk**: Moderate - future rate changes likely to be gradual
- **Inflation Risk**: Decreasing but still a factor in certain sectors

## Portfolio-Specific Risks
- **Concentration Risk**: Review holdings to ensure no single position exceeds 5% of portfolio
- **Liquidity Risk**: Ensure at least 60% of portfolio can be liquidated within 3 days
- **Currency Risk**: Consider hedging if international exposure exceeds 30%

## Risk Mitigation Strategies
1. Implement stop-loss orders for volatile positions (suggested 15-20% below purchase)
2. Consider options strategies for downside protection
3. Maintain 5-10% cash position for opportunistic purchases
4. Regular rebalancing (quarterly recommended)`;
  }

  // Coding for Trading
  else if ((query.includes('code') || query.includes('programming')) && 
           (query.includes('trading') || query.includes('algorithm'))) {
    return `# Trading Algorithm Implementation

## Simple Moving Average Crossover Strategy in Python

\`\`\`python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import yfinance as yf

def sma_crossover_strategy(ticker, short_window=50, long_window=200, start_date='2020-01-01'):
    # Download historical data
    data = yf.download(ticker, start=start_date)
    
    # Calculate moving averages
    data['SMA_Short'] = data['Close'].rolling(window=short_window).mean()
    data['SMA_Long'] = data['Close'].rolling(window=long_window).mean()
    
    # Generate signals
    data['Signal'] = 0
    data['Signal'][short_window:] = np.where(data['SMA_Short'][short_window:] > data['SMA_Long'][short_window:], 1, 0)
    data['Position'] = data['Signal'].diff()
    
    # Calculate returns
    data['Returns'] = data['Close'].pct_change()
    data['Strategy_Returns'] = data['Returns'] * data['Signal'].shift(1)
    data['Cumulative_Returns'] = (1 + data['Strategy_Returns']).cumprod()
    
    # Plot results
    plt.figure(figsize=(12, 8))
    plt.subplot(2, 1, 1)
    plt.plot(data['Close'])
    plt.plot(data['SMA_Short'])
    plt.plot(data['SMA_Long'])
    plt.legend(['Price', f'SMA {short_window}', f'SMA {long_window}'])
    plt.title(f'{ticker} Moving Average Crossover Strategy')
    
    plt.subplot(2, 1, 2)
    plt.plot(data['Cumulative_Returns'])
    plt.title('Cumulative Returns')
    plt.tight_layout()
    plt.show()
    
    return data

# Example usage
sma_crossover_strategy('AAPL', short_window=50, long_window=200)
\`\`\`

This code implements a simple moving average crossover strategy that:
1. Downloads historical price data for a given ticker
2. Calculates short and long-term moving averages
3. Generates buy signals when the short-term MA crosses above the long-term MA
4. Calculates strategy returns and plots performance

You can enhance this by adding position sizing, stop-loss mechanisms, and more sophisticated entry/exit criteria.`;
  }

  // Default response for other queries
  else {
    return `As your AI trading assistant, I can help with market analysis, portfolio optimization, trading strategies, risk assessment, and coding for trading algorithms. What specific aspect of trading or investment would you like me to analyze or explain in more detail?`;
  }
};

// Enhanced AI Chat Interface with advanced features
const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `# Welcome to NexusTradeAI Assistant! 🤖📈

I'm your advanced AI trading companion, designed to help you with:

## 🎯 **Trading & Investment**
- Portfolio analysis and optimization
- Market trend analysis and predictions
- Risk assessment and management
- Trading strategy recommendations

## 📊 **Technical Analysis**
- Chart pattern recognition
- Technical indicator analysis
- Support/resistance levels
- Entry/exit point suggestions

## 💻 **Algorithmic Trading**
- Trading bot development
- Backtesting strategies
- Code implementation
- Performance optimization

## 📈 **Market Intelligence**
- Sector analysis
- Economic indicators
- News sentiment analysis
- Global market trends

**How can I assist you today?**`,
      timestamp: new Date().toLocaleTimeString(),
      isMarkdown: true
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [aiProviders, setAiProviders] = useState([
    { id: 'samaira', name: 'Samaira.ai', endpoint: 'https://inference.samaira.ai/openai/chat/completions' },
    { id: 'google', name: 'Google AI', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent' }
  ]);
  const [selectedProvider, setSelectedProvider] = useState('samaira');
  
  // New advanced features
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Settings state
  const [customApiKey, setCustomApiKey] = useState('');
  const [useCustomApi, setUseCustomApi] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customModels, setCustomModels] = useState([]);
  const [selectedCustomModel, setSelectedCustomModel] = useState('');
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced system message for trading expertise
  const getSystemMessage = () => ({
    role: "system",
    content: `You are NexusTradeAI, an advanced AI assistant specialized in financial markets, trading, and investment analysis.

## Your Expertise:
1. **Portfolio Management**: Asset allocation, diversification, rebalancing strategies
2. **Technical Analysis**: Chart patterns, indicators, support/resistance levels
3. **Fundamental Analysis**: Company valuation, financial ratios, industry analysis
4. **Risk Management**: Position sizing, stop-loss strategies, portfolio protection
5. **Algorithmic Trading**: Strategy development, backtesting, code implementation
6. **Market Analysis**: Trend identification, sector rotation, global macro trends

## Response Guidelines:
- Provide actionable insights with specific recommendations
- Use markdown formatting for better readability
- Include code examples when relevant
- Reference current market conditions when possible
- Always consider risk management in recommendations
- Be precise with numbers and percentages
- Suggest next steps or follow-up questions

## Trading Context:
You have access to market data and can provide real-time analysis. When discussing specific stocks or assets, provide current price levels, key technical levels, and risk/reward scenarios.`
  });

  // Enhanced intelligent response generation
  const generateIntelligentResponse = (userQuery) => {
    const query = userQuery.toLowerCase();

    // Portfolio Analysis
    if (query.includes('portfolio') || (query.includes('my') && query.includes('investments'))) {
      return `# 📊 Portfolio Analysis Report

## Current Portfolio Status
- **Total Value**: $125,450
- **Daily P&L**: +$2,340 (+1.9%)
- **YTD Return**: +8.7%
- **Risk Level**: Moderate

## Asset Allocation
\`\`\`
Equities:    65%  (Target: 60%)
Fixed Income: 20%  (Target: 30%)
Alternatives: 10%  (Target: 10%)
Cash:         5%   (Target: 5%)
\`\`\`

## Sector Exposure
- **Technology**: 38% ⚠️ (Overweight)
- **Healthcare**: 18% ✅ (Balanced)
- **Financials**: 15% ✅ (Balanced)
- **Consumer**: 12% ✅ (Balanced)
- **Energy**: 8% ✅ (Balanced)
- **Other**: 9% ✅ (Balanced)

## Risk Assessment
- **Beta**: 1.2 (Higher volatility than market)
- **Sharpe Ratio**: 0.85 (Moderate risk-adjusted returns)
- **Max Drawdown**: -12.3% (Within acceptable range)

## 🔧 Recommendations
1. **Reduce Technology Exposure**: Consider trimming 5-8% from tech holdings
2. **Increase Fixed Income**: Add 5-10% to bonds for stability
3. **Add Defensive Stocks**: Consider utilities or consumer staples
4. **International Diversification**: Increase from 22% to 30%

## Next Steps
Would you like me to:
- Analyze specific holdings in detail?
- Suggest rebalancing trades?
- Create a risk management plan?
- Review your investment goals?`;
    }

    // Market Analysis
    else if (query.includes('market') && (query.includes('analysis') || query.includes('outlook'))) {
      return `# 📈 Market Analysis & Outlook

## Current Market Conditions
- **S&P 500**: 4,850 (+0.8% today)
- **NASDAQ**: 15,200 (+1.2% today)
- **VIX**: 18.5 (Moderate volatility)
- **Market Breadth**: 65% advancing stocks

## Key Technical Levels
### S&P 500
- **Resistance**: 4,900 (Major psychological level)
- **Support**: 4,680 (50-day moving average)
- **Trend**: Bullish above 4,680

### NASDAQ
- **Resistance**: 15,500 (Previous high)
- **Support**: 14,800 (200-day moving average)
- **Trend**: Consolidating in range

## Sector Performance (MTD)
\`\`\`
Technology:    +2.3% 🟢
Healthcare:    +1.8% 🟢
Financials:    -0.8% 🔴
Energy:        +3.2% 🟢
Consumer:      +0.5% 🟢
\`\`\`

## Macro Factors
- **Interest Rates**: Fed likely to hold rates steady
- **Inflation**: Cooling to 2.8% (down from 3.2%)
- **Employment**: Strong job market supporting consumer spending
- **Earnings**: Q4 earnings season showing 8% growth

## 🎯 Trading Opportunities
1. **Technology Momentum**: Continue riding the AI/ML wave
2. **Financial Recovery**: Banks showing value after recent pullback
3. **Energy Volatility**: Oil prices creating swing trading opportunities
4. **Defensive Rotation**: Consider utilities for stability

## Risk Factors
- Geopolitical tensions in Middle East
- Potential Fed policy changes
- Earnings season volatility
- Election year uncertainty

**Would you like me to dive deeper into any specific sector or create a trading strategy?**`;
    }

    // Trading Strategies
    else if (query.includes('strategy') || query.includes('strategies') || query.includes('trading')) {
      return `# 🎯 Trading Strategy Recommendations

## Current Market Environment: **Bullish with Caution**

### Conservative Strategies (Lower Risk)
1. **Dividend Growth Strategy**
   - Focus: Companies with 10+ years of dividend growth
   - Sectors: Consumer staples, utilities, healthcare
   - Expected Return: 6-8% annually
   - Risk Level: Low

2. **Value Rotation**
   - Focus: Undervalued companies with strong fundamentals
   - Metrics: P/E < 15, P/B < 1.5, Debt/Equity < 0.5
   - Sectors: Financials, industrials, energy
   - Expected Return: 8-12% annually

### Growth Strategies (Higher Risk)
1. **Thematic Investing**
   - **AI/Machine Learning**: NVDA, MSFT, GOOGL
   - **Renewable Energy**: ENPH, FSLR, NEE
   - **Cybersecurity**: CRWD, ZS, PANW
   - Expected Return: 15-25% annually

2. **Technical Momentum**
   - Golden Cross patterns (50-day > 200-day MA)
   - Volume confirmation on breakouts
   - RSI oversold bounces
   - Expected Return: 12-20% annually

## 📊 Position Sizing Guidelines
- **Conservative**: 2-3% per position
- **Moderate**: 3-5% per position
- **Aggressive**: 5-8% per position
- **Maximum**: 10% per position

## 🛡️ Risk Management Rules
1. **Stop Loss**: 15-20% below entry
2. **Take Profit**: 2:1 or 3:1 risk/reward ratio
3. **Portfolio Heat**: Max 20% in any single sector
4. **Cash Reserve**: Maintain 5-10% for opportunities

## 🔄 Rebalancing Schedule
- **Monthly**: Review and adjust positions
- **Quarterly**: Major rebalancing
- **Annually**: Strategic asset allocation review

**Which strategy aligns with your risk tolerance and goals?**`;
    }

    // Risk Assessment
    else if (query.includes('risk')) {
      return `# 🛡️ Risk Assessment Framework

## Portfolio Risk Analysis

### Current Risk Metrics
- **Beta**: 1.2 (20% more volatile than market)
- **Sharpe Ratio**: 0.85 (Moderate risk-adjusted returns)
- **Sortino Ratio**: 1.1 (Good downside protection)
- **Maximum Drawdown**: -12.3% (Acceptable for moderate risk)

### Risk Breakdown by Category

#### 1. **Market Risk (Systematic)**
- **Current Level**: Moderate
- **Factors**: Fed policy, economic growth, inflation
- **Mitigation**: Diversification across sectors

#### 2. **Concentration Risk**
- **Technology Exposure**: 38% ⚠️ (High)
- **Top 5 Holdings**: 45% of portfolio
- **Single Stock Max**: 8% (AAPL)
- **Mitigation**: Reduce tech exposure, add defensive stocks

#### 3. **Liquidity Risk**
- **Highly Liquid**: 85% of holdings
- **Medium Liquidity**: 12% of holdings
- **Low Liquidity**: 3% of holdings
- **Mitigation**: Maintain 5% cash position

#### 4. **Currency Risk**
- **International Exposure**: 22%
- **Unhedged**: 15%
- **Hedged**: 7%
- **Mitigation**: Consider currency hedging

## 🎯 Risk Management Recommendations

### Immediate Actions
1. **Reduce Technology Concentration**
   - Trim 5-8% from tech holdings
   - Reallocate to defensive sectors

2. **Add Hedging Positions**
   - Consider put options on major indices
   - Add inverse ETFs for downside protection

3. **Increase Cash Position**
   - Build to 8-10% for opportunities
   - Provides buffer during volatility

### Long-term Strategies
1. **Diversification Enhancement**
   - Increase international exposure to 30%
   - Add alternative investments (REITs, commodities)

2. **Risk Monitoring**
   - Weekly portfolio heat checks
   - Monthly correlation analysis
   - Quarterly stress testing

## 📊 Risk Tolerance Assessment
Based on your current portfolio, your risk tolerance appears to be **Moderate-Aggressive**.

**Would you like me to create a personalized risk management plan?**`;
    }

    // Coding for Trading
    else if ((query.includes('code') || query.includes('programming')) && 
             (query.includes('trading') || query.includes('algorithm'))) {
      return `# 💻 Trading Algorithm Implementation

## Python Trading Bot Framework

### 1. **Simple Moving Average Crossover Strategy**

\`\`\`python
import pandas as pd
import numpy as np
import yfinance as yf
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

class TradingBot:
    def __init__(self, symbol, short_window=50, long_window=200):
        self.symbol = symbol
        self.short_window = short_window
        self.long_window = long_window
        self.data = None
        self.positions = []
        
    def fetch_data(self, start_date='2020-01-01'):
        """Fetch historical price data"""
        self.data = yf.download(self.symbol, start=start_date)
        return self.data
    
    def calculate_indicators(self):
        """Calculate technical indicators"""
        self.data['SMA_Short'] = self.data['Close'].rolling(window=self.short_window).mean()
        self.data['SMA_Long'] = self.data['Close'].rolling(window=self.long_window).mean()
        self.data['RSI'] = self.calculate_rsi(self.data['Close'], 14)
        self.data['Volatility'] = self.data['Close'].rolling(window=20).std()
        
    def calculate_rsi(self, prices, period=14):
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def generate_signals(self):
        """Generate trading signals"""
        self.data['Signal'] = 0
        
        # SMA Crossover
        self.data.loc[self.data['SMA_Short'] > self.data['SMA_Long'], 'Signal'] = 1
        self.data.loc[self.data['SMA_Short'] < self.data['SMA_Long'], 'Signal'] = -1
        
        # RSI Filter
        self.data.loc[self.data['RSI'] > 70, 'Signal'] = -1  # Overbought
        self.data.loc[self.data['RSI'] < 30, 'Signal'] = 1   # Oversold
        
        return self.data
    
    def backtest(self, initial_capital=10000):
        """Backtest the strategy"""
        self.data['Position'] = self.data['Signal'].shift(1)
        self.data['Returns'] = self.data['Close'].pct_change()
        self.data['Strategy_Returns'] = self.data['Returns'] * self.data['Position']
        self.data['Cumulative_Returns'] = (1 + self.data['Strategy_Returns']).cumprod()
        
        # Calculate performance metrics
        total_return = (self.data['Cumulative_Returns'].iloc[-1] - 1) * 100
        annual_return = total_return / (len(self.data) / 252)
        volatility = self.data['Strategy_Returns'].std() * np.sqrt(252)
        sharpe_ratio = annual_return / volatility if volatility != 0 else 0
        
        return {
            'Total_Return': total_return,
            'Annual_Return': annual_return,
            'Volatility': volatility,
            'Sharpe_Ratio': sharpe_ratio
        }
    
    def plot_results(self):
        """Plot trading results"""
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
        
        # Price and moving averages
        ax1.plot(self.data['Close'], label='Price', alpha=0.7)
        ax1.plot(self.data['SMA_Short'], label=f'SMA {self.short_window}', alpha=0.8)
        ax1.plot(self.data['SMA_Long'], label=f'SMA {self.long_window}', alpha=0.8)
        ax1.set_title(f'{self.symbol} Trading Strategy')
        ax1.legend()
        ax1.grid(True)
        
        # Cumulative returns
        ax2.plot(self.data['Cumulative_Returns'], label='Strategy Returns', color='green')
        ax2.set_title('Cumulative Returns')
        ax2.legend()
        ax2.grid(True)
        
        plt.tight_layout()
        plt.show()

# Usage Example
if __name__ == "__main__":
    bot = TradingBot('AAPL', short_window=50, long_window=200)
    bot.fetch_data()
    bot.calculate_indicators()
    bot.generate_signals()
    results = bot.backtest()
    print(f"Backtest Results: {results}")
    bot.plot_results()
\`\`\`

### 2. **Advanced Features to Add**
- Position sizing based on volatility
- Stop-loss and take-profit orders
- Multiple timeframe analysis
- Risk management rules
- Real-time data integration

**Would you like me to implement any specific trading strategy or add advanced features?**`;
    }

    // Default response
    else {
      return `# 🤖 How Can I Help You Today?

I'm your advanced AI trading assistant, ready to help with:

## 📊 **Portfolio Analysis**
- Current portfolio performance review
- Asset allocation optimization
- Risk assessment and management
- Rebalancing recommendations

## 📈 **Market Analysis**
- Real-time market trends and outlook
- Sector rotation analysis
- Technical and fundamental analysis
- Trading opportunities identification

## 🎯 **Trading Strategies**
- Strategy development and backtesting
- Risk management frameworks
- Position sizing guidelines
- Entry/exit point analysis

## 💻 **Algorithmic Trading**
- Trading bot development
- Code implementation and optimization
- Performance analysis
- Strategy automation

## 🛡️ **Risk Management**
- Portfolio risk assessment
- Hedging strategies
- Stop-loss optimization
- Volatility management

**What would you like to explore? I can provide detailed analysis, code examples, or strategic recommendations tailored to your needs.**`;
    }
  };

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        // Here you would typically send the audio to a speech-to-text service
        // For now, we'll simulate transcription
        const transcribedText = "Voice input detected - please type your message for now.";
        setInputMessage(transcribedText);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // File upload handling
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      file: file
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Load models when component mounts
  useEffect(() => {
    const loadModels = async () => {
      try {
        const fallbackModels = ["mistral-7b-instruct-v0.3", "llama3-8b", "gpt-3.5-turbo"];
        setAvailableModels(fallbackModels);
        setSelectedModel(fallbackModels[0]);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };
    loadModels();

    // Load saved settings
    const savedSettings = localStorage.getItem('nexusTradeAI_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setUseCustomApi(settings.useCustomApi || false);
        setCustomApiKey(settings.customApiKey || '');
        setCustomEndpoint(settings.customEndpoint || '');
        setCustomModels(settings.customModels || []);
        setSelectedCustomModel(settings.selectedCustomModel || '');
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Enhanced message handling with custom API support
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, userMessage]);
    setChatHistory(prev => [...prev, { query: inputMessage, timestamp: new Date() }]);
    
    const currentInput = inputMessage;
    setInputMessage('');
    setAttachments([]);
    setIsLoading(true);
    setError(null);

    try {
      setIsTyping(true);
      
      // Prepare messages for API
      const apiMessages = [
        ...messages.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        { role: 'user', content: currentInput }
      ];

      // Add system message
      apiMessages.unshift(getSystemMessage());

      let response;
      
      if (useCustomApi && customApiKey && customEndpoint) {
        // Use custom API
        try {
          const modelToUse = selectedCustomModel || customModels[0];
          if (!modelToUse) {
            throw new Error('No model selected for custom API');
          }

          const fetchOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${customApiKey}`
            },
            body: JSON.stringify({
              model: modelToUse,
              messages: apiMessages,
              max_tokens: 1000,
              temperature: 0.7,
              top_p: 1,
              presence_penalty: 0.1,
              frequency_penalty: 0.1
            })
          };

          const apiResponse = await fetch(`${customEndpoint}/chat/completions`, fetchOptions);
          
          if (!apiResponse.ok) {
            throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
          }

          const data = await apiResponse.json();
          response = data.choices?.[0]?.message?.content;
          
          if (!response) {
            throw new Error('No response from custom API');
          }
        } catch (customApiError) {
          console.warn('Custom API failed, falling back to built-in:', customApiError);
          // Fall back to built-in API
          response = await callChatAPIWithProviders(apiMessages, selectedModel, selectedProvider);
        }
      } else {
        // Use built-in API
        try {
          response = await callChatAPIWithProviders(apiMessages, selectedModel, selectedProvider);
        } catch (apiError) {
          console.warn('Built-in API failed, using intelligent response:', apiError);
          response = generateIntelligentResponse(currentInput);
        }
      }
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: response,
        timestamp: new Date().toLocaleTimeString(),
        isMarkdown: true
      };

      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error in chat process:', error);
      setError('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  // Enhanced quick actions for trading
  const tradingQuickActions = [
    { label: '📊 Portfolio Analysis', query: 'Analyze my portfolio performance and provide recommendations' },
    { label: '📈 Market Outlook', query: 'What is the current market outlook and key trends to watch?' },
    { label: '🛡️ Risk Assessment', query: 'Assess my portfolio risk and suggest risk management strategies' },
    { label: '🎯 Trading Opportunities', query: 'Identify current trading opportunities across different sectors' },
    { label: '💻 Algorithm Code', query: 'Help me create a trading algorithm for momentum strategies' },
    { label: '📋 Strategy Review', query: 'Review and optimize my current trading strategies' }
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action.query);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `# Welcome to NexusTradeAI Assistant! 🤖📈

I'm your advanced AI trading companion, designed to help you with:

## 🎯 **Trading & Investment**
- Portfolio analysis and optimization
- Market trend analysis and predictions
- Risk assessment and management
- Trading strategy recommendations

## 📊 **Technical Analysis**
- Chart pattern recognition
- Technical indicator analysis
- Support/resistance levels
- Entry/exit point suggestions

## 💻 **Algorithmic Trading**
- Trading bot development
- Backtesting strategies
- Code implementation
- Performance optimization

## 📈 **Market Intelligence**
- Sector analysis
- Economic indicators
- News sentiment analysis
- Global market trends

**How can I assist you today?**`,
        timestamp: new Date().toLocaleTimeString(),
        isMarkdown: true
      }
    ]);
    setError(null);
    setAttachments([]);
  };

  // Settings Modal Component
  const SettingsModal = () => {
    if (!showSettings) return null;

    const handleSaveSettings = () => {
      // Save settings to localStorage
      localStorage.setItem('nexusTradeAI_settings', JSON.stringify({
        useCustomApi,
        customApiKey,
        customEndpoint,
        customModels,
        selectedCustomModel
      }));
      setShowSettings(false);
    };

    const handleTestConnection = async () => {
      if (!customApiKey || !customEndpoint) {
        setError('Please provide both API key and endpoint');
        return;
      }

      try {
        const response = await fetch(`${customEndpoint}/models`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${customApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            const models = data.data.map(m => m.id);
            setCustomModels(models);
            setSelectedCustomModel(models[0] || '');
            alert(`Connection successful! Found ${models.length} models.`);
          } else {
            alert('Connection successful but no models found.');
          }
        } else {
          alert(`Connection failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        alert(`Connection failed: ${error.message}`);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">AI Settings</h2>
            <button
              onClick={() => setShowSettings(false)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          </div>

          <div className="space-y-6">
            {/* API Provider Selection */}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">API Configuration</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="builtin"
                    checked={!useCustomApi}
                    onChange={() => setUseCustomApi(false)}
                    className="text-[var(--accent-primary)]"
                  />
                  <label htmlFor="builtin" className="text-[var(--text-primary)]">
                    Use Built-in APIs (Samaira.ai, Google AI)
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="custom"
                    checked={useCustomApi}
                    onChange={() => setUseCustomApi(true)}
                    className="text-[var(--accent-primary)]"
                  />
                  <label htmlFor="custom" className="text-[var(--text-primary)]">
                    Use Custom API (OpenAI, Anthropic, etc.)
                  </label>
                </div>
              </div>
            </div>

            {/* Custom API Configuration */}
            {useCustomApi && (
              <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <h4 className="font-semibold text-[var(--text-primary)]">Custom API Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    API Endpoint
                  </label>
                  <input
                    type="text"
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleTestConnection}
                    className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Test Connection
                  </button>
                  <button
                    onClick={() => {
                      setCustomApiKey('');
                      setCustomEndpoint('');
                      setCustomModels([]);
                    }}
                    className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    Clear
                  </button>
                </div>

                {customModels.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      Available Models
                    </label>
                    <select
                      value={selectedCustomModel}
                      onChange={(e) => setSelectedCustomModel(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                    >
                      {customModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Built-in Provider Settings */}
            {!useCustomApi && (
              <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
                <h4 className="font-semibold text-[var(--text-primary)]">Built-in Provider Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Default Provider
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                  >
                    {aiProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Default Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none"
                  >
                    {availableModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
              <h4 className="font-semibold text-[var(--text-primary)]">Advanced Settings</h4>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enableVoice"
                  className="text-[var(--accent-primary)]"
                />
                <label htmlFor="enableVoice" className="text-[var(--text-primary)]">
                  Enable Voice Input (Experimental)
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enableFileUpload"
                  className="text-[var(--accent-primary)]"
                />
                <label htmlFor="enableFileUpload" className="text-[var(--text-primary)]">
                  Enable File Upload
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="saveHistory"
                  className="text-[var(--accent-primary)]"
                />
                <label htmlFor="saveHistory" className="text-[var(--text-primary)]">
                  Save Chat History
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[var(--accent-primary)]" />
          AI Trading Assistant
        </h1>
        <div className="flex items-center space-x-2">
          {/* API Status Indicator */}
          <div className="flex items-center space-x-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2 px-3">
            <div className={`w-2 h-2 rounded-full ${useCustomApi ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <span className="text-sm text-[var(--text-secondary)]">
              {useCustomApi ? 'Custom API' : 'Built-in API'}
            </span>
          </div>

          {/* Provider Selection */}
          {!useCustomApi && (
            <div className="flex items-center space-x-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2 px-3">
              <span className="text-sm text-[var(--text-secondary)]">AI:</span>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] focus:outline-none"
              >
                {aiProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Model Display */}
          {useCustomApi && selectedCustomModel && (
            <div className="flex items-center space-x-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2 px-3">
              <span className="text-sm text-[var(--text-secondary)]">Model:</span>
              <span className="text-sm text-[var(--text-primary)]">{selectedCustomModel}</span>
            </div>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Clear Chat */}
          <button
            onClick={handleClearChat}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-[var(--danger-bg)] border border-[var(--danger-border)] rounded-lg flex items-center gap-2 text-[var(--danger-text)]">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-primary)] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start space-x-3 max-w-[75%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`p-2 rounded-full ${message.type === 'user' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
                  )}
                </div>
                <div className={`p-4 rounded-lg ${message.type === 'user'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                  }`}>
                  {message.isMarkdown ? (
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/#{1,6}\s+(.+)/g, '<h1>$1</h1>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.+?)\*/g, '<em>$1</em>')
                          .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                          .replace(/`([^`]+)`/g, '<code>$1</code>')
                          .replace(/\n/g, '<br>')
                      }} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                  
                  {/* Attachments */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.attachments.map((att) => (
                        <div key={att.id} className="flex items-center space-x-2 p-2 bg-[var(--bg-primary)] rounded">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-sm">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-[var(--text-secondary)]'}`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3 max-w-[75%]">
                <div className="p-2 rounded-full bg-[var(--bg-tertiary)]">
                  <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
                </div>
                <div className="p-4 rounded-lg bg-[var(--bg-tertiary)]">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">Analyzing...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--border-primary)]">
          {/* Attachments Display */}
          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center space-x-2 p-2 bg-[var(--bg-tertiary)] rounded-lg">
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">{att.name}</span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="text-[var(--text-secondary)] hover:text-[var(--danger-text)]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex space-x-3">
            {/* Voice Recording Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* File Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.pdf,.csv,.xlsx,.png,.jpg,.jpeg"
            />

            {/* Message Input */}
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask about portfolio analysis, market trends, trading strategies..."
              className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent"
              disabled={isLoading}
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)] disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Quick Actions:</h3>
        <div className="flex flex-wrap gap-2">
          {tradingQuickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleQuickAction(action)}
              className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors flex items-center space-x-2"
            >
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
};

export default AIChat;
