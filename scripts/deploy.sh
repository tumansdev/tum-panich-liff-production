#!/bin/bash

# Configuration
APP_DIR="/var/www/tum-panich-liff"
PM2_PROCESS_NAME="tumpanich-new" # Updated to match user's running process

echo "🚀 Starting deployment..."

# 1. Environment Check
echo "🔍 Checking environment..."
if [ ! -f "$APP_DIR/server/.env" ]; then
    echo "❌ Error: server/.env not found! Please create it from server/.env.example"
    exit 1
fi

if [ ! -f "$APP_DIR/.env" ]; then
    echo "❌ Error: frontend .env not found! Please create it."
    exit 1
fi

# 2. Pull latest code
echo "📦 Pulling latest code..."
cd $APP_DIR
# Stash any local changes just in case (e.g. package-lock.json drift)
git stash
git pull origin main

# 3. Install dependencies
echo "📥 Installing dependencies..."
# Frontend deps
npm install --no-audit

# Backend deps
cd server
npm install --no-audit
cd ..

# 4. Build Frontend
echo "🏗️ Building frontend..."
npm run build

# 5. Restart Backend
echo "🔄 Restarting backend..."
# Check if PM2 process exists
if pm2 list | grep -q "$PM2_PROCESS_NAME"; then
    pm2 restart $PM2_PROCESS_NAME
else
    echo "⚠️  Process '$PM2_PROCESS_NAME' not found. Starting it..."
    cd server
    pm2 start server.js --name "$PM2_PROCESS_NAME"
fi

echo "✅ Deployment complete!"
echo "👉 Check API logs: pm2 logs $PM2_PROCESS_NAME"
