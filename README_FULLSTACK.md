# Floyo Full-Stack Application

Complete full-stack implementation of Floyo with database, authentication, realtime features, and modern frontend.

## Architecture

- **Backend**: FastAPI (Python) with PostgreSQL
- **Frontend**: Next.js (React) with TypeScript
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT-based authentication
- **Realtime**: WebSockets for live updates
- **Edge Functions**: Supabase Edge Functions (optional)

## Project Structure

```
/
??? backend/              # FastAPI backend
?   ??? main.py         # Main API application
?   ??? database.py     # Database connection
??? database/            # Database schema and models
?   ??? schema.sql      # PostgreSQL schema
?   ??? models.py       # SQLAlchemy models
??? frontend/            # Next.js frontend
?   ??? app/            # Next.js app directory
?   ??? components/     # React components
?   ??? lib/            # API client and utilities
?   ??? hooks/          # React hooks
??? migrations/              # Database migrations (Alembic)
??? supabase/           # Supabase edge functions
?   ??? functions/     # Deno edge functions
??? floyo/              # Original CLI application

```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- Docker & Docker Compose (optional)

### Setup

1. **Clone and setup environment:**
   ```bash
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start PostgreSQL:**
   ```bash
   # Using Docker
   docker-compose up -d postgres
   
   # Or use your local PostgreSQL
   createdb floyo
   ```

4. **Run database migrations:**
   ```bash
   source venv/bin/activate
   alembic upgrade head
   ```

5. **Start backend:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

6. **Start frontend (in another terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. **Access application:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Using Docker Compose

```bash
docker-compose up
```

This starts PostgreSQL, backend, and frontend together.

## Database Schema

The database includes the following tables:

- **users**: User accounts and authentication
- **events**: File system events and user actions
- **patterns**: File type usage patterns
- **relationships**: File relationships and dependencies
- **temporal_patterns**: Temporal event sequences
- **suggestions**: Integration suggestions
- **user_configs**: User-specific configurations
- **workflows**: User-defined workflows
- **user_sessions**: Active user sessions

See `database/schema.sql` for complete schema definition.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get token
- `GET /api/auth/me` - Get current user info

### Events
- `POST /api/events` - Create new event
- `GET /api/events` - List user events

### Suggestions
- `GET /api/suggestions` - Get integration suggestions
- `POST /api/suggestions/generate` - Generate new suggestions

### Patterns
- `GET /api/patterns` - Get usage patterns

### Statistics
- `GET /api/stats` - Get tracking statistics

### Configuration
- `GET /api/config` - Get user configuration
- `PUT /api/config` - Update user configuration

### WebSocket
- `WS /ws` - Realtime updates

## Frontend Features

- **Authentication**: Login and registration
- **Dashboard**: Overview of stats, suggestions, patterns, and events
- **Realtime Updates**: WebSocket connection for live data
- **Responsive Design**: Modern UI with Tailwind CSS

## Edge Functions (Supabase)

Edge functions are located in `supabase/functions/`:

- **generate-suggestions**: Generates integration suggestions based on patterns
- **analyze-patterns**: Analyzes events to detect patterns and relationships

### Deploying Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy generate-suggestions
supabase functions deploy analyze-patterns
```

## Development

### Running Tests

```bash
# Backend tests
pytest

# Frontend tests (when added)
cd frontend && npm test
```

### Database Migrations

```bash
# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Code Quality

```bash
# Backend linting
black backend/
flake8 backend/

# Frontend linting
cd frontend && npm run lint
```

## Environment Variables

Key environment variables (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `CORS_ORIGINS`: Allowed CORS origins
- `NEXT_PUBLIC_API_URL`: Frontend API URL

## Production Deployment

### Backend

1. Set environment variables
2. Use production database
3. Run migrations: `alembic upgrade head`
4. Use production ASGI server: `gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker`

### Frontend

1. Build: `cd frontend && npm run build`
2. Start: `npm start`
3. Or deploy to Vercel/Netlify

### Database

- Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Enable SSL connections
- Set up backups

## Security Considerations

1. **Change SECRET_KEY**: Use a strong, random secret key
2. **Enable HTTPS**: Use TLS in production
3. **CORS Configuration**: Restrict CORS origins to your frontend domain
4. **Database Security**: Use strong passwords and limit network access
5. **Rate Limiting**: Add rate limiting to API endpoints
6. **Input Validation**: All inputs are validated via Pydantic

## Troubleshooting

### Database Connection Issues

- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Check database credentials

### Migration Issues

- Ensure database exists: `createdb floyo`
- Check migration status: `alembic current`
- Review migration files in `migrations/versions/`

### Frontend Build Issues

- Clear cache: `rm -rf frontend/.next node_modules`
- Reinstall: `npm install`
- Check Node.js version: `node --version` (should be 18+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

Apache-2.0
