#!/bin/bash

echo "🚀 Deploying Funish Games to Hostinger..."

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build client and server
echo "🔨 Building application..."
npm run build

# Create production environment file
echo "⚙️ Setting up production environment..."
cat > .env.production << EOL
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://funish.games
EOL

echo "✅ Build complete!"
echo "📁 Files ready for Hostinger deployment:"
echo "   - dist/ (built application)"
echo "   - package.json"
echo "   - package-lock.json"
echo ""
echo "🌐 Next steps:"
echo "   1. Upload these files to Hostinger"
echo "   2. Set environment variables in Hostinger control panel"
echo "   3. Set startup file to: dist/server.js"
echo "   4. Start the application"
