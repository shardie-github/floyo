# Floyo Full-Stack Setup Instructions

This document provides step-by-step instructions to set up the complete Floyo full-stack application.

## Prerequisites

Before starting, ensure you have:

- **Python 3.11+** installed
- **Node.js 18+** and npm installed
- **PostgreSQL 15+** (or Docker for containerized setup)
- **Git** (optional, for cloning)

## Step 1: Database Setup

### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait a few seconds for PostgreSQL to initialize
sleep 5
```

### Option B: Local PostgreSQL

```bash
# Create database
createdb floyo

# Or using psql
psql -U postgres -c "CREATE DATABASE floyo;"
```

## Step 2: Python Environment Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

## Step 3: Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update:
# - DATABASE_URL (if not using Docker defaults)
# - SECRET_KEY (generate a strong random key)
# - CORS_ORIGINS (your frontend URL)
```

**Generate a secure SECRET_KEY:**

```python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Add the output to `.env` as `SECRET_KEY`.

## Step 4: Database Migrations

```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Initialize Alembic (if not done)
alembic init migrations

# Create initial migration
alembic revision --autogenerate -m "Initial schema"

# Apply migrations
alembic upgrade head
```

## Step 5: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Return to root
cd ..
```

## Step 6: Start Services

### Terminal 1: Backend API

```bash
# Activate virtual environment
source venv/bin/activate

# Navigate to backend
cd backend

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Frontend

```bash
# Navigate to frontend
cd frontend

# Start Next.js dev server
npm run dev
```

### Terminal 3: Original CLI (Optional)

```bash
# Activate virtual environment
source venv/bin/activate

# Start file watcher
floyo watch
```

## Step 7: Verify Setup

1. **Backend API**: Visit http://localhost:8000/docs - You should see Swagger UI
2. **Frontend**: Visit http://localhost:3000 - You should see the login page
3. **Database**: Verify tables exist:
   ```bash
   psql -U floyo -d floyo -c "\dt"
   ```

## Step 8: Create First User

1. Visit http://localhost:3000
2. Click "Sign up"
3. Fill in email, username, password
4. Click "Sign up" to register

## Using Docker Compose (Alternative)

For a complete containerized setup:

```bash
# Build and start all services
docker-compose up --build

# Or in detached mode
docker-compose up -d
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: localhost:5432

## Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Test connection
psql -U floyo -d floyo -c "SELECT 1;"

# Verify DATABASE_URL in .env matches your setup
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill process or change port in .env
```

### Migration Issues

```bash
# Check current migration
alembic current

# Show migration history
alembic history

# Reset (CAUTION: loses data)
# alembic downgrade base
# alembic upgrade head
```

### Frontend Build Errors

```bash
cd frontend

# Clear cache
rm -rf .next node_modules

# Reinstall
npm install

# Try again
npm run dev
```

### Import Errors in Backend

```bash
# Ensure you're in the project root
cd /path/to/floyo

# Verify Python path
python3 -c "import sys; print(sys.path)"

# Reinstall in development mode
pip install -e .
```

## Next Steps

1. **Configure Supabase** (optional):
   - Create Supabase project
   - Update `.env` with Supabase credentials
   - Deploy edge functions (see README_FULLSTACK.md)

2. **Set up Production**:
   - Use production database
   - Set strong SECRET_KEY
   - Configure HTTPS
   - Set up CI/CD

3. **Customize**:
   - Update frontend branding
   - Add more integration suggestions
   - Configure monitoring

## Support

For issues or questions:
- Check `README_FULLSTACK.md` for detailed documentation
- Review error logs in terminal output
- Check database logs: `docker-compose logs postgres`
