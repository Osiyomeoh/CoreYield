#!/bin/bash
echo "🚀 Starting CoreYield Frontend (Core Testnet2)..."
echo "📡 Connecting to: https://rpc.test2.btcs.network"
echo "🔗 Network: Core Testnet2 (Chain ID: 1114)"
echo ""

# Kill any existing processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the frontend
npm start 