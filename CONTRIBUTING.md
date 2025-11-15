# Contributing to Floyo

Thank you for your interest in contributing to Floyo! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Documentation](#documentation)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for backend)
- PostgreSQL (via Supabase)
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd floyo-monorepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in values from Supabase Dashboard
   ```

4. **Set up database**
   ```bash
   npm run prisma:generate
   supabase db push
   ```

5. **Start development servers**
   ```bash
   # Frontend
   cd frontend && npm run dev
   
   # Backend (in another terminal)
   cd backend && python -m uvicorn main:app --reload
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

Example:
```
feat(auth): add OAuth2 support

Implement OAuth2 authentication flow with Google and GitHub providers.
Includes token refresh and error handling.
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write self-documenting code with clear variable names
- Add JSDoc comments for public APIs

### Python

- Follow PEP 8 style guide
- Use type hints
- Write docstrings for all functions and classes
- Use Black for formatting
- Use Ruff for linting

### File Organization

- Group related files in feature-based directories
- Keep components small and focused
- Use index files for clean imports
- Follow the existing project structure

## Testing

### Running Tests

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && pytest

# E2E tests
npm run test:e2e
```

### Writing Tests

- Write tests for all new features
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use descriptive test names
- Keep tests independent and isolated

### Test Structure

```typescript
describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following coding standards
   - Add tests
   - Update documentation
   - Ensure all tests pass

3. **Validate environment**
   ```bash
   npm run env:validate
   ```

4. **Run linting and type checking**
   ```bash
   npm run lint
   npm run type-check
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): your commit message"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Fill out the PR template
   - Link related issues
   - Request reviews
   - Ensure CI passes

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Environment variables validated
- [ ] No console errors or warnings
- [ ] TypeScript types are correct
- [ ] No breaking changes (or documented)

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex algorithms
- Explain "why" not just "what"
- Keep comments up-to-date with code

### API Documentation

- Update `API.md` for API changes
- Generate OpenAPI spec: `npm run openapi:generate`
- Include request/response examples

### User Documentation

- Update `README.md` for user-facing changes
- Add examples and use cases
- Keep setup instructions current

## Environment Variables

When adding new environment variables:

1. Add to `.env.example`
2. Add to `ENVIRONMENT.md`
3. Add validation in `frontend/lib/env.ts` (Zod schema)
4. Add validation in `backend/env_validator.py` (Pydantic)
5. Document in relevant code files

## Database Changes

When making database changes:

1. Create migration files (Prisma or Alembic)
2. Update Prisma schema if using Prisma
3. Test migrations up and down
4. Update RLS policies if needed
5. Document schema changes

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Follow security best practices
- Report security issues privately

## Questions?

- Check existing documentation
- Search closed issues
- Ask in discussions
- Create an issue for clarification

Thank you for contributing to Floyo! 🚀
