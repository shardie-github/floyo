# Quick Start Checklist - CI Cleanup

## 🎯 Goal
**Every PR to main runs a small, clear set of checks that almost always pass unless there is a real bug.**

---

## 📊 Current State Summary

- **42 workflows** → Target: **8 workflows**
- **Multiple overlapping checks** → Target: **Single source of truth**
- **Many failing checks** → Target: **Green by default**

---

## 🚀 Phase 1: Stop the Bleeding (This Week)

### Delete Legacy Workflows (15 min)
```bash
# Delete these files:
rm .github/workflows/orchestrate.yml
rm .github/workflows/orchestrator.yml
rm .github/workflows/remediation_orchestrator.yml
rm .github/workflows/aurora-prime.yml
rm .github/workflows/master-omega-prime.yml
rm .github/workflows/pr-auto-comments.yml
rm .github/workflows/final_assurance_release.yml
```

### Make Heavy Checks Scheduled-Only (30 min)
Edit these files to remove `pull_request` trigger, keep only `schedule`:
- `.github/workflows/integration-audit.yml`
- `.github/workflows/benchmarks.yml`
- `.github/workflows/meta-audit.yml`

### Fix Action Versions (15 min)
Search and replace in all workflows:
- `actions/setup-node@v3` → `actions/setup-node@v4`
- `actions/setup-python@v4` → `actions/setup-python@v5`
- `actions/checkout@v3` → `actions/checkout@v4`

### Make Docs Guard Non-Blocking (5 min)
Add `continue-on-error: true` to `.github/workflows/docs-guard.yml` jobs.

---

## 🔧 Phase 2: Consolidate Core CI (Next Week)

### Create Unified `ci.yml`
Replace `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd backend && pip install ruff black
          ruff check . && black --check .
      - run: |
          cd frontend && npm ci
          npm run lint && npm run format:check

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd backend && pip install mypy
          mypy backend/
      - run: |
          cd frontend && npm ci
          npm run type-check

  test-fast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd backend && pip install -r requirements.txt pytest
          pytest tests/unit/ -v
      - run: |
          cd frontend && npm ci
          npm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd frontend && npm ci
          npm run build
```

### Delete Overlapping Workflows
```bash
rm .github/workflows/pre-merge-checks.yml
rm .github/workflows/code-quality.yml
```

---

## 🧹 Phase 3: Fix Code Issues (Week 3)

### Run These Commands Locally First

```bash
# Python linting
cd backend
ruff check . --fix
black .

# TypeScript linting
cd frontend
npm run lint -- --fix
npm run format

# Type checking
cd backend
mypy backend/  # Fix all errors
cd ../frontend
npm run type-check  # Fix all errors

# Tests
cd backend
pytest tests/unit/ -v  # Fix failing tests
cd ../frontend
npm test  # Fix failing tests
```

---

## 📝 Local Dev Parity

### Add to `package.json`:
```json
{
  "scripts": {
    "ci": "npm run ci:backend && npm run ci:frontend",
    "ci:backend": "cd backend && ruff check . && black --check . && mypy backend/ && pytest tests/unit/",
    "ci:frontend": "cd frontend && npm run lint && npm run type-check && npm test && npm run build"
  }
}
```

### Run Before Pushing:
```bash
npm run ci
```

---

## ✅ Success Criteria

- [ ] Only 4 core checks run on PRs: lint, type-check, test-fast, build
- [ ] All checks pass >95% of the time
- [ ] CI runtime < 20 minutes
- [ ] No duplicate checks
- [ ] Local `npm run ci` matches CI exactly

---

## 📚 Full Plan

See `CI_CLEANUP_PLAN.md` for complete details.
