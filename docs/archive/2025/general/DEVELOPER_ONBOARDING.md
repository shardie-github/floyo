> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Developer Onboarding Guide

Welcome to Floyo! This guide will help you get started with development.

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd floyo
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

### 3. Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres

# Or use local PostgreSQL
# Create database: createdb floyo

# Initialize database
python -c "from backend.database import init_db; init_db()"

# Seed with sample data (optional)
python scripts/seed_database.py
```

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 5. Start Backend

```bash
# From project root
cd backend
uvicorn main:app --reload
```

Backend will run on `http://localhost:8000`
Frontend will run on `http://localhost:3000`

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://floyo:floyo@localhost:5432/floyo
SECRET_KEY=your-secret-key-here
SENTRY_DSN=your-sentry-dsn-optional
LOG_LEVEL=INFO
ENVIRONMENT=development
```

## Running Tests

### Backend Tests

```bash
pytest tests/ -v
pytest tests/ --cov=backend --cov=floyo --cov=database
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Tests

```bash
pytest tests/test_integration.py -v
```

### E2E Tests

```bash
cd frontend
npx playwright install
npx playwright test
```

## Code Quality

### Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

### Linting

```bash
# Python
black backend/ floyo/ database/ tests/
flake8 backend/ floyo/ database/ tests/

# Frontend
cd frontend
npm run lint
```

## Project Structure

```
floyo/
??? backend/          # FastAPI backend
?   ??? main.py       # Main API application
?   ??? database.py   # Database configuration
?   ??? logging_config.py
?   ??? sentry_config.py
??? frontend/         # Next.js frontend
?   ??? app/          # Next.js app directory
?   ??? components/   # React components
?   ??? hooks/        # React hooks
?   ??? tests/        # Frontend tests
??? database/         # Database models
?   ??? models.py
??? floyo/            # Core library
?   ??? tracker.py
?   ??? suggester.py
?   ??? watcher.py
??? tests/            # Backend tests
??? scripts/          # Utility scripts
??? docs/             # Documentation
```

## API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Development Workflow

1. Create a feature branch
2. Make changes
3. Write/update tests
4. Run tests and linters
5. Commit (pre-commit hooks will run)
6. Push and create PR

## Common Tasks

### Adding a New API Endpoint

1. Add route in `backend/main.py`
2. Add Pydantic models if needed
3. Write tests in `tests/test_api.py`
4. Update API documentation (docstrings)

### Adding a Frontend Component

1. Create component in `frontend/components/`
2. Write tests in `frontend/tests/components/`
3. Use TypeScript for type safety

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running: `docker-compose ps`
- Verify DATABASE_URL in .env
- Check database exists: `psql -l`

### Import Errors

- Ensure virtual environment is activated
- Check PYTHONPATH includes project root
- Verify all dependencies installed

### Port Already in Use

- Backend: Change port in uvicorn command
- Frontend: Change port in `next.config.js`

## Getting Help

- Check existing documentation in `docs/`
- Review code comments and docstrings
- Open an issue for bugs or questions
- Reach out to the team on Slack/Discord

## Next Steps

- Read [Architecture Decision Records](./ADRs/)
- Review [User Guide](./USER_GUIDE.md)
- Check [Deployment Guide](./DEPLOYMENT.md)
