#!/bin/bash

echo "🏥 NexusTradeAI Health Check"
echo "============================"

# Check server
echo "🔧 Checking server..."
if curl -s http://localhost:3000/api/auth > /dev/null; then
    echo "✅ Server is running"
else
    echo "❌ Server is not responding"
fi

# Check client
echo "📊 Checking client..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Client is running"
else
    echo "❌ Client is not responding"
fi

# Check WebSocket
echo "🔌 Checking WebSocket..."
if curl -s -I http://localhost:3000 | grep -q "Upgrade"; then
    echo "✅ WebSocket endpoint available"
else
    echo "❌ WebSocket endpoint not available"
fi

echo "🏥 Health check complete"
