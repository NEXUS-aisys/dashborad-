#!/bin/bash
echo "🚀 Starting NexusTradeAI in production mode..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2..."
    npm install -g pm2
fi

# Start with PM2
pm2 start ecosystem.config.js --env production

echo "✅ Production servers started with PM2!"
echo "📊 Frontend: http://localhost:4173"
echo "🔧 Backend: http://localhost:3000"
echo ""
echo "Use 'pm2 status' to check status"
echo "Use 'pm2 logs' to view logs"
echo "Use 'pm2 stop all' to stop servers"
