# 🚀 NexusTradeAI - Complete Deployment Guide

## 📋 **Quick Start (5 minutes)**

### **Option 1: Development Mode**
```bash
# Run the deployment script
./deploy.sh

# Start development servers
./start-dev.sh
```

### **Option 2: Production Mode**
```bash
# Run the deployment script
./deploy.sh

# Start production servers
./start-prod.sh
```

### **Option 3: Docker Deployment**
```bash
# Run the deployment script
./deploy.sh

# Start with Docker
docker-compose up -d
```

---

## 🎯 **What's Included**

### ✅ **Complete Trading Analytics Platform**
- **11 Strategy-Specific Charts** - Real-time trading strategy visualizations
- **13 ML Model Displays** - Machine learning model performance tracking
- **WebSocket Integration** - Live data streaming
- **Authentication System** - User management with Supabase
- **Payment Processing** - Stripe integration for subscriptions
- **Telegram Notifications** - Real-time trading alerts
- **Responsive Design** - Works on all devices

### 🏗️ **Infrastructure**
- **Frontend**: React + Vite (Port 5173)
- **Backend**: Node.js + Express (Port 3000)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: WebSocket connections
- **Payment**: Stripe integration
- **Notifications**: Telegram bot

---

## 🚀 **Deployment Options**

### **1. Local Development**
```bash
# Install and setup
./deploy.sh

# Start development servers
./start-dev.sh

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

### **2. Production with PM2**
```bash
# Install and setup
./deploy.sh

# Start production servers
./start-prod.sh

# Access the application
# Frontend: http://localhost:4173
# Backend: http://localhost:3000
```

### **3. Docker Deployment**
```bash
# Install and setup
./deploy.sh

# Start with Docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:80
# Backend: http://localhost:3000
```

### **4. Cloud Deployment (AWS/GCP/Azure)**
```bash
# 1. Upload code to cloud server
# 2. Run deployment script
./deploy.sh

# 3. Update environment variables
nano server/.env.production
nano client/.env.production

# 4. Start production servers
./start-prod.sh
```

---

## ⚙️ **Configuration**

### **Environment Variables**

#### **Backend (.env.production)**
```env
PORT=3000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
ML_BOT_API_KEY=your_ml_bot_api_key
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ADMIN_CHAT_ID=your_telegram_chat_id
TELEGRAM_ENABLED=true
```

#### **Frontend (.env.production)**
```env
VITE_API_URL=https://your-domain.com
VITE_WS_URL=wss://your-domain.com
VITE_NODE_ENV=production
VITE_DEBUG=false
```

### **Required Services**

#### **1. Supabase Database**
- Create account at [supabase.com](https://supabase.com)
- Create new project
- Get URL and API keys
- Run the schema: `server/supabase_schema.sql`

#### **2. Stripe Payment Processing**
- Create account at [stripe.com](https://stripe.com)
- Get API keys from dashboard
- Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`

#### **3. Telegram Bot (Optional)**
- Create bot via [@BotFather](https://t.me/botfather)
- Get bot token
- Set up admin chat ID

---

## 🔧 **Management Commands**

### **Development**
```bash
# Start development servers
./start-dev.sh

# Stop development servers
Ctrl+C

# Check health
./health-check.sh
```

### **Production**
```bash
# Start production servers
./start-prod.sh

# Check PM2 status
pm2 status

# View logs
pm2 logs

# Stop all servers
pm2 stop all

# Restart all servers
pm2 restart all
```

### **Docker**
```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

---

## 📊 **Monitoring & Health Checks**

### **Health Check Script**
```bash
./health-check.sh
```

### **Manual Health Checks**
```bash
# Check server
curl http://localhost:3000/api/auth

# Check client
curl http://localhost:5173

# Check WebSocket
curl -I http://localhost:3000
```

### **PM2 Monitoring**
```bash
# View all processes
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# View detailed info
pm2 show nexustrade-server
pm2 show nexustrade-client
```

---

## 🔒 **Security Considerations**

### **Production Security Checklist**
- [ ] **HTTPS/SSL**: Configure SSL certificates
- [ ] **Environment Variables**: Use production credentials
- [ ] **Rate Limiting**: Implement API rate limiting
- [ ] **Input Validation**: Validate all user inputs
- [ ] **CORS**: Configure proper CORS settings
- [ ] **Firewall**: Configure server firewall
- [ ] **Backup**: Set up database backups
- [ ] **Monitoring**: Implement logging and monitoring

### **SSL Configuration**
```bash
# Install Certbot (Let's Encrypt)
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Configure Nginx with SSL
# See nginx.conf for SSL configuration
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Port Already in Use**
```bash
# Find process using port
lsof -i :3000
lsof -i :5173

# Kill process
kill -9 <PID>
```

#### **2. Database Connection Issues**
```bash
# Check Supabase connection
curl https://your-project.supabase.co/rest/v1/

# Verify environment variables
cat server/.env.production
```

#### **3. WebSocket Connection Issues**
```bash
# Check WebSocket endpoint
curl -I http://localhost:3000

# Check firewall settings
sudo ufw status
```

#### **4. Build Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf client/dist
npm run build
```

### **Logs and Debugging**
```bash
# View server logs
pm2 logs nexustrade-server

# View client logs
pm2 logs nexustrade-client

# View Docker logs
docker-compose logs -f

# Enable debug mode
export DEBUG=*
```

---

## 📈 **Scaling**

### **Horizontal Scaling**
```bash
# Scale PM2 instances
pm2 scale nexustrade-server 4
pm2 scale nexustrade-client 2

# Load balancer configuration
# Use Nginx or HAProxy for load balancing
```

### **Database Scaling**
- Upgrade Supabase plan
- Implement read replicas
- Use connection pooling

### **Caching**
- Implement Redis for session storage
- Use CDN for static assets
- Enable browser caching

---

## 🔄 **Updates and Maintenance**

### **Application Updates**
```bash
# Pull latest code
git pull origin main

# Run deployment script
./deploy.sh

# Restart services
pm2 restart all
# or
docker-compose up -d --build
```

### **Database Migrations**
```bash
# Run schema updates
psql -h your-db-host -U your-user -d your-db -f migrations.sql
```

### **Backup Strategy**
```bash
# Database backup
pg_dump -h your-db-host -U your-user your-db > backup.sql

# File backup
tar -czf backup-$(date +%Y%m%d).tar.gz /path/to/app
```

---

## 📞 **Support**

### **Documentation**
- [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) - Current deployment status
- [README.md](./README.md) - Main project documentation

### **Monitoring Tools**
- **PM2**: Process management and monitoring
- **Docker**: Container management
- **Health Checks**: Automated health monitoring
- **Logs**: Centralized logging

### **Performance Optimization**
- **Code Splitting**: Implemented in Vite build
- **Caching**: Browser and CDN caching
- **Compression**: Gzip compression enabled
- **Minification**: Production builds optimized

---

## 🎉 **Success Metrics**

### **Deployment Checklist**
- [ ] ✅ Application builds successfully
- [ ] ✅ All dependencies installed
- [ ] ✅ Environment variables configured
- [ ] ✅ Database connected
- [ ] ✅ WebSocket working
- [ ] ✅ Authentication functional
- [ ] ✅ Payment processing working
- [ ] ✅ Telegram notifications active
- [ ] ✅ Health checks passing
- [ ] ✅ SSL certificates installed
- [ ] ✅ Monitoring configured
- [ ] ✅ Backup strategy implemented

### **Performance Targets**
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 500ms
- **WebSocket Latency**: < 100ms
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%

---

**🚀 Your NexusTradeAI platform is ready for production deployment!**

For additional support or questions, refer to the main [README.md](./README.md) or check the [DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md) for current status.