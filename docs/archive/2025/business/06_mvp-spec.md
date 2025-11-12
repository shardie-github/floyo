> Archived on 2025-11-12. Superseded by: (see docs/final index)

# MVP Specification — floyo

## Overview

**MVP Goal:** Launch a local-first workflow automation tool that detects file system patterns and suggests API integrations with sample code.

**Target Users:** Solo operators, freelancers, privacy-conscious professionals  
**Launch Timeline:** Q1 2024  
**Success Metrics:** 100 active users (WAU), 40% activation rate, 25% 7-day retention

---

## In Scope (MVP)

### Core Features

#### 1. File System Monitoring
- **Description:** Monitor file access, creation, modification, deletion in configurable directories
- **Acceptance Criteria:**
  - User can configure monitored directories (include/exclude patterns)
  - Real-time file system events captured (watchdog-based)
  - Events logged locally (encrypted storage)
  - Configurable monitoring (start/stop, pause/resume)
- **Technical Notes:**
  - Use Python `watchdog` library
  - Store events in local SQLite database (encrypted)
  - Support exclusion patterns (`.git/`, `node_modules/`, etc.)

#### 2. Pattern Detection Engine
- **Description:** Detect temporal sequences, file relationships, and usage patterns
- **Acceptance Criteria:**
  - Temporal patterns detected (e.g., "Every Monday, Word doc created → Python script runs")
  - File relationships detected (input/output, dependencies)
  - Pattern confidence scoring (low/medium/high)
  - Patterns displayed in UI with explanations
- **Technical Notes:**
  - Pattern detection algorithm (temporal clustering, relationship graph)
  - Minimum 3 occurrences for pattern detection (configurable)
  - Pattern confidence based on frequency and consistency

#### 3. Integration Suggestions
- **Description:** Suggest API integrations based on detected patterns
- **Acceptance Criteria:**
  - Suggestions generated for detected patterns
  - Sample code provided (Python, JavaScript, Shell)
  - Integration steps documented (API setup, authentication)
  - One-click approval workflow (user approves → code generated)
- **Technical Notes:**
  - Integration template library (Word → Python → Dropbox, etc.)
  - Code generation engine (template-based)
  - API documentation integration (OpenAPI, REST)

#### 4. Workflow Execution (Local)
- **Description:** Execute approved workflows locally (no cloud dependency)
- **Acceptance Criteria:**
  - User can approve suggested workflows
  - Workflow executes locally (Python/Node.js runtime)
  - Execution logs available (success/failure)
  - Error handling and retry logic
- **Technical Notes:**
  - Local execution engine (sandboxed)
  - API key management (local storage, encrypted)
  - Workflow scheduler (cron-like, local)

#### 5. Basic UI (Desktop App)
- **Description:** Desktop application for monitoring, suggestions, and workflow management
- **Acceptance Criteria:**
  - Dashboard showing detected patterns
  - Suggestions list with approval workflow
  - Workflow execution status
  - Configuration UI (directories, exclusions)
- **Technical Notes:**
  - Electron-based desktop app (cross-platform)
  - React frontend (TypeScript)
  - Local backend API (Python FastAPI)

#### 6. Privacy & Consent
- **Description:** PIPEDA-compliant privacy controls and consent management
- **Acceptance Criteria:**
  - Consent-gated telemetry (opt-in, granular controls)
  - Privacy policy displayed (PIPEDA-compliant)
  - Data export functionality (user can export all data)
  - Data deletion functionality (user can delete all data)
- **Technical Notes:**
  - Telemetry opt-in toggle (default: off)
  - Privacy policy embedded in app
  - Data export format (JSON, CSV)

---

## Out of Scope (Post-MVP)

### Phase 2 Features (Q2 2024)
- Cloud backup toggle (optional cloud sync)
- Workflow marketplace (community-shared workflows)
- Team collaboration features
- Advanced analytics dashboard
- Mobile app (iOS/Android)

### Phase 3 Features (Q3-Q4 2024)
- Enterprise features (SSO, SAML)
- API access for developers
- Workflow versioning and rollback
- Advanced pattern detection (ML-based)
- Integration marketplace (third-party integrations)

---

## Acceptance Criteria

### Functional Requirements
- ✅ File system monitoring works for configurable directories
- ✅ Pattern detection identifies at least 3 types of patterns (temporal, relational, dependency)
- ✅ Integration suggestions include sample code for 5+ common integrations
- ✅ Workflow execution succeeds for approved workflows (local)
- ✅ UI displays patterns, suggestions, and workflow status
- ✅ Privacy controls allow opt-in telemetry and data export/deletion

### Non-Functional Requirements
- ✅ Performance: Pattern detection completes within 5 seconds for 1000+ events
- ✅ Privacy: All data stored locally (no cloud dependency)
- ✅ Security: Local storage encrypted (AES-256)
- ✅ Reliability: Workflow execution success rate ≥ 95%
- ✅ Usability: Onboarding completes in < 5 minutes

---

## Day-1 Integrations

### MVP Integrations (In Scope)
1. **File Operations**
   - Move files between directories
   - Copy files with transformations
   - Delete files based on patterns

2. **Dropbox API**
   - Upload files to Dropbox
   - Download files from Dropbox
   - List files in Dropbox folder

3. **Python Script Execution**
   - Execute Python scripts locally
   - Pass file paths as arguments
   - Capture output and errors

4. **Microsoft Word (via COM/API)**
   - Create Word documents
   - Modify Word documents
   - Extract text from Word documents

5. **Email (SMTP)**
   - Send emails with attachments
   - Email notifications for workflow completion

### Post-MVP Integrations (Out of Scope)
- Google Drive API
- Slack API
- GitHub API
- Stripe API (webhooks)
- Zapier webhooks (for hybrid workflows)

---

## Technical Constraints

### Offline-First
- **Requirement:** Core functionality works offline (no internet required)
- **Implementation:** Local file system monitoring, local pattern detection, local workflow execution
- **Exception:** API integrations require internet (but workflow execution is local)

### Small App Constraints
- **Requirement:** Desktop app < 100MB install size
- **Implementation:** Minimal dependencies, code splitting, lazy loading
- **Optimization:** Electron app optimization, tree-shaking

### Privacy & Consent
- **Requirement:** Consent-gated telemetry (opt-in)
- **Implementation:** Telemetry toggle in settings, granular consent (usage vs. errors)
- **Default:** Telemetry off (privacy-first)

### Cloud Backup Toggle (Post-MVP)
- **Requirement:** Optional cloud backup (user choice)
- **Implementation:** Encrypted cloud sync (Supabase/self-hosted), user controls
- **Timeline:** Q2 2024

---

## Risks & Mitigations

### Risk 1: Pattern Detection Accuracy
- **Risk:** Low accuracy (false positives/negatives)
- **Impact:** User frustration, low activation rate
- **Mitigation:** 
  - Start with high-confidence patterns (≥5 occurrences)
  - User feedback loop (thumbs up/down on suggestions)
  - Iterative improvement based on usage data

### Risk 2: File System Performance
- **Risk:** File system monitoring impacts system performance
- **Impact:** User complaints, uninstall rate
- **Mitigation:**
  - Efficient monitoring (watchdog, event-driven)
  - Configurable exclusions (ignore large directories)
  - Performance monitoring (CPU/memory usage)

### Risk 3: Integration Complexity
- **Risk:** Sample code doesn't work out-of-the-box
- **Impact:** Low activation rate, support burden
- **Mitigation:**
  - Thorough testing of sample code templates
  - Clear documentation (setup steps, API keys)
  - Community support (forum, Discord)

### Risk 4: Privacy Compliance
- **Risk:** PIPEDA compliance gaps
- **Impact:** Legal risk, user trust issues
- **Mitigation:**
  - Legal review of privacy policy
  - Privacy impact assessment (DPIA)
  - Regular compliance audits

### Risk 5: Local Storage Scalability
- **Risk:** Local database grows large (performance issues)
- **Impact:** App slowdown, user frustration
- **Mitigation:**
  - Data retention policies (configurable)
  - Database optimization (indexing, archiving)
  - Optional cloud backup (post-MVP)

---

## Success Metrics

### Activation Metrics
- **Activation Rate:** ≥ 40% (user completes first workflow)
- **Time to First Workflow:** < 24 hours (from install)
- **Pattern Detection Rate:** ≥ 60% (users see at least one pattern)

### Retention Metrics
- **7-Day Retention:** ≥ 25%
- **30-Day Retention:** ≥ 15%
- **Weekly Active Users (WAU):** 100+ (30 days post-launch)

### Engagement Metrics
- **Workflows Created:** ≥ 2 per active user (30 days)
- **Suggestions Approved:** ≥ 1 per active user (30 days)
- **Support Tickets:** < 5% of active users (30 days)

---

## Launch Checklist

### Pre-Launch
- [ ] File system monitoring tested (Windows, macOS, Linux)
- [ ] Pattern detection accuracy validated (test dataset)
- [ ] Integration suggestions tested (5+ integrations)
- [ ] Privacy policy reviewed (legal)
- [ ] PIPEDA compliance verified
- [ ] Performance testing completed (1000+ events)
- [ ] Security audit completed (encryption, storage)

### Launch Day
- [ ] App Store listings submitted (Apple, Google Play)
- [ ] Website live (landing page, waitlist)
- [ ] Privacy policy published
- [ ] Support email configured
- [ ] Analytics configured (consent-gated)

### Post-Launch (Week 1)
- [ ] Monitor activation rate (target: ≥ 40%)
- [ ] Collect user feedback (surveys, support)
- [ ] Fix critical bugs (priority P0)
- [ ] Update documentation (FAQ, tutorials)

---

*Last Updated: 2024-01-XX*  
*Version: 1.0.0*
