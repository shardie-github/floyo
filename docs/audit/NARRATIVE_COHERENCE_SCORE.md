# Narrative Coherence Score

## Overall Score: 6/10

### Rationale

**Strengths (+4 points):**
- Clear README with installation and quick start
- ADRs document architectural decisions
- System diagram shows high-level architecture
- Developer guide exists
- User guide exists

**Weaknesses (-4 points):**
- API documentation scattered (OpenAPI generated, not documented)
- No clear data flow diagrams for complex workflows
- Missing architecture overview document
- Versioning strategy unclear (api_v1.py stub)
- No boot sequence documentation
- Missing runbook for common operations

## Discoverability Assessment

### Can a new dev find data flow? **Partially (4/10)**

**Finding:**
- System diagram shows high-level components but not data flow
- No sequence diagrams for user journeys
- Event tracking flow not documented
- Pattern analysis flow not documented

**Proposed Fix:**
- Add sequence diagrams to `docs/ARCHITECTURE.md`
- Document data flow: CLI → API → DB → Pattern Analysis → Suggestions
- Add flow diagrams for: registration, event tracking, workflow execution

### Can a new dev find boot path? **Good (7/10)**

**Finding:**
- `README.md` has installation steps
- `docker-compose.yml` shows service dependencies
- `backend/main.py` shows initialization order
- Missing: startup sequence documentation, environment variable requirements

**Proposed Fix:**
- Add `docs/BOOT_SEQUENCE.md` with startup order
- Document required vs optional environment variables
- Add troubleshooting guide for common startup issues

### Can a new dev find run commands? **Good (7/10)**

**Finding:**
- `README.md` has quick start commands
- `package.json` has npm scripts
- `docker-compose.yml` shows service commands
- Missing: development workflow, testing commands, deployment commands

**Proposed Fix:**
- Add `docs/DEVELOPMENT.md` with common commands
- Document testing workflow
- Add deployment checklist

## Priority Doc Patches to Reach +2 Score (8/10)

### 1. Architecture Overview Document
**File:** `docs/ARCHITECTURE.md` (new)
**Content:**
- System overview with data flow
- Component responsibilities
- Technology stack
- Deployment architecture
- Sequence diagrams for key flows

**Effort:** M (1-2 days)

### 2. Boot Sequence Documentation
**File:** `docs/BOOT_SEQUENCE.md` (new)
**Content:**
- Startup order (database → backend → frontend)
- Required environment variables
- Health check endpoints
- Troubleshooting common startup issues

**Effort:** S (0.5 days)

### 3. API Documentation
**File:** `docs/API.md` (new)
**Content:**
- API versioning strategy (explain api_v1.py stub)
- Authentication flow
- Endpoint catalog (reference OpenAPI)
- Rate limiting
- Error handling

**Effort:** M (1 day)

### 4. Data Flow Diagrams
**File:** `docs/DATA_FLOW.md` (new)
**Content:**
- Event tracking flow
- Pattern analysis flow
- Suggestion generation flow
- Workflow execution flow

**Effort:** S (0.5 days)

### 5. Development Workflow
**File:** `docs/DEVELOPMENT.md` (new)
**Content:**
- Local setup
- Testing workflow
- Code organization
- Common commands
- Debugging tips

**Effort:** S (0.5 days)

### 6. Runbook for Operations
**File:** `docs/RUNBOOK.md` (new)
**Content:**
- Common operations (deploy, rollback, backup)
- Troubleshooting guide
- Monitoring setup
- Incident response

**Effort:** M (1 day)

## Critical Logic Lacking Documentation

### 1. Pattern Analysis Algorithm
**File:** `floyo/suggester.py`, `backend/main.py:1087-1104`
**Issue:** Suggestion generation logic not documented
**Proposed:** Add docstring explaining algorithm, add to `docs/ALGORITHMS.md`

### 2. Workflow Execution Logic
**File:** `backend/workflow_scheduler.py`
**Issue:** Cron logic and execution steps not documented
**Proposed:** Add docstring, add sequence diagram

### 3. Rate Limiting Strategy
**File:** `backend/rate_limit.py`
**Issue:** Rate limits and per-instance behavior not documented
**Proposed:** Add to `docs/API.md`, document Redis-backed option

### 4. Cache Strategy
**File:** `backend/cache.py`
**Issue:** Cache TTL, invalidation strategy not documented
**Proposed:** Add to `docs/ARCHITECTURE.md`, document cache keys

### 5. Database Schema Evolution
**File:** `database/models.py`, `migrations/`
**Issue:** Migration strategy and schema evolution not documented
**Proposed:** Add to `docs/DATABASE.md`, document migration process

## Documentation Gaps by Category

### Architecture Documentation
- [ ] Complete architecture overview
- [ ] Data flow diagrams
- [x] System diagram (exists but incomplete)
- [ ] Deployment architecture
- [ ] Scaling strategy

### API Documentation
- [x] OpenAPI/Swagger (auto-generated)
- [ ] API versioning strategy
- [ ] Authentication flow
- [ ] Rate limiting documentation
- [ ] Error handling guide

### Development Documentation
- [x] Developer guide (exists)
- [ ] Development workflow
- [ ] Testing strategy
- [ ] Code organization
- [ ] Debugging guide

### Operations Documentation
- [ ] Runbook
- [ ] Monitoring setup
- [ ] Backup/restore procedures
- [ ] Incident response
- [ ] Troubleshooting guide

### Algorithm Documentation
- [ ] Pattern analysis algorithm
- [ ] Suggestion generation algorithm
- [ ] Workflow execution logic
- [ ] Fraud scoring algorithm (if implemented)

## Proposed README Sections

### Add to `README.md`:

1. **Architecture Overview**
   - Link to `docs/ARCHITECTURE.md`
   - Quick system diagram

2. **Development**
   - Link to `docs/DEVELOPMENT.md`
   - Quick start commands

3. **API Documentation**
   - Link to `/docs` (Swagger UI)
   - Link to `docs/API.md`

4. **Deployment**
   - Link to `docs/DEPLOYMENT.md`
   - Quick deployment commands

## Human Legibility Checklist

### Code Comments
- [ ] Complex algorithms documented (pattern analysis, suggestion generation)
- [ ] Business logic explained (workflow execution)
- [ ] Configuration options documented (env vars)
- [ ] Error handling documented (exception handling)

### Documentation Structure
- [x] README exists and is clear
- [x] ADRs exist for key decisions
- [ ] Architecture overview exists
- [x] Developer guide exists
- [x] User guide exists
- [ ] API documentation exists (needs expansion)
- [ ] Operations runbook exists

### Onboarding Time Estimate

**Current:** 2-3 days for a new developer to understand the system
**Target:** 1 day for a new developer to understand the system

**Gaps:**
- Missing architecture overview
- Missing data flow diagrams
- Missing development workflow
- Missing API documentation

**Proposed Fixes:**
- Add architecture overview (1 day)
- Add data flow diagrams (0.5 days)
- Add development workflow (0.5 days)
- Expand API documentation (1 day)

## Narrative Coherence Score Breakdown

| Category | Score | Max | Notes |
|----------|-------|-----|-------|
| README Quality | 8 | 10 | Good quick start, missing architecture overview |
| Architecture Docs | 5 | 10 | ADRs exist, but no overview document |
| API Documentation | 6 | 10 | OpenAPI exists, but no narrative docs |
| Development Docs | 7 | 10 | Developer guide exists, but missing workflow |
| Operations Docs | 3 | 10 | No runbook, no troubleshooting guide |
| Code Comments | 6 | 10 | Some comments, but complex logic undocumented |
| **Total** | **6.0** | **10** | **Needs improvement in operations and architecture docs** |
