#!/bin/bash
# Setup script for Floyo full-stack application

set -e

echo "?? Setting up Floyo..."

# Check Python version
echo "?? Checking Python version..."
python3 --version

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "?? Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "?? Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "?? Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r backend/requirements.txt

# Install Node.js dependencies (if node is available)
if command -v node &> /dev/null; then
    echo "?? Installing Node.js dependencies..."
    cd frontend
    npm install
    cd ..
else
    echo "??  Node.js not found. Skipping frontend setup."
fi

# Check for PostgreSQL
if command -v psql &> /dev/null; then
    echo "? PostgreSQL found"
else
    echo "??  PostgreSQL not found. Please install PostgreSQL or use Docker."
fi

# Copy environment file
if [ ! -f ".env" ]; then
    echo "?? Creating .env file from .env.example..."
    cp .env.example .env
    echo "??  Please update .env with your configuration!"
fi

# Initialize database (if using Docker)
if [ "$1" == "docker" ]; then
    echo "?? Starting Docker containers..."
    docker-compose up -d postgres
    sleep 5
    echo "?? Initializing database..."
    alembic upgrade head || echo "??  Run 'alembic upgrade head' manually after database is ready"
fi

echo "? Setup complete!"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && uvicorn main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo "  Docker:   docker-compose up"
echo ""
echo "Don't forget to:"
echo "  1. Update .env with your configuration"
echo "  2. Run database migrations: alembic upgrade head"
echo "  3. Create a superuser if needed"
