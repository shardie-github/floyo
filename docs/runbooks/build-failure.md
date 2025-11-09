# Build Failure Incident Runbook

## Overview
This runbook addresses CI/CD build failures and deployment issues.

## Symptoms
- GitHub Actions workflows failing
- Build timeouts
- Test failures blocking deployments
- Deployment rollbacks

## Quick Checks

### 1. Check Current Build Status
```bash
# GitHub Actions
gh run list --limit 5

# Check specific workflow
gh run view <run-id>
```

### 2. Review Recent Changes
```bash
# Check recent commits
git log --oneline -10

# Check for dependency updates
git diff HEAD~1 package.json
git diff HEAD~1 requirements.txt
```

### 3. Check Build Logs
- GitHub Actions: View workflow logs
- Vercel: Check build logs in dashboard
- Expo: Check EAS build logs

## Diagnostic Steps

### Step 1: Identify Failure Type
1. **Test failures**: Check test output and coverage
2. **Build errors**: Review compilation errors
3. **Dependency issues**: Check for version conflicts
4. **Environment issues**: Verify secrets and env vars

### Step 2: Check Build Environment
```bash
# Verify Node/Python versions
node --version
python --version

# Check dependencies
npm ci
pip install -r requirements.txt
```

### Step 3: Review Error Messages
- Parse error stack traces
- Check for missing dependencies
- Verify environment variable availability
- Check for disk space or memory issues

## Remediation Actions

### Immediate (0-15 min)
1. **Revert** last commit if recent change caused failure
2. **Clear caches** (npm cache, GitHub Actions cache)
3. **Retry build** (may be transient)
4. **Check** for external service outages

### Short-term (15-60 min)
1. **Fix failing tests** or temporarily skip if non-critical
2. **Update dependencies** if version conflict
3. **Fix environment** variable issues
4. **Increase** build timeout if needed

### Long-term (Post-incident)
1. **Add** build health monitoring
2. **Implement** build time budgets
3. **Add** pre-commit hooks for common issues
4. **Document** build requirements

## What to Capture

### Metrics to Log
- Build duration and trends
- Failure rate by workflow
- Test pass/fail rates
- Dependency update frequency
- Cache hit rates

### Logs to Collect
```bash
# GitHub Actions logs
gh run view <run-id> --log > build-failure.log

# Local build reproduction
npm run build 2>&1 | tee build.log
```

### Screenshots/Dashboards
- GitHub Actions workflow status
- Build time trends
- Test coverage reports
- Dependency audit reports

## Common Failure Patterns

### Pattern 1: Dependency Version Conflicts
**Symptoms:** `npm ERR! peer dep missing` or `pip install conflicts`
**Fix:** Update `package.json` or `requirements.txt`, run `npm ci` or `pip install -r requirements.txt`

### Pattern 2: Test Failures
**Symptoms:** Tests failing in CI but passing locally
**Fix:** Check environment differences, flaky tests, timing issues

### Pattern 3: Build Timeouts
**Symptoms:** Build exceeds timeout limit
**Fix:** Optimize build steps, increase timeout, parallelize tasks

### Pattern 4: Missing Secrets
**Symptoms:** `process.env.SECRET is undefined`
**Fix:** Verify GitHub secrets, Vercel env vars, or Supabase keys

## Escalation

### When to Escalate
- Production deployment blocked >1 hour
- Multiple workflows failing
- Security-related build failures
- Data loss risk

### Escalation Path
1. **On-call engineer** (Slack: #incidents)
2. **DevOps lead** if build infra issue
3. **Team lead** if blocking release

## Post-Incident

### Follow-up Actions
- [ ] Root cause analysis document
- [ ] Update CI/CD configuration
- [ ] Add build health checks
- [ ] Update this runbook with learnings

### Prevention
- Set up alerts for build failures
- Weekly build health review
- Dependency update automation
- Build time monitoring

## Related Resources
- CI/CD Config: `.github/workflows/`
- Build Scripts: `package.json`, `scripts/`
- Test Config: `jest.config.js`, `pytest.ini`
- Deployment Guide: `docs/DEPLOYMENT.md`

---
*Last updated: {{DATE}}*
