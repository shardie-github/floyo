# PR Plan: Final Repairs for Release Gate

**Date**: 2025-11-04  
**Purpose**: Address critical blockers preventing release  
**Status**: **REQUIRED BEFORE RELEASE**

## Overview

This document outlines the PR plan to resolve the 4 **CRITICAL** security issues blocking the release gate. All issues must be resolved before the release can proceed.

## Release Gate Status

- **Readiness Score**: 95/100 ✅ (Above threshold)
- **Critical Blockers**: 4 ❌ (Blocking release)
- **Gate Status**: **FAIL**

## Critical Issues to Resolve

### 1. ISSUE-259A405C: Hardcoded password in backup_database.py

**File**: `scripts/backup_database.py`  
**Severity**: Critical  
**Risk Score**: 90  
**Owner**: @data-team

**Action Required**:
- [ ] Review `scripts/backup_database.py` for hardcoded credentials
- [ ] Remove any hardcoded passwords
- [ ] Use environment variables or secure credential management
- [ ] Update documentation to reflect credential requirements

**PR Title**: `fix(security): Remove hardcoded password from backup_database.py`

---

### 2. ISSUE-D18C22C6: Hardcoded password in main.py

**File**: `backend/main.py`  
**Severity**: Critical  
**Risk Score**: 90  
**Owner**: @backend-team

**Action Required**:
- [ ] Review `backend/main.py` for hardcoded credentials
- [ ] Remove any hardcoded passwords
- [ ] Ensure all credentials come from environment variables
- [ ] Verify configuration loading uses secure methods

**PR Title**: `fix(security): Remove hardcoded password from main.py`

---

### 3. ISSUE-E3FA37E5: Hardcoded secret key in generate_fixes.py

**File**: `docs/audit_investor_suite/generate_fixes.py`  
**Severity**: Critical  
**Risk Score**: 90  
**Owner**: @engineering-team

**Action Required**:
- [ ] Review `docs/audit_investor_suite/generate_fixes.py` for hardcoded secrets
- [ ] Remove any hardcoded secret keys
- [ ] Use environment variables or configuration files (not in repo)
- [ ] Add to `.gitignore` if needed

**PR Title**: `fix(security): Remove hardcoded secret key from generate_fixes.py`

---

### 4. ISSUE-D39DC5D9: Default SECRET_KEY in .env.example

**File**: `.env.example`  
**Severity**: Critical  
**Risk Score**: 90  
**Owner**: @engineering-team

**Action Required**:
- [ ] Review `.env.example` for default/example secret keys
- [ ] Replace with placeholder values (e.g., `CHANGE_ME` or `your-secret-key-here`)
- [ ] Add comments warning against using default values
- [ ] Ensure `.env.example` is never used in production

**PR Title**: `fix(security): Remove default SECRET_KEY from .env.example`

---

## PR Workflow

### Step 1: Create Branch
```bash
git checkout -b fix/critical-security-issues
```

### Step 2: Fix Issues
- Address each critical issue in separate commits (or combined if related)
- Follow security best practices
- Add tests if applicable

### Step 3: Verification
```bash
# Verify no secrets in codebase
grep -r "password\|secret\|key" --include="*.py" --include="*.js" --include="*.ts" | grep -v "node_modules" | grep -v ".git"

# Run readiness check
python3 infra/release/compute_readiness.py

# Verify gate passes
# Should show: Gate Status: PASS
```

### Step 4: Create PR
- Title: `fix(security): Resolve critical security vulnerabilities blocking release`
- Description: Reference this PR plan and all 4 issues
- Labels: `security`, `critical`, `release-blocker`
- Request review from: @security-team, @backend-team, @data-team

### Step 5: Merge & Verify
- After merge, re-run readiness assessment
- Verify gate passes (score ≥ 90 AND zero critical blockers)
- Proceed with release if gate passes

## Testing Checklist

- [ ] No hardcoded credentials in codebase
- [ ] Environment variables used for all secrets
- [ ] `.env.example` contains placeholders only
- [ ] No secrets in git history (verify with `git log -S "password"`)
- [ ] Readiness score ≥ 90
- [ ] Zero critical blockers in ISSUE_REGISTER.json
- [ ] All tests pass
- [ ] Security scan passes (if available)

## Security Best Practices

1. **Never commit secrets** to repository
2. **Use environment variables** for all credentials
3. **Rotate credentials** if any were exposed
4. **Use secret management** services in production (AWS Secrets Manager, HashiCorp Vault, etc.)
5. **Add secret scanning** to CI/CD pipeline
6. **Document** credential requirements in README

## Timeline

**Estimated Time**: 2-4 hours
- Review and fix: 1-2 hours
- Testing and verification: 1 hour
- PR review and merge: 1 hour

**Priority**: **CRITICAL** - Blocks release

## Post-Fix Verification

After fixes are merged:

```bash
# 1. Check readiness
python3 infra/release/compute_readiness.py
# Expected: Score ≥ 90, Gate Status: PASS

# 2. Verify no critical blockers
jq '.critical_blockers' docs/audit_investor_suite/READINESS.json
# Expected: 0

# 3. Update ISSUE_REGISTER.json
# Mark resolved issues as "closed" status
```

## Related Documentation

- `docs/audit_investor_suite/ISSUE_REGISTER.json` - Full issue register
- `docs/audit_investor_suite/PROJECT_CLOSURE_SUMMARY.md` - Closure summary
- `SECURITY.md` - Security policy
- `infra/release/compute_readiness.py` - Readiness calculator

---

**Status**: Ready for Implementation  
**Priority**: CRITICAL  
**Blocking**: Release gate
