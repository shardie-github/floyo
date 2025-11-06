# Code Quality Standards

## Overview

This document outlines the code quality standards, linting rules, and formatting conventions for the Floyo codebase.

---

## 🎯 Standards

### Python (Backend)

#### Formatting
- **Tool:** Black (line length: 100)
- **Import Sorting:** ruff (isort compatible)
- **Type Hints:** Required for all public functions

#### Linting
- **Tool:** ruff
- **Rules:** pycodestyle, pyflakes, flake8-bugbear, comprehensions
- **Docstrings:** Google style (enforced by ruff)

#### Code Style
```python
# ✅ Good
def process_events(
    db: Session,
    user_id: UUID,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Process user events with limit."""
    ...

# ❌ Bad
def processEvents(db, user_id, limit=100):
    ...
```

#### File Organization
- **Max Line Length:** 100 characters
- **Imports:** Standard library → Third-party → Local
- **Functions:** Max 50 statements, 8 arguments
- **Classes:** Max 15 attributes

### TypeScript/JavaScript (Frontend)

#### Formatting
- **Tool:** Prettier
- **Config:** `.prettierrc.json`
- **Line Length:** 100 characters

#### Linting
- **Tool:** ESLint with Next.js config
- **Rules:** TypeScript strict mode, React hooks rules

#### Code Style
```typescript
// ✅ Good
interface UserProps {
  userId: string;
  name: string;
}

export function UserComponent({ userId, name }: UserProps) {
  const [loading, setLoading] = useState(false);
  ...
}

// ❌ Bad
function UserComponent(props) {
  var loading = false;
  ...
}
```

#### File Organization
- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utils:** camelCase (e.g., `formatDate.ts`)
- **Types:** PascalCase (e.g., `User.ts`)

---

## 🔧 Tools

### Setup

```bash
# Install Python tools
pip install black ruff mypy

# Install frontend tools
cd frontend && npm install
```

### Running Linters

```bash
# Run all linting
./scripts/lint-all.sh

# Backend only
cd backend
black . --check
ruff check .
mypy . --ignore-missing-imports

# Frontend only
cd frontend
npm run lint
npm run type-check
```

---

## 📋 Pre-commit Checklist

Before committing code:

- [ ] Code formatted (Black/Prettier)
- [ ] Linting passes (ruff/ESLint)
- [ ] Type checking passes (mypy/TypeScript)
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No console.log/print statements (use logger)
- [ ] No commented-out code
- [ ] No hardcoded secrets/keys

---

## 🎨 Best Practices

### Error Handling
```python
# ✅ Good
try:
    result = process_data(data)
except ValueError as e:
    logger.error(f"Invalid data: {e}")
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal error")
```

### Logging
```python
# ✅ Good
logger.info("Processing workflow", extra={"workflow_id": workflow_id})
logger.error("Workflow failed", exc_info=True, extra={"error": str(e)})

# ❌ Bad
print(f"Processing {workflow_id}")
```

### Type Hints
```python
# ✅ Good
def create_user(
    db: Session,
    email: str,
    password: str
) -> User:
    ...

# ❌ Bad
def create_user(db, email, password):
    ...
```

### Documentation
```python
# ✅ Good
def predict_workflow_need(
    events: List[Dict[str, Any]],
    model: Any
) -> Dict[str, Any]:
    """Predict if workflow will be needed based on events.
    
    Args:
        events: List of recent event dictionaries
        model: Trained ML model
        
    Returns:
        Dictionary with prediction probability and confidence
    """
    ...
```

---

## 🚫 Code Smells to Avoid

### Python
- ❌ Magic numbers (use constants)
- ❌ Long functions (>50 lines)
- ❌ Deep nesting (>3 levels)
- ❌ Unused imports
- ❌ Bare except clauses
- ❌ Mutable default arguments

### TypeScript
- ❌ `any` types (use `unknown` or proper types)
- ❌ `console.log` (use logger)
- ❌ Inline styles (use Tailwind classes)
- ❌ Unused variables
- ❌ Missing error boundaries
- ❌ Missing accessibility attributes

---

## 📊 Quality Metrics

### Coverage Targets
- **Unit Tests:** >80%
- **Integration Tests:** >60%
- **E2E Tests:** Critical paths

### Performance Targets
- **API Response:** <200ms (p95)
- **Page Load:** <2s
- **ML Inference:** <100ms
- **Database Queries:** <50ms

---

## 🔄 Continuous Improvement

- Weekly code reviews
- Monthly dependency updates
- Quarterly architecture review
- Regular refactoring sprints

---

See `.prettierrc.json`, `.eslintrc.json`, `ruff.toml`, and `.pylintrc` for detailed configuration.
