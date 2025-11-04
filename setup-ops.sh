#!/bin/bash
# Setup script for production framework

set -e

echo "🚀 Setting up production framework..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Initialize ops framework
echo "🔧 Initializing ops framework..."
npm run ops init

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npx prisma generate || echo "⚠️  Prisma generation skipped (database not configured)"

# Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found. Copying from .env.example..."
  cp .env.example .env
  echo "📝 Please edit .env with your credentials"
fi

# Make ops CLI executable
chmod +x ops/cli.ts || true

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your credentials"
echo "  2. Run: npm run ops doctor"
echo "  3. Run: npm run ops check"
