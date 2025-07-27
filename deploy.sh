#!/bin/bash

# NexusTradeAI Deployment Script
# This script sets up the complete application for deployment

set -e

echo "🚀 NexusTradeAI Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION found"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install server dependencies
    print_status "Installing server dependencies..."
    cd server
    npm install
    cd ..
    
    # Install client dependencies
    print_status "Installing client dependencies..."
    cd client
    npm install
    cd ..
    
    print_success "All dependencies installed successfully"
}

# Build the application
build_application() {
    print_status "Building the application..."
    
    cd client
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Create production environment files
setup_environment() {
    print_status "Setting up environment configuration..."
    
    # Create production server .env if it doesn't exist
    if [ ! -f "server/.env.production" ]; then
        cat > server/.env.production << EOF
# Production Environment Variables
PORT=3000
NODE_ENV=production
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
ML_BOT_API_KEY=your_ml_bot_api_key_here
JWT_SECRET=your_jwt_secret_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_ADMIN_CHAT_ID=your_telegram_chat_id_here
TELEGRAM_ENABLED=true
EOF
        print_warning "Created server/.env.production - Please update with your actual credentials"
    fi
    
    # Create production client .env if it doesn't exist
    if [ ! -f "client/.env.production" ]; then
        cat > client/.env.production << EOF
# Production Environment Variables
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
VITE_NODE_ENV=production
VITE_DEBUG=false
EOF
        print_warning "Created client/.env.production - Please update with your actual domain"
    fi
    
    print_success "Environment files created"
}

# Create PM2 ecosystem file for production
create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'nexustrade-server',
      script: 'server/server.js',
      cwd: './server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'nexustrade-client',
      script: 'npm',
      args: 'run preview',
      cwd: './client',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
    
    print_success "PM2 configuration created"
}

# Create Docker configuration
create_docker_config() {
    print_status "Creating Docker configuration..."
    
    # Dockerfile for server
    cat > server/Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
EOF
    
    # Dockerfile for client
    cat > client/Dockerfile << EOF
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # Nginx configuration for client
    cat > client/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files \$uri \$uri/ /index.html;
        }

        location /api {
            proxy_pass http://server:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        location /ws {
            proxy_pass http://server:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
    
    # Docker Compose file
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  server:
    build: ./server
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./server/.env.production
    restart: unless-stopped

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server
    restart: unless-stopped

  # Optional: Add a database service
  # postgres:
  #   image: postgres:15
  #   environment:
  #     POSTGRES_DB: nexustrade
  #     POSTGRES_USER: nexustrade
  #     POSTGRES_PASSWORD: your_password_here
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   restart: unless-stopped

# volumes:
#   postgres_data:
EOF
    
    print_success "Docker configuration created"
}

# Create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
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
EOF
    
    # Production startup script
    cat > start-prod.sh << 'EOF'
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
EOF
    
    # Make scripts executable
    chmod +x start-dev.sh start-prod.sh
    
    print_success "Startup scripts created"
}

# Create health check script
create_health_check() {
    print_status "Creating health check script..."
    
    cat > health-check.sh << 'EOF'
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
EOF
    
    chmod +x health-check.sh
    print_success "Health check script created"
}

# Main deployment function
main() {
    print_status "Starting NexusTradeAI deployment..."
    
    check_node
    install_dependencies
    build_application
    setup_environment
    create_pm2_config
    create_docker_config
    create_startup_scripts
    create_health_check
    
    print_success "🎉 Deployment setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update server/.env.production with your credentials"
    echo "2. Update client/.env.production with your domain"
    echo "3. Run './start-dev.sh' for development"
    echo "4. Run './start-prod.sh' for production"
    echo "5. Run './health-check.sh' to verify everything works"
    echo ""
    echo "🐳 For Docker deployment:"
    echo "   docker-compose up -d"
    echo ""
    echo "📚 For more information, see DEPLOYMENT_STATUS.md"
}

# Run main function
main "$@"