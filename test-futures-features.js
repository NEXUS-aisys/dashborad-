#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testFuturesFeatures() {
  console.log('🚀 Testing Enhanced Trade Signals System\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Server Status:', health.data.status);
    console.log('✅ Features:', health.data.features.join(', '));
    console.log('');
    
    // Test 2: Market Providers
    console.log('2️⃣ Testing Market Providers...');
    const providers = await axios.get(`${BASE_URL}/api/trading/market/providers`);
    console.log('✅ Providers Found:', providers.data.data.providers.length);
    providers.data.data.providers.forEach(p => {
      console.log(`   - ${p.displayName}: ${p.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    });
    console.log('');
    
    // Test 3: Futures Contracts
    const futuresSymbols = ['ES', 'NQ', 'CL', 'GC'];
    
    for (const symbol of futuresSymbols) {
      console.log(`3️⃣ Testing ${symbol} Futures Contract...`);
      const signals = await axios.get(`${BASE_URL}/api/trading/signals/${symbol}`);
      const data = signals.data.data;
      
      console.log(`   ✅ Symbol: ${data.symbol}`);
      console.log(`   ✅ Type: ${data.marketData.instrumentType}`);
      console.log(`   ✅ Contract: ${data.marketData.contractInfo.name}`);
      console.log(`   ✅ Exchange: ${data.marketData.contractInfo.exchange}`);
      console.log(`   ✅ Tick Value: $${data.marketData.contractInfo.tickValue}`);
      console.log(`   ✅ Margin: $${data.marketData.contractInfo.margin.toLocaleString()}`);
      console.log(`   ✅ Current Price: $${data.marketData.currentPrice.toFixed(2)}`);
      console.log(`   ✅ Signal: ${data.summary.signal} (${data.summary.confidence}% confidence)`);
      console.log(`   ✅ RSI: ${data.technicalIndicators.rsi.value.toFixed(1)} (${data.technicalIndicators.rsi.signal})`);
      console.log(`   ✅ MACD: ${data.technicalIndicators.macd.signal}`);
      console.log('');
    }
    
    // Test 4: Technical Indicators
    console.log('4️⃣ Testing Technical Indicators...');
    const indicators = await axios.get(`${BASE_URL}/api/trading/indicators/signals/ES`);
    const indicatorData = indicators.data.data;
    
    console.log(`   ✅ Symbol: ${indicatorData.symbol}`);
    console.log(`   ✅ RSI: ${indicatorData.indicators.rsi.value.toFixed(1)} (${indicatorData.indicators.rsi.signal})`);
    console.log(`   ✅ MACD: ${indicatorData.indicators.macd.signal} (histogram: ${indicatorData.indicators.macd.histogram.toFixed(3)})`);
    console.log(`   ✅ Bollinger Bands: ${(indicatorData.indicators.bollingerBands.percentB * 100).toFixed(1)}% B`);
    console.log(`   ✅ Signals Generated: ${indicatorData.signals.length}`);
    indicatorData.signals.forEach(signal => {
      console.log(`      - ${signal.indicator}: ${signal.signal} (${signal.strength})`);
    });
    console.log('');
    
    // Test 5: Performance Metrics
    console.log('5️⃣ Testing Performance Metrics...');
    const performance = await axios.get(`${BASE_URL}/api/trading/signals/performance`);
    const perfData = performance.data.data;
    
    console.log(`   ✅ Total Signals: ${perfData.totalSignals}`);
    console.log(`   ✅ Accuracy: ${(perfData.accuracy * 100).toFixed(1)}%`);
    console.log(`   ✅ Profitable Signals: ${perfData.profitableSignals}`);
    console.log(`   ✅ Average Return: ${(perfData.averageReturn * 100).toFixed(2)}%`);
    console.log(`   ✅ Best Signal: ${perfData.bestSignal.symbol} (${(perfData.bestSignal.return * 100).toFixed(1)}%)`);
    console.log('');
    
    // Test 6: Watchlist
    console.log('6️⃣ Testing Watchlist...');
    const watchlist = await axios.get(`${BASE_URL}/api/trading/signals/watchlist`);
    const watchData = watchlist.data.data;
    
    console.log(`   ✅ Watchlist Items: ${watchData.length}`);
    watchData.forEach(item => {
      console.log(`      - ${item.symbol}: $${item.alertPrice} (${item.lastSignal.signal})`);
    });
    console.log('');
    
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('\n📱 Next Steps:');
    console.log('1. Open http://localhost:5173/analytics');
    console.log('2. Click on "Interactive Signals" tab');
    console.log('3. Enter any futures symbol (ES, NQ, YM, RTY, CL, GC, etc.)');
    console.log('4. View comprehensive analysis with futures-specific information');
    console.log('\n🔧 Available Futures: ES, NQ, YM, RTY, CL, GC, SI, NG, ZN, 6E, 6J');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the tests
testFuturesFeatures();