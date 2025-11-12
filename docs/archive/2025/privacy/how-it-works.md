> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Privacy-First Monitoring: How It Works

## Overview

This document explains the technical flow of privacy-first monitoring from consent to data analysis.

## Flow Diagram

```
User Consent → App Allowlist → Signal Toggles → Local Redaction → Store → Analysis → Suggestions
```

## Detailed Flow

### 1. Consent Setup

User goes through multi-step wizard:
- Step 1: Understand purpose and benefits
- Step 2: Select apps to monitor
- Step 3: Choose telemetry signals
- Step 4: Set data retention period
- Step 5: MFA verification

All preferences stored in `privacy_prefs` table with RLS policies ensuring user-only access.

### 2. Local-First Processing

Before sending telemetry to server:
- Client-side redaction removes sensitive fields (passwords, tokens, etc.)
- Sampling rate applied based on signal toggle settings
- Metadata-only mode strips content, keeps only structural data

### 3. Storage

Telemetry events stored in `telemetry_events` table:
- Encrypted at rest using pgcrypto
- RLS policies enforce user-only access
- No admin/service role bypass
- Automatic redaction via database triggers

### 4. Transparency Log

Every action logged to `privacy_transparency_log`:
- Consent changes
- App enable/disable
- Signal toggles
- Data exports
- Data deletions
- Immutable append-only log

### 5. Analysis & Suggestions

Background jobs analyze telemetry (with user's explicit consent):
- Pattern detection
- Workflow suggestions
- Only uses user's own data
- No cross-user aggregation

### 6. Data Retention

Automated cleanup:
- Respects user's retention period
- Deletes old telemetry events
- Preserves transparency log (for compliance)

## Security Features

- **Zero Trust**: Every table has RLS policies
- **No Admin Bypass**: Even service_role cannot read user telemetry
- **MFA Enforcement**: Required for sensitive operations
- **Encryption**: At rest (pgcrypto) and in transit (HTTPS)
- **Kill Switch**: Environment variable disables all collection

## Privacy Guarantees

1. **User-Only Access**: RLS policies ensure only the user can read their data
2. **No Content Collection**: By default, only metadata (no passwords, messages, etc.)
3. **Granular Control**: Per-app and per-signal toggles
4. **Transparency**: Immutable log of all actions
5. **Data Sovereignty**: Export and delete anytime
