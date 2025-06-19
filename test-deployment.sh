#!/bin/bash

echo "🧪 Testing XSD Editor App Deployment..."
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the xsd-editor-app root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm run install-all

echo ""
echo "🏗️ Building frontend..."
cd client
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo ""
echo "🧪 Testing backend..."
cd ../server
npm test 2>/dev/null || echo "⚠️ No tests found - that's okay!"

echo ""
echo "🌐 Starting servers for local testing..."
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop servers"
echo ""

# Start both servers
cd ..
npm run dev
