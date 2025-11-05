# Trust & Transparency

**Last Updated:** 2025-01-XX  
**Version:** 1.0

## Product Promises

### What We Do

We provide a privacy-first platform that:
- ✅ Gives you control over your data
- ✅ Encrypts your data at rest and in transit
- ✅ Provides transparency about data access
- ✅ Allows you to export or delete your data at any time
- ✅ Respects your privacy preferences
- ✅ Follows security best practices

### What We Don't Do

We will never:
- ❌ Sell your personal data to third parties
- ❌ Access your data without your explicit consent
- ❌ Store passwords or sensitive credentials in plain text
- ❌ Share your data with advertisers
- ❌ Use your data for purposes other than providing the service

## Data Map

### Categories of Data Collected

| Category | Purpose | Storage Location | Retention |
|----------|---------|------------------|-----------|
| **Account Data** | Authentication, account management | Supabase (encrypted) | Until account deletion |
| **Usage Events** | Service improvement, analytics (opt-in) | Supabase (encrypted) | 14 days (configurable) |
| **Privacy Preferences** | Respecting user choices | Supabase (encrypted) | Until account deletion |
| **Audit Logs** | Security, compliance | Supabase (encrypted) | 90 days |

### Data Processing Purposes

1. **Service Delivery:** To provide core functionality
2. **Security:** To detect and prevent abuse
3. **Analytics (Opt-in):** To improve user experience
4. **Compliance:** To meet legal obligations

### International Transfers

Data is stored in Supabase data centers. We use standard contractual clauses (SCCs) and other appropriate safeguards for international transfers.

## Consent Model

### Consent Types

1. **Functional:** Required for core service (no opt-out)
2. **Analytics:** Optional, user-controlled
3. **Marketing:** Optional, user-controlled

### Consent Management

- Consent can be managed in Settings → Privacy
- Consent can be withdrawn at any time
- Withdrawing consent stops future processing but may limit functionality

### Consent Toggles

- **Analytics:** Enable/disable usage analytics
- **Marketing:** Enable/disable marketing communications
- **Functional:** Cannot be disabled (required for service)

## Security Posture

### Authentication

- Multi-factor authentication (MFA) available
- Single Sign-On (SSO) support (enterprise)
- Password requirements: minimum 12 characters, complexity required

### Access Control

- Row-Level Security (RLS) enabled on all tables
- Least privilege principle applied
- Role-based access control (RBAC) for organizations

### Encryption

- **At Rest:** AES-256 encryption
- **In Transit:** TLS 1.3 for all connections
- **Database:** Encrypted volumes

### Audit Logging

- All user actions logged
- Accessible via `/account/audit-log`
- Retention: 90 days
- Exportable via API

### Secret Handling

- Secrets stored in environment variables
- No secrets in code or logs
- Key rotation policy: quarterly
- Dependency scanning: automated weekly

## SLA/SLO Overview

### Service Level Objectives (SLOs)

- **Availability:** 99.9% uptime (target)
- **Latency:** P95 < 500ms
- **Error Rate:** < 0.1%

### Error Budgets

- Error budget calculated monthly
- Budget consumed by incidents and planned maintenance
- Alerts trigger when budget is at risk

### Incident Communication

- Status page: `/status`
- Incident updates posted within 30 minutes
- Post-mortems published within 7 days

See [STATUS.md](./STATUS.md) for detailed incident communication procedures.

## Data Subject Rights

### Your Rights

Under GDPR/PIPEDA and similar regulations, you have the right to:

1. **Access:** Request a copy of your data
2. **Rectification:** Correct inaccurate data
3. **Erasure:** Delete your data
4. **Portability:** Export your data
5. **Restriction:** Limit processing of your data
6. **Objection:** Object to certain processing

### How to Exercise Your Rights

1. **Export Data:** Visit `/account/export` or use `/api/privacy/export`
2. **Delete Data:** Visit Settings → Privacy → Delete Account or use `/api/privacy/delete`
3. **Rectify Data:** Update your profile in Settings
4. **Request Access:** Contact support with your request

### Response Times

- Export requests: Processed within 30 days
- Deletion requests: Processed within 30 days
- Access requests: Responded within 30 days

### Data Portability

- Export format: JSON
- Includes: Account data, usage events, preferences
- Excludes: Audit logs (for security reasons)

## Contact

For privacy questions or to exercise your rights:
- Email: privacy@example.com
- Support: support@example.com
- Data Protection Officer: dpo@example.com

## Changes

We will notify you of material changes to this trust document:
- Email notification for significant changes
- In-app notification for minor updates
- 30-day notice period for major changes

---

*This document is a living document and will be updated as our practices evolve.*
