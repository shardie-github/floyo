#!/bin/bash
# Comprehensive linting and formatting script

set -e

echo "🔍 Running comprehensive linting and formatting..."

# Frontend linting
echo "📦 Linting frontend..."
cd frontend
npm run lint -- --fix || true
npm run type-check || true
cd ..

# Backend linting
echo "🐍 Linting backend..."
cd backend

# Format with black
echo "  Formatting with black..."
black . --line-length 100 || true

# Lint with ruff
echo "  Linting with ruff..."
ruff check . --fix || true

# Type checking (if mypy available)
if command -v mypy &> /dev/null; then
    echo "  Type checking with mypy..."
    mypy . --ignore-missing-imports || true
fi

cd ..

# Format markdown
echo "📝 Formatting markdown..."
if command -v prettier &> /dev/null; then
    prettier --write "**/*.md" || true
fi

echo "✅ Linting complete!"
