#!/bin/bash

# Configuration
APP_DIR="/var/www/tum-panich-liff"
PM2_PROCESS_NAME="tumpanich-api"

echo "🚀 Starting deployment..."

# 1. Pull latest code
echo "📦 Pulling latest code..."
cd $APP_DIR
git pull origin main

# 2. Install dependencies
echo "📥 Installing dependencies..."
npm install
cd server
npm install
cd ..

# 3. Build Frontend
echo "🏗️ Building frontend..."
npm run build

# 4. Restart Backend
echo "🔄 Restarting backend..."
pm2 restart $PM2_PROCESS_NAME

echo "✅ Deployment complete!"
echo "⚠️  Don't forget to check Nginx config for WebSocket support!"
