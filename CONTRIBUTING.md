# Contributing

Thank you for your interest in contributing to this project!

## Getting Started

1. **Fork the repository**
2. **Clone your fork**: `git clone https://github.com/your-username/repo.git`
3. **Create a branch**: `git checkout -b feature/your-feature-name`
4. **Make your changes**
5. **Test your changes**
6. **Commit**: Use conventional commits (see below)
7. **Push**: `git push origin feature/your-feature-name`
8. **Open a Pull Request**

## Development Setup

See [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) for detailed setup instructions.

### Quick Start

```bash
# Install dependencies
pip install -r requirements.txt
cd frontend && npm install

# Run tests
pytest
cd frontend && npm test

# Run linters
flake8 backend/
cd frontend && npm run lint
```

## Code Style

### Python
- Follow PEP 8
- Use type hints where possible
- Run `black` and `flake8` before committing

### TypeScript/JavaScript
- Follow ESLint configuration
- Use TypeScript for new code
- Run `npm run lint` before committing

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example:
```
feat(api): add user authentication endpoint
fix(backend): resolve database connection timeout
docs(readme): update installation instructions
```

## Pull Request Process

1. **Update Documentation**: If adding features, update relevant docs
2. **Add Tests**: Include tests for new functionality
3. **Ensure CI Passes**: All checks must pass
4. **Get Review**: Wait for at least one maintainer approval
5. **Squash Commits**: Maintainers may squash on merge

## Code Review Guidelines

- Be respectful and constructive
- Ask questions if something is unclear
- Suggest improvements, not just point out issues
- Focus on the code, not the person

## Questions?

Open an issue with the `question` label or start a GitHub Discussion.
