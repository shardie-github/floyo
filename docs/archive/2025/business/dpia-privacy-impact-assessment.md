> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Data Protection Impact Assessment (DPIA) — floyo

**Assessment Date:** January 2024  
**Version:** 1.0.0  
**Status:** Completed

---

## Executive Summary

floyo is a local-first workflow automation tool that processes file system data locally on users' devices. This DPIA assesses privacy risks and compliance with PIPEDA and other applicable privacy laws.

**Key Findings:**
- **Risk Level:** Low (local-first architecture minimizes data exposure)
- **Compliance Status:** PIPEDA compliant
- **Recommendations:** Continue local-first approach, maintain opt-in telemetry, regular privacy audits

---

## 1. Processing Overview

### 1.1 Purpose of Processing
- File system monitoring (user-configured directories)
- Pattern detection (temporal sequences, file relationships)
- Integration suggestions (API integrations with sample code)
- Workflow execution (local, no cloud dependency)

### 1.2 Data Subjects
- Solo operators, freelancers, small teams
- Privacy-conscious professionals
- Canadian users (primary), international users (secondary)

### 1.3 Types of Personal Data
- **Account Information:** Email address (minimal)
- **File System Data:** File paths, access patterns (processed locally, not uploaded)
- **Telemetry Data:** Optional usage analytics (opt-in only)
- **Billing Information:** Processed by Stripe (we do not store)

---

## 2. Legal Basis for Processing

### 2.1 Consent
- **File System Monitoring:** Explicit consent (user configures directories)
- **Telemetry:** Opt-in consent (granular controls)
- **Account Creation:** Explicit consent (user creates account)

### 2.2 Legitimate Interests
- **Service Provision:** Necessary to provide floyo functionality
- **Product Improvement:** Telemetry (opt-in) improves product features
- **Legal Compliance:** PIPEDA, CASL compliance

---

## 3. Privacy Risks Assessment

### 3.1 Risk 1: Unauthorized File System Access
- **Risk Level:** Low
- **Description:** File system monitoring could expose sensitive files
- **Mitigation:**
  - User configures monitored directories (explicit consent)
  - Exclusion patterns (user can exclude sensitive directories)
  - Local processing only (no cloud upload)
- **Residual Risk:** Low

### 3.2 Risk 2: Telemetry Data Collection
- **Risk Level:** Low
- **Description:** Optional telemetry could collect sensitive usage data
- **Mitigation:**
  - Opt-in only (default: off)
  - Granular controls (usage vs. errors)
  - Anonymized data (no personal identifiers)
  - 12-month retention, then deletion
- **Residual Risk:** Low

### 3.3 Risk 3: Data Loss or Corruption
- **Risk Level:** Medium
- **Description:** Local storage could be lost or corrupted
- **Mitigation:**
  - Encrypted local storage (AES-256)
  - Optional cloud backup (user-controlled)
  - Data export functionality
  - User responsible for backups (disclosed in Terms)
- **Residual Risk:** Medium (acceptable, user-controlled)

### 3.4 Risk 4: Third-Party Service Providers
- **Risk Level:** Low
- **Description:** Stripe (payment processing) may process personal data
- **Mitigation:**
  - Stripe is PIPEDA-compliant (or equivalent)
  - We do not store payment details
  - Contractual obligations (data protection agreements)
- **Residual Risk:** Low

---

## 4. Compliance Assessment

### 4.1 PIPEDA Compliance
- ✅ **Accountability:** Privacy Policy, contact information
- ✅ **Identifying Purposes:** Clear purpose limitation (Privacy Policy)
- ✅ **Consent:** Explicit consent (opt-in for telemetry, file system)
- ✅ **Limiting Collection:** Minimal data collection (email, opt-in telemetry)
- ✅ **Limiting Use, Disclosure, Retention:** Purpose limitation, 12-month retention
- ✅ **Accuracy:** User can update information (Settings)
- ✅ **Safeguards:** Encryption, local-first architecture
- ✅ **Openness:** Privacy Policy, transparency
- ✅ **Individual Access:** Data export, access requests
- ✅ **Challenging Compliance:** Contact [YOUR-EMAIL]

**Compliance Status:** ✅ Compliant

### 4.2 CASL Compliance
- ✅ **Consent:** Opt-in for marketing emails
- ✅ **Unsubscribe:** Provided in every email
- ✅ **Contact Information:** Included in emails
- ✅ **Record-Keeping:** Consent records maintained

**Compliance Status:** ✅ Compliant

---

## 5. Technical Safeguards

### 5.1 Encryption
- **Local Storage:** AES-256 encryption
- **Transmission:** HTTPS (TLS 1.3) for telemetry (if opt-in)
- **Backup:** Encrypted cloud backup (optional, user-controlled)

### 5.2 Access Controls
- **User Authentication:** Email/password (strong password requirements)
- **File System Access:** User-configured directories only
- **Admin Access:** Limited to support (no file system access)

### 5.3 Data Minimization
- **Account Information:** Email only (minimal)
- **File System Data:** Processed locally (not uploaded)
- **Telemetry:** Opt-in only, anonymized

---

## 6. Organizational Safeguards

### 6.1 Privacy Training
- Solo operator (self-training on PIPEDA, CASL)
- Regular privacy audits (quarterly)

### 6.2 Privacy Policy
- Comprehensive Privacy Policy (PIPEDA-compliant)
- Regular updates (as needed)

### 6.3 Incident Response
- Data breach response plan (see Risk Register)
- Notification procedures (PIPEDA requirements)

---

## 7. Data Subject Rights

### 7.1 Access Rights
- Data export functionality (Settings → Privacy → Export Data)
- Access requests (contact [YOUR-EMAIL])

### 7.2 Correction Rights
- User can update information (Settings → Account)
- Correction requests (contact [YOUR-EMAIL])

### 7.3 Deletion Rights
- Account deletion (Settings → Account → Delete Account)
- Deletion requests (contact [YOUR-EMAIL])

### 7.4 Portability Rights
- Data export (JSON, CSV formats)
- Machine-readable format

---

## 8. Recommendations

### 8.1 Immediate Actions
- ✅ Privacy Policy published
- ✅ Terms of Service published
- ✅ Consent mechanisms implemented (opt-in telemetry)
- ✅ Data export functionality implemented

### 8.2 Short-Term (Q1-Q2 2024)
- Regular privacy audits (quarterly)
- User privacy education (documentation, tutorials)
- Incident response plan (documented)

### 8.3 Long-Term (Q3-Q4 2024)
- Privacy impact assessments (annual)
- Third-party privacy audits (if scale requires)
- Privacy-by-design principles (feature development)

---

## 9. Approval and Sign-Off

**Assessed By:** [YOUR-NAME]  
**Date:** January 2024  
**Status:** ✅ Approved

**Next Review:** April 2024 (quarterly)

---

## 10. Appendices

### Appendix A: Data Processing Inventory
- Account information: Email (minimal)
- File system data: Local processing only (not uploaded)
- Telemetry data: Opt-in only, anonymized

### Appendix B: Third-Party Processors
- Stripe: Payment processing (PIPEDA-compliant)
- Email provider: Support emails (if applicable)

### Appendix C: Legal Basis Table
| Processing Activity | Legal Basis | Consent Required |
|---------------------|-------------|------------------|
| Account creation | Consent | Yes (explicit) |
| File system monitoring | Consent | Yes (explicit, configurable) |
| Telemetry | Consent | Yes (opt-in) |
| Payment processing | Contract | No (necessary for service) |

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
