# Supply Chain & SBOM Summary

## Dependency Analysis

### Python Dependencies (Backend)

| Package | Version | Status | Risk | Notes |
|---------|---------|--------|------|-------|
| fastapi | >=0.104.1 | Current | Low | Actively maintained |
| uvicorn[standard] | >=0.24.0 | Current | Low | Actively maintained |
| sqlalchemy | >=2.0.23 | Current | Low | Actively maintained |
| psycopg2-binary | >=2.9.9 | Current | Medium | Binary package, platform-specific |
| alembic | >=1.12.1 | Current | Low | Actively maintained |
| python-jose[cryptography] | >=3.3.0 | Current | Low | Actively maintained |
| passlib[bcrypt] | >=1.7.4 | Current | Medium | Last update 2021, but stable |
| python-multipart | >=0.0.6 | Current | Low | Actively maintained |
| pydantic | >=2.5.0 | Current | Low | Actively maintained |
| pydantic-settings | >=2.1.0 | Current | Low | Actively maintained |
| websockets | >=12.0 | Current | Low | Actively maintained |
| sentry-sdk[fastapi] | >=1.40.0 | Current | Low | Actively maintained |
| slowapi | >=0.1.9 | Current | Medium | Low activity, but simple package |
| redis | >=5.0.1 | Current | Low | Actively maintained |
| hiredis | >=2.2.3 | Current | Low | Actively maintained |
| celery | >=5.3.4 | Current | Low | Actively maintained |
| flower | >=2.0.1 | Current | Medium | Low activity, but stable |
| croniter | >=2.0.1 | Current | Low | Actively maintained |
| watchdog | >=2.1.0 | Current | Low | Actively maintained |
| pyyaml | >=6.0 | Current | Medium | Has known CVE history, but current version safe |
| toml | >=0.10.2 | Current | Low | Actively maintained |
| pytest | >=7.0.0 | Current | Low | Actively maintained |
| pytest-cov | >=4.0.0 | Current | Low | Actively maintained |
| pytest-asyncio | >=0.21.1 | Current | Low | Actively maintained |
| httpx | >=0.25.1 | Current | Low | Actively maintained |
| faker | >=22.0.0 | Current | Low | Actively maintained |

**Risky Dependencies:**
1. **passlib[bcrypt]** - Last update 2021, but stable and widely used
2. **pyyaml** - Has CVE history, but current version (>=6.0) is safe
3. **slowapi** - Low activity, but simple package with minimal surface area
4. **flower** - Low activity, but stable

### JavaScript Dependencies (Frontend)

| Package | Version | Status | Risk | Notes |
|---------|---------|--------|------|-------|
| next | ^14.0.4 | Current | Low | Actively maintained |
| react | ^18.2.0 | Current | Low | Actively maintained |
| react-dom | ^18.2.0 | Current | Low | Actively maintained |
| @tanstack/react-query | ^5.12.2 | Current | Low | Actively maintained |
| axios | ^1.6.2 | Current | Low | Actively maintained |
| zustand | ^4.4.7 | Current | Low | Actively maintained |
| socket.io-client | ^4.6.1 | Current | Low | Actively maintained |
| recharts | ^2.10.3 | Current | Low | Actively maintained |
| date-fns | ^2.30.0 | Current | Medium | v2 is stable but v3 exists |
| next-intl | ^3.19.1 | Current | Low | Actively maintained |
| @headlessui/react | ^1.7.17 | Current | Low | Actively maintained |
| @heroicons/react | ^2.1.1 | Current | Low | Actively maintained |
| tailwindcss | ^3.3.6 | Current | Low | Actively maintained |
| autoprefixer | ^10.4.16 | Current | Low | Actively maintained |
| postcss | ^8.4.32 | Current | Low | Actively maintained |
| clsx | ^2.0.0 | Current | Low | Actively maintained |
| @playwright/test | ^1.40.0 | Current | Low | Actively maintained |
| @testing-library/react | ^14.1.2 | Current | Low | Actively maintained |
| @testing-library/jest-dom | ^6.1.5 | Current | Low | Actively maintained |
| @testing-library/user-event | ^14.5.1 | Current | Low | Actively maintained |
| jest | ^29.7.0 | Current | Low | Actively maintained |
| typescript | ^5.3.3 | Current | Low | Actively maintained |
| eslint | ^8.56.0 | Current | Medium | v9 exists, but v8 is stable |
| next-pwa | ^5.6.0 | Current | Medium | Low activity, but stable |

**Risky Dependencies:**
1. **date-fns** - v2 is stable but v3 exists (may want to upgrade)
2. **eslint** - v9 exists, but v8 is stable
3. **next-pwa** - Low activity, but stable

### Deprecated Dependencies

**None detected** - All dependencies are current and maintained.

### Unmaintained Dependencies

**None detected** - All dependencies have recent updates.

### License Summary

#### Python Dependencies (Backend)
- **Apache 2.0:** fastapi, uvicorn, sqlalchemy, alembic, pydantic, celery, etc.
- **MIT:** Most JavaScript-like packages, pytest, etc.
- **BSD:** psycopg2-binary, watchdog
- **GPL/LGPL:** None detected

**License Conflicts:** None detected - all licenses are compatible.

#### JavaScript Dependencies (Frontend)
- **MIT:** next, react, react-dom, axios, zustand, etc.
- **Apache 2.0:** @tanstack/react-query
- **ISC:** socket.io-client
- **BSD:** tailwindcss, postcss

**License Conflicts:** None detected - all licenses are compatible.

## Security Vulnerabilities

### Known CVEs

**Note:** This is a static analysis. For production, run:
- `pip-audit` for Python dependencies
- `npm audit` for JavaScript dependencies

**Recommended Actions:**
1. Run `pip-audit` regularly
2. Run `npm audit` regularly
3. Set up Dependabot or Renovate for automated updates
4. Pin exact versions in production (use `==` instead of `>=`)

### Dependency Pinning Strategy

**Current State:**
- Python: Uses `>=` (minimum version)
- JavaScript: Uses `^` (compatible version)

**Risk:**
- Unpinned dependencies can update to breaking changes
- Different environments may have different versions

**Proposed:**
1. Use `requirements-lock.txt` for Python (pip-tools)
2. Use `package-lock.json` for JavaScript (already exists)
3. Pin exact versions in production
4. Use `>=` in development, `==` in production

## Upgrade Plan

### High Priority Upgrades

1. **None** - All dependencies are current

### Medium Priority Upgrades

1. **date-fns** - Consider upgrading to v3 (breaking changes)
2. **eslint** - Consider upgrading to v9 (breaking changes)
3. **passlib[bcrypt]** - Monitor for updates (stable but old)

### Low Priority Upgrades

1. **slowapi** - Monitor for updates (low activity)
2. **flower** - Monitor for updates (low activity)
3. **next-pwa** - Monitor for updates (low activity)

## Dependency Recommendations

### Add for Production

1. **pip-audit** - Security vulnerability scanning
2. **safety** - Alternative security scanner
3. **dependabot** - Automated dependency updates
4. **renovate** - Alternative to Dependabot

### Remove (if unused)

1. **gzip-middleware** - Listed in requirements but not used (GZipMiddleware from FastAPI used instead)

## SBOM Generation

**Current State:**
- CI generates SBOMs (`cyclonedx-bom` for Python, `cyclonedx-npm` for JavaScript)
- SBOMs uploaded as artifacts in CI

**Proposed:**
1. Commit SBOMs to repo (for supply chain security)
2. Add SBOM validation in CI
3. Use SBOMs for license compliance

## License Compliance

**Current State:**
- All licenses are compatible (Apache 2.0, MIT, BSD)
- No GPL/LGPL dependencies detected

**Proposed:**
1. Add license check to CI
2. Generate license report
3. Document license compatibility

## Supply Chain Risk Assessment

### Overall Risk: **Low**

**Reasons:**
- All dependencies are actively maintained
- No deprecated or unmaintained packages
- Licenses are compatible
- No known CVEs in current versions

**Recommendations:**
1. Set up automated dependency updates (Dependabot/Renovate)
2. Run security scans regularly (`pip-audit`, `npm audit`)
3. Pin exact versions in production
4. Monitor for security advisories

## Dependency Count

- **Python:** 25+ dependencies
- **JavaScript:** 30+ dependencies
- **Total:** 55+ dependencies

**Risk Level:** Medium (manageable but requires monitoring)
