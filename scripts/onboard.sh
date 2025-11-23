#!/bin/bash
# Floyo Developer Onboarding Script
# Sets up a complete development environment in under 5 minutes

set -e  # Exit on error

echo "🚀 Floyo Developer Onboarding"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Found: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.9+${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 9 ]); then
    echo -e "${RED}❌ Python 3.9+ required. Found: $PYTHON_VERSION${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python $PYTHON_VERSION${NC}"

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git not found. Please install Git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git $(git --version | cut -d' ' -f3)${NC}"

echo ""
echo "📦 Installing dependencies..."

# Install Node.js dependencies
echo "  → Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install --silent
    echo -e "${GREEN}  ✅ Node.js dependencies installed${NC}"
else
    echo -e "${YELLOW}  ⚠️  No package.json found, skipping${NC}"
fi

# Install frontend dependencies
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo "  → Installing frontend dependencies..."
    cd frontend
    npm install --silent
    cd ..
    echo -e "${GREEN}  ✅ Frontend dependencies installed${NC}"
fi

# Install Python dependencies
echo "  → Installing Python dependencies..."
if [ -f "backend/requirements.txt" ]; then
    python3 -m pip install --quiet --upgrade pip
    python3 -m pip install --quiet -r backend/requirements.txt
    echo -e "${GREEN}  ✅ Python dependencies installed${NC}"
else
    echo -e "${YELLOW}  ⚠️  No requirements.txt found, skipping${NC}"
fi

echo ""
echo "🔧 Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}  ✅ Created .env.local from .env.example${NC}"
        echo -e "${YELLOW}  ⚠️  Please edit .env.local with your configuration${NC}"
    else
        echo -e "${YELLOW}  ⚠️  No .env.example found${NC}"
    fi
else
    echo -e "${GREEN}  ✅ .env.local already exists${NC}"
fi

# Generate Prisma client if Prisma is configured
if [ -f "prisma/schema.prisma" ]; then
    echo "  → Generating Prisma client..."
    npm run prisma:generate 2>/dev/null || echo -e "${YELLOW}  ⚠️  Prisma generation skipped (may need database connection)${NC}"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Edit .env.local with your Supabase credentials"
echo "  2. Run database migrations: npm run prisma:migrate"
echo "  3. Start development servers:"
echo "     - Frontend: cd frontend && npm run dev"
echo "     - Backend: cd backend && python -m uvicorn main:app --reload"
echo ""
echo "📚 Documentation:"
echo "  - README.md - Project overview"
echo "  - CONTRIBUTING.md - Contribution guidelines"
echo "  - ENVIRONMENT.md - Environment variables reference"
echo ""
echo "🎉 Happy coding!"
