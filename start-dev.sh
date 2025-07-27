#!/bin/bash
echo "🚀 Starting NexusTradeAI in development mode..."

# Start server in background
cd server
npm start &
SERVER_PID=$!

# Start client in background
cd ../client
npm run dev &
CLIENT_PID=$!

echo "✅ Development servers started!"
echo "📊 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "echo '🛑 Stopping servers...'; kill $SERVER_PID $CLIENT_PID; exit" INT
wait
