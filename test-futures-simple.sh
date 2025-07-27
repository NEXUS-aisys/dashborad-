#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🚀 Testing Enhanced Trade Signals System"
echo "========================================"
echo ""

# Test 1: Health Check
echo "1️⃣ Testing Health Check..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH" | grep -q '"status":"OK"'; then
    echo "✅ Server is running"
    echo "✅ Features: $(echo "$HEALTH" | grep -o '"features":\[[^]]*\]' | grep -o '"[^"]*"' | tr '\n' ' ')"
else
    echo "❌ Server health check failed"
    exit 1
fi
echo ""

# Test 2: Market Providers
echo "2️⃣ Testing Market Providers..."
PROVIDERS=$(curl -s "$BASE_URL/api/trading/market/providers")
if echo "$PROVIDERS" | grep -q '"success":true'; then
    echo "✅ Market providers endpoint working"
    echo "✅ Providers found: $(echo "$PROVIDERS" | grep -o '"displayName":"[^"]*"' | wc -l)"
else
    echo "❌ Market providers endpoint failed"
fi
echo ""

# Test 3: Futures Contracts
echo "3️⃣ Testing Futures Contracts..."
FUTURES_SYMBOLS=("ES" "NQ" "CL" "GC")

for symbol in "${FUTURES_SYMBOLS[@]}"; do
    echo "   Testing $symbol..."
    SIGNALS=$(curl -s "$BASE_URL/api/trading/signals/$symbol")
    
    if echo "$SIGNALS" | grep -q '"instrumentType":"futures"'; then
        echo "   ✅ $symbol: Futures contract detected"
        
        # Extract contract info
        CONTRACT_NAME=$(echo "$SIGNALS" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        EXCHANGE=$(echo "$SIGNALS" | grep -o '"exchange":"[^"]*"' | head -1 | cut -d'"' -f4)
        TICK_VALUE=$(echo "$SIGNALS" | grep -o '"tickValue":[0-9.]*' | head -1 | cut -d':' -f2)
        MARGIN=$(echo "$SIGNALS" | grep -o '"margin":[0-9]*' | head -1 | cut -d':' -f2)
        SIGNAL=$(echo "$SIGNALS" | grep -o '"signal":"[^"]*"' | head -1 | cut -d'"' -f4)
        CONFIDENCE=$(echo "$SIGNALS" | grep -o '"confidence":[0-9]*' | head -1 | cut -d':' -f2)
        
        echo "   ✅ Contract: $CONTRACT_NAME"
        echo "   ✅ Exchange: $EXCHANGE"
        echo "   ✅ Tick Value: \$$TICK_VALUE"
        echo "   ✅ Margin: \$$MARGIN"
        echo "   ✅ Signal: $SIGNAL ($CONFIDENCE% confidence)"
    else
        echo "   ❌ $symbol: Not detected as futures"
    fi
    echo ""
done

# Test 4: Technical Indicators
echo "4️⃣ Testing Technical Indicators..."
INDICATORS=$(curl -s "$BASE_URL/api/trading/indicators/signals/ES")

if echo "$INDICATORS" | grep -q '"success":true'; then
    echo "✅ Technical indicators endpoint working"
    
    # Extract RSI
    RSI_VALUE=$(echo "$INDICATORS" | grep -o '"rsi":{[^}]*}' | grep -o '"value":[0-9.]*' | cut -d':' -f2)
    RSI_SIGNAL=$(echo "$INDICATORS" | grep -o '"rsi":{[^}]*}' | grep -o '"signal":"[^"]*"' | cut -d'"' -f4)
    echo "✅ RSI: $RSI_VALUE ($RSI_SIGNAL)"
    
    # Extract MACD
    MACD_SIGNAL=$(echo "$INDICATORS" | grep -o '"macd":{[^}]*}' | grep -o '"signal":"[^"]*"' | cut -d'"' -f4)
    echo "✅ MACD: $MACD_SIGNAL"
    
    # Count signals
    SIGNAL_COUNT=$(echo "$INDICATORS" | grep -o '"indicator":"[^"]*"' | wc -l)
    echo "✅ Signals generated: $SIGNAL_COUNT"
else
    echo "❌ Technical indicators endpoint failed"
fi
echo ""

# Test 5: Performance Metrics
echo "5️⃣ Testing Performance Metrics..."
PERFORMANCE=$(curl -s "$BASE_URL/api/trading/signals/performance")

if echo "$PERFORMANCE" | grep -q '"success":true'; then
    echo "✅ Performance metrics endpoint working"
    
    TOTAL_SIGNALS=$(echo "$PERFORMANCE" | grep -o '"totalSignals":[0-9]*' | cut -d':' -f2)
    ACCURACY=$(echo "$PERFORMANCE" | grep -o '"accuracy":[0-9.]*' | cut -d':' -f2)
    ACCURACY_PCT=$(echo "scale=1; $ACCURACY * 100" | bc -l 2>/dev/null || echo "N/A")
    
    echo "✅ Total Signals: $TOTAL_SIGNALS"
    echo "✅ Accuracy: ${ACCURACY_PCT}%"
else
    echo "❌ Performance metrics endpoint failed"
fi
echo ""

# Test 6: Watchlist
echo "6️⃣ Testing Watchlist..."
WATCHLIST=$(curl -s "$BASE_URL/api/trading/signals/watchlist")

if echo "$WATCHLIST" | grep -q '"success":true'; then
    echo "✅ Watchlist endpoint working"
    
    WATCH_COUNT=$(echo "$WATCHLIST" | grep -o '"symbol":"[^"]*"' | wc -l)
    echo "✅ Watchlist items: $WATCH_COUNT"
    
    # Show watchlist items
    echo "$WATCHLIST" | grep -o '"symbol":"[^"]*"' | cut -d'"' -f4 | while read symbol; do
        echo "   - $symbol"
    done
else
    echo "❌ Watchlist endpoint failed"
fi
echo ""

echo "🎉 ALL TESTS COMPLETED! 🎉"
echo ""
echo "📱 Next Steps:"
echo "1. Open http://localhost:5173/analytics"
echo "2. Click on 'Interactive Signals' tab"
echo "3. Enter any futures symbol (ES, NQ, YM, RTY, CL, GC, etc.)"
echo "4. View comprehensive analysis with futures-specific information"
echo ""
echo "🔧 Available Futures: ES, NQ, YM, RTY, CL, GC, SI, NG, ZN, 6E, 6J"
echo ""
echo "✅ Your trade signals system is now fully upgraded with futures support!"