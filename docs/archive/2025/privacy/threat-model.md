> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Privacy Threat Model

This document identifies threats, controls, and residual risks for the privacy-first monitoring system.

## Threat Categories

### 1. Authentication & Authorization

#### Threat: Token Theft
**Description**: Attacker steals user's authentication token and accesses their telemetry.

**Controls**:
- HTTPS-only for all API calls
- Secure token storage (httpOnly cookies preferred)
- Token expiration and refresh mechanisms
- MFA required for sensitive operations

**Residual Risk**: Low (mitigated by HTTPS and token expiration)

#### Threat: MFA Bypass
**Description**: Attacker bypasses MFA to perform sensitive operations.

**Controls**:
- Time-limited MFA sessions (1 hour)
- TOTP verification (not SMS-based)
- Separate MFA session tokens
- Audit logging of all MFA verifications

**Residual Risk**: Low (TOTP is cryptographically secure)

### 2. Data Access

#### Threat: Insider Access
**Description**: Admin or support staff accesses user telemetry.

**Controls**:
- RLS policies enforce user-only access
- No service_role bypass for telemetry tables
- Guardian role only for health checks (no user data)
- Audit logging of all access attempts

**Residual Risk**: Very Low (RLS policies prevent admin access)

#### Threat: Cross-User Access
**Description**: User A accesses User B's telemetry data.

**Controls**:
- RLS policies filter by `auth.uid()`
- All queries include user_id filter
- Negative tests verify cross-user access fails
- No shared data structures

**Residual Risk**: Very Low (RLS enforces isolation)

### 3. Data Collection

#### Threat: Collection Without Consent
**Description**: System collects telemetry without user consent.

**Controls**:
- Monitoring OFF by default
- Explicit opt-in required
- Kill-switch environment variable
- Client-side checks before sending

**Residual Risk**: Low (multiple safeguards)

#### Threat: Sensitive Data Collection
**Description**: System collects passwords, tokens, or other sensitive data.

**Controls**:
- Default to metadata-only
- Client-side redaction before send
- Database trigger auto-redaction
- Blocklist of sensitive field names

**Residual Risk**: Low (layered redaction)

### 4. Data Storage

#### Threat: Unencrypted Storage
**Description**: Telemetry stored in plaintext.

**Controls**:
- pgcrypto encryption for sensitive fields
- HTTPS for all connections
- Database-level encryption (if available)

**Residual Risk**: Low (encryption at rest)

#### Threat: Data Retention Violation
**Description**: Data kept longer than retention period.

**Controls**:
- Automated cleanup jobs
- User-defined retention periods
- Scheduled deletion functions
- Monitoring of retention job execution

**Residual Risk**: Low (automated cleanup)

### 5. Data Export & Deletion

#### Threat: Export Link Reuse
**Description**: Attacker reuses expired export link.

**Controls**:
- Time-limited signed URLs (1 hour expiry)
- Token-based export verification
- Expiry checks on every request

**Residual Risk**: Low (short expiry window)

#### Threat: Incomplete Deletion
**Description**: Data not fully deleted when user requests.

**Controls**:
- Cascade deletes via foreign keys
- Hard delete after soft delete period
- Verification queries after deletion
- Transparency log preserves deletion records

**Residual Risk**: Low (cascade deletes ensure completeness)

### 6. Inference Attacks

#### Threat: Pattern Inference
**Description**: Attacker infers sensitive information from patterns.

**Controls**:
- Sampling reduces signal
- Metadata-only mode limits detail
- User controls granularity
- No cross-user aggregation

**Residual Risk**: Medium (user controls reduce risk)

### 7. System Abuse

#### Threat: Data Flooding
**Description**: Attacker floods system with fake telemetry.

**Controls**:
- Rate limiting on telemetry endpoint
- Per-signal sampling rates
- User consent required
- Monitoring of unusual patterns

**Residual Risk**: Low (rate limiting and sampling)

#### Threat: Link Sharing
**Description**: User shares export link with unauthorized party.

**Controls**:
- Short expiry (1 hour)
- User authentication required
- Export links tied to user session

**Residual Risk**: Medium (user education needed)

## Control Effectiveness

### Strong Controls
- ✅ RLS policies (zero-trust)
- ✅ MFA enforcement
- ✅ Encryption at rest and in transit
- ✅ Kill-switch capability

### Moderate Controls
- ⚠️ Client-side redaction (can be bypassed)
- ⚠️ Sampling rates (reduces but doesn't eliminate data)

### Areas for Improvement
- 📝 User education on link sharing
- 📝 Enhanced pattern inference protections
- 📝 More granular signal controls

## Residual Risk Summary

| Threat Category | Residual Risk | Notes |
|----------------|---------------|-------|
| Authentication | Low | HTTPS + MFA |
| Data Access | Very Low | RLS policies |
| Data Collection | Low | Multiple safeguards |
| Data Storage | Low | Encryption |
| Export/Delete | Low | Time-limited links |
| Inference | Medium | User controls help |
| System Abuse | Low | Rate limiting |

## Compliance Notes

- GDPR: Consent-based, right to deletion, data portability
- CCPA: Opt-in, deletion rights, transparency
- SOC 2: Access controls, encryption, audit logging

## Continuous Monitoring

- Regular RLS policy audits
- MFA bypass attempt monitoring
- Unusual access pattern detection
- Retention job execution verification
- Export link usage tracking

---

*Last updated: January 2024*
