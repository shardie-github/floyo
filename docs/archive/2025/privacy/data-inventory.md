> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Privacy Data Inventory

This document maps data fields to their purpose, retention period, and lawful basis.

## Data Categories

### 1. Privacy Preferences (`privacy_prefs`)

| Field | Purpose | Retention | Lawful Basis |
|-------|---------|-----------|--------------|
| `consentGiven` | Track user consent status | Until user deletion | Consent |
| `dataRetentionDays` | User-defined retention period | Until user deletion | Consent |
| `mfaRequired` | Security preference | Until user deletion | Legitimate interest (security) |
| `monitoringEnabled` | Current monitoring state | Until user deletion | Consent |
| `lastReviewedAt` | Track when user last reviewed settings | Until user deletion | Consent |

### 2. App Allowlist (`app_allowlist`)

| Field | Purpose | Retention | Lawful Basis |
|-------|---------|-----------|--------------|
| `appId` | Unique app identifier | User-defined retention | Consent |
| `appName` | Human-readable app name | User-defined retention | Consent |
| `enabled` | Whether app is monitored | User-defined retention | Consent |
| `scope` | Level of monitoring (metadata_only, metadata_plus_usage, none) | User-defined retention | Consent |

### 3. Signal Toggles (`signal_toggles`)

| Field | Purpose | Retention | Lawful Basis |
|-------|---------|-----------|--------------|
| `signalKey` | Telemetry signal identifier | User-defined retention | Consent |
| `enabled` | Whether signal is collected | User-defined retention | Consent |
| `samplingRate` | Percentage of events to collect (0.0-1.0) | User-defined retention | Consent |

### 4. Telemetry Events (`telemetry_events`)

| Field | Purpose | Retention | Lawful Basis |
|-------|---------|-----------|--------------|
| `timestamp` | When event occurred | User-defined retention (default 14 days) | Consent |
| `appId` | Which app generated event | User-defined retention | Consent |
| `eventType` | Type of event (focus_switch, duration, etc.) | User-defined retention | Consent |
| `durationMs` | Duration of app usage (if applicable) | User-defined retention | Consent |
| `metadataRedactedJson` | Redacted metadata (no passwords, tokens, etc.) | User-defined retention | Consent |

**What We DON'T Collect:**
- Passwords
- Message contents
- Screenshots
- Keystrokes
- Credit card numbers
- SSN or other PII

### 5. Transparency Log (`privacy_transparency_log`)

| Field | Purpose | Retention | Lawful Basis |
|-------|---------|-----------|--------------|
| `action` | What action was taken | 7 years (compliance) | Legal obligation |
| `resource` | What resource was affected | 7 years | Legal obligation |
| `oldValueHash` | Hash of state before change | 7 years | Legal obligation |
| `newValueHash` | Hash of state after change | 7 years | Legal obligation |
| `timestamp` | When action occurred | 7 years | Legal obligation |

### 6. MFA Sessions (`mfa_enforced_sessions`)

| Field | Purpose | Retention | Lawful Basis |
|-------|---------|-----------|--------------|
| `sessionToken` | Temporary elevated session token | 1 hour (then auto-deleted) | Legitimate interest (security) |
| `expiresAt` | When session expires | 1 hour | Legitimate interest (security) |

## Data Processing

### Collection Methods
- Direct user input (consent wizard, settings)
- Client-side telemetry collection (with user consent)
- Automatic redaction before storage

### Storage
- PostgreSQL database with RLS policies
- Encryption at rest (pgcrypto)
- Encryption in transit (HTTPS)

### Access
- **User**: Full access to own data only
- **System**: Health checks only (no user data)
- **Admins**: Zero access to user telemetry

### Deletion
- Automatic deletion based on retention period
- Manual deletion via user request
- Scheduled deletion (7-day grace period)
- Immediate deletion (with MFA)

## Third-Party Sharing

**We do not share user telemetry data with third parties.**

The only exceptions:
- User-initiated export (user downloads their own data)
- Legal requirement (with proper legal process)

## User Rights (GDPR/CCPA)

- **Right to Access**: Export data anytime
- **Right to Rectification**: Update preferences anytime
- **Right to Erasure**: Delete data anytime
- **Right to Portability**: Export in JSON format
- **Right to Object**: Disable monitoring anytime
- **Right to Restrict Processing**: Pause monitoring

## Data Minimization

- Only collect what user explicitly enables
- Default to metadata-only (no content)
- Sampling rates reduce data volume
- Automatic redaction of sensitive fields
- Retention period limits data lifetime

## Security Measures

- RLS policies (zero-trust)
- MFA for sensitive operations
- Encryption at rest and in transit
- Audit logging (transparency log)
- Kill-switch capability

## Changes to This Inventory

We will notify users before making material changes to data collection practices and update this inventory accordingly.

---

*Last updated: January 2024*
