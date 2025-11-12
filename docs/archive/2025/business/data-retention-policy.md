> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Data Retention Policy — floyo

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready

---

## Overview

This policy defines data retention periods, deletion procedures, and data minimization practices for floyo.

**Principle:** Retain data only as long as necessary for service provision and legal compliance.

---

## 1. Data Retention Periods

### 1.1 Account Data
- **Retention:** While account is active
- **Deletion:** Within 30 days of account deletion request
- **Data Types:** Email address, subscription information, billing history

### 1.2 File System Data (Local)
- **Retention:** User-controlled (local-first architecture)
- **Deletion:** User controls deletion (Settings → Privacy → Clear Data)
- **Data Types:** File paths, access patterns, workflows (stored locally)

### 1.3 Telemetry Data (Optional, Opt-In)
- **Retention:** 12 months (if opt-in)
- **Deletion:** Anonymized or deleted after 12 months
- **Data Types:** Usage analytics, error logs, performance metrics

### 1.4 Support Data
- **Retention:** 3 years after ticket closure
- **Deletion:** Deleted after 3 years
- **Data Types:** Support tickets, email correspondence

### 1.5 Billing Data
- **Retention:** 7 years (tax compliance)
- **Deletion:** Retained for tax/legal compliance
- **Data Types:** Invoices, payment records, receipts

---

## 2. Data Deletion Procedures

### 2.1 Account Deletion
- **Request:** Settings → Account → Delete Account
- **Process:** 
  1. User confirms deletion
  2. Account flagged for deletion
  3. Data deleted within 30 days
  4. Confirmation email sent
- **Retention:** Billing data retained (7 years, tax compliance)

### 2.2 Data Export
- **Request:** Settings → Privacy → Export Data
- **Format:** JSON or CSV (selectable)
- **Contents:** Account info, patterns, workflows, telemetry (if opt-in)
- **Retention:** Export available for 30 days after request

### 2.3 Automated Deletion
- **Telemetry:** Deleted after 12 months (if opt-in)
- **Support Tickets:** Deleted after 3 years
- **Inactive Accounts:** Flagged after 2 years of inactivity

---

## 3. Data Minimization

### 3.1 Collection Principles
- **Minimal Collection:** Collect only necessary data
- **Purpose Limitation:** Use data only for stated purposes
- **Consent:** Obtain consent for optional data (telemetry)

### 3.2 Local-First Architecture
- **Local Processing:** File system data processed locally (not uploaded)
- **User Control:** User controls data retention (local storage)
- **Privacy:** No cloud dependency for file processing

---

## 4. PIPEDA Compliance

### 4.1 Individual Access Rights
- **Access:** Users can request access to their data (Settings → Privacy → Export Data)
- **Response Time:** Within 30 days (PIPEDA requirement)
- **Format:** Machine-readable format (JSON, CSV)

### 4.2 Deletion Rights
- **Deletion:** Users can request deletion (Settings → Account → Delete Account)
- **Response Time:** Within 30 days (PIPEDA requirement)
- **Retention:** Billing data retained (legal compliance)

---

## 5. Retention Exceptions

### 5.1 Legal Requirements
- **Billing Data:** Retained for 7 years (tax compliance)
- **Legal Holds:** Retained if required by law or court order
- **Dispute Resolution:** Retained until dispute resolved

### 5.2 Business Continuity
- **Backup Data:** Retained in backups (deleted according to backup retention policy)
- **Disaster Recovery:** Retained for disaster recovery (if applicable)

---

## 6. Data Retention Schedule

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| Account Data | While account active | Manual deletion (30 days) |
| File System Data (Local) | User-controlled | User-controlled |
| Telemetry Data (Opt-In) | 12 months | Automated deletion |
| Support Data | 3 years | Automated deletion |
| Billing Data | 7 years | Legal compliance |

---

## 7. Data Deletion Verification

### 7.1 Deletion Confirmation
- **Account Deletion:** Confirmation email sent
- **Data Export:** Export file available for 30 days
- **Audit Trail:** Deletion logged (for compliance)

### 7.2 Verification Process
- **Monthly:** Review deletion logs
- **Quarterly:** Audit data retention compliance
- **Annually:** Review retention policy

---

## 8. Backup and Recovery

### 8.1 Backup Retention
- **Frequency:** Daily (if cloud backup enabled)
- **Retention:** 30 days (if cloud backup enabled)
- **Deletion:** Backups deleted according to retention policy

### 8.2 Recovery Procedures
- **Data Recovery:** Available within 30 days (if backup enabled)
- **User Request:** User can request data recovery (within retention period)

---

## 9. Policy Updates

### 9.1 Review Frequency
- **Annual:** Review retention policy
- **As Needed:** Update based on legal requirements or feedback

### 9.2 Notification
- **Changes:** Email notification for material changes (30 days advance notice)
- **Effective Date:** Changes effective 30 days after notification

---

## 10. Contact Information

### 10.1 Data Deletion Requests
- **Email:** [YOUR-EMAIL]
- **Subject:** "Data Deletion Request"
- **Information Required:** Email address (for account verification)

### 10.2 Data Access Requests
- **Email:** [YOUR-EMAIL]
- **Subject:** "Data Access Request"
- **Information Required:** Email address (for account verification)

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
