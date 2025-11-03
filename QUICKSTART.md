# Floyo Quick Start Guide

Get Floyo running in 5 minutes!

## ?? Quick Start (Docker)

```bash
# 1. Start everything
docker-compose up

# 2. Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

That's it! ??

## ??? Manual Setup

```bash
# 1. Setup environment
./setup.sh

# 2. Configure
cp .env.example .env
# Edit .env with your settings

# 3. Start database
docker-compose up -d postgres

# 4. Run migrations
source venv/bin/activate
alembic upgrade head

# 5. Start backend (Terminal 1)
cd backend
uvicorn main:app --reload

# 6. Start frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

## ?? First Steps

1. **Register**: Visit http://localhost:3000 and create an account
2. **Explore**: Check the dashboard for suggestions
3. **Track**: Use the CLI to track file usage: `floyo watch`

## ?? Documentation

- Full setup: `SETUP_INSTRUCTIONS.md`
- Full stack guide: `README_FULLSTACK.md`
- Original CLI: `README.md`

## ? Need Help?

Check `SETUP_INSTRUCTIONS.md` for detailed troubleshooting.
