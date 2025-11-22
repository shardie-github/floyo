# Quick Start Guide

**Get Floyo in 5 minutes or less

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- A Supabase account (free tier works!)

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repo
git clone <repository-url>
cd floyo-monorepo

# Install dependencies
npm install
cd frontend && npm install && cd ..
pip install -r requirements.txt
```

## Step 2: Set Up Environment (1 minute)

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and add your Supabase credentials
# Get them from: Supabase Dashboard > Settings > API
```

**Minimum required variables:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Set Up Database (1 minute)

```bash
# Link your Supabase project
supabase link --project-ref <your-project-ref>

# Run migrations
supabase db push

# Generate Prisma client
npm run prisma:generate
```

## Step 4: Start Development (1 minute)

```bash
# Terminal 1: Start backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Start frontend
cd frontend
npm run dev
```

## Step 5: Open Your Browser

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## That's It! 🎉

You're now running Floyo locally. Start exploring!

### Next Steps

- Check out the [README.md](./README.md) for more details
- Read [VALUE_PROPOSITION.md](./VALUE_PROPOSITION.md) to understand what Floyo does
- Explore [USE_CASES.md](./USE_CASES.md) for real-world examples
- Join our community for help and updates

### Common Issues

**Port already in use?**
```bash
# Kill process on port 3000 or 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

**Database connection errors?**
- Double-check your Supabase credentials in `.env.local`
- Make sure you've run `supabase db push`

**Module not found errors?**
- Run `npm install` in both root and frontend directories
- Run `pip install -r requirements.txt` for Python dependencies

### Need Help?

- Check [ENVIRONMENT.md](./ENVIRONMENT.md) for environment variable details
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Open an issue on GitHub if you're stuck

**Happy coding!** 🚀
