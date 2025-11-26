# GitHub Actions Production Readiness Automation

This document outlines all the automated GitHub Actions workflows that ensure production readiness and maintain code quality.

## 🆕 New Automations Added

### 1. **Dependabot Configuration** (`.github/dependabot.yml`)
- **Purpose**: Automatically creates PRs for dependency updates
- **Frequency**: Weekly (Mondays at 9 AM)
- **Coverage**: 
  - npm (frontend and root)
  - pip (backend)
  - GitHub Actions
- **Features**:
  - Groups minor/patch updates together
  - Ignores major updates for critical packages (React, Next.js, FastAPI)
  - Auto-labels PRs with `dependencies` and `automated`
  - Limits open PRs to prevent spam

### 2. **Auto Label PRs** (`.github/workflows/auto-label-pr.yml`)
- **Purpose**: Automatically labels PRs based on changed files and content
- **Triggers**: PR opened, synchronized, or reopened
- **Labels Applied**:
  - File-based: `frontend`, `backend`, `infrastructure`, `database`, `documentation`, `yc`, `scripts`, `tests`, `dependencies`, `security`
  - Size-based: `size/XS`, `size/S`, `size/M`, `size/L`, `size/XL`
  - Content-based: `breaking-change`, `security`
- **Benefits**: Better PR organization and filtering

### 3. **Stale PR & Branch Cleanup** (`.github/workflows/stale-cleanup.yml`)
- **Purpose**: Keeps repository clean by removing inactive PRs and branches
- **Frequency**: Weekly (Mondays at 2 AM UTC)
- **Features**:
  - Marks PRs stale after 30 days of inactivity
  - Closes stale PRs after 7 additional days
  - Deletes merged branches older than 30 days
  - Exempts protected branches and labeled PRs (`pinned`, `security`, `dependencies`)

### 4. **Documentation Link Checker** (`.github/workflows/docs-link-check.yml`)
- **Purpose**: Validates all markdown links in documentation
- **Triggers**: 
  - PRs that modify markdown files
  - Pushes to main
  - Weekly schedule (Sundays at 3 AM UTC)
- **Features**:
  - Checks all `.md` files
  - Ignores localhost and mailto links
  - Retries on 429 errors
  - Generates reports

### 5. **Changelog Generator** (`.github/workflows/changelog-generator.yml`)
- **Purpose**: Automatically generates changelog entries and release notes
- **Triggers**: 
  - Tag pushes (e.g., `v1.0.0`)
  - Manual workflow dispatch
- **Features**:
  - Generates changelog from git commits
  - Creates GitHub releases with release notes
  - Updates `CHANGELOG.md` automatically
  - Supports draft/prerelease flags

### 6. **Schema Drift Detection** (`.github/workflows/schema-drift-detection.yml`)
- **Purpose**: Detects inconsistencies between Prisma schema and database
- **Triggers**:
  - PRs modifying schema or migrations
  - Pushes to main
  - Daily schedule (4 AM UTC)
- **Features**:
  - Validates Prisma schema format
  - Checks migration file ordering
  - Detects schema drift
  - Comments on PRs with results

### 7. **Production Readiness Check** (`.github/workflows/production-readiness-check.yml`)
- **Purpose**: Comprehensive checklist ensuring PRs are production-ready
- **Triggers**: PR opened, synchronized, or reopened
- **Checks**:
  - ✅ Required files exist (`.env.example`, `README.md`, etc.)
  - ✅ Environment variables documented
  - ✅ GitHub Secrets configured
  - ✅ Documentation present
  - ✅ Tests exist
  - ✅ Build succeeds
- **Output**: 
  - PR comment with detailed report
  - GitHub Check status
  - Step summary in workflow run

## 📋 Existing Workflows (Already in Place)

1. **CI** (`ci.yml`) - Linting, type checking, tests
2. **Security Scanning** (`security-scan.yml`) - Vulnerability scanning
3. **Metrics Auto-Update** (`metrics-auto-update.yml`) - Auto-updates metrics docs
4. **Environment Validation** (`env-validation.yml`) - Validates env vars
5. **Supabase Migrations** (`supabase-migrate.yml`) - Applies migrations
6. **Weekly Maintenance** (`weekly-maint.yml`) - SBOM, license scanning
7. **System Health** (`system_health.yml`) - Weekly health reports

## 🎯 Benefits

### For Developers
- **Less Manual Work**: Dependencies update automatically
- **Better Organization**: PRs auto-labeled for easy filtering
- **Cleaner Repo**: Stale branches cleaned up automatically
- **Faster Feedback**: Production readiness checks run on every PR

### For Production
- **Higher Quality**: Multiple automated checks prevent issues
- **Better Documentation**: Link checker ensures docs stay valid
- **Consistent Releases**: Automated changelog generation
- **Schema Safety**: Drift detection prevents database issues

### For Maintenance
- **Security**: Regular dependency updates
- **Compliance**: License scanning and SBOM generation
- **Health**: Weekly system health reports

## 🚀 Quick Start

All workflows are **automatically enabled** and will run based on their triggers. No manual setup required!

### Manual Triggers

Some workflows can be triggered manually:

```bash
# Generate changelog for a version
gh workflow run changelog-generator.yml -f version=v1.0.0

# Run production readiness check
gh workflow run production-readiness-check.yml

# Run stale cleanup
gh workflow run stale-cleanup.yml

# Check documentation links
gh workflow run docs-link-check.yml
```

### Configuration Files

- **`.github/dependabot.yml`**: Dependency update settings
- **`.github/labeler.yml`**: PR labeling rules
- **`.github/labeler-size.yml`**: PR size labeling rules
- **`.markdown-link-check.json`**: Link checker configuration

## 📊 Monitoring

View workflow status:
- GitHub Actions tab: `https://github.com/[owner]/[repo]/actions`
- Individual workflow runs show detailed logs
- PR comments provide quick feedback

## 🔧 Customization

### Adjust Dependabot Frequency
Edit `.github/dependabot.yml`:
```yaml
schedule:
  interval: "daily"  # or "weekly", "monthly"
```

### Modify Stale PR Timing
Edit `.github/workflows/stale-cleanup.yml`:
```yaml
days-before-pr-stale: 30  # Change to your preference
days-before-pr-close: 7   # Change to your preference
```

### Add Custom Labels
Edit `.github/labeler.yml` to add new file-based labels.

## ✅ Production Readiness Checklist

Before marking a PR as ready, ensure:
- [ ] All CI checks pass
- [ ] Production readiness check passes
- [ ] No security vulnerabilities
- [ ] Documentation links valid
- [ ] Schema changes validated
- [ ] Tests pass
- [ ] Build succeeds

---

**Last Updated**: $(date +%Y-%m-%d)
**Status**: ✅ All automations active and ready
