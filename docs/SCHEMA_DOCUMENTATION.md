# Database Schema Documentation

**Last Updated:** 2025-01-XX  
**Database:** PostgreSQL (via Supabase)  
**ORM:** Prisma

---

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Privacy Tables](#privacy-tables)
4. [Extended Tables](#extended-tables)
5. [Relationships](#relationships)
6. [Indexes](#indexes)
7. [Constraints](#constraints)
8. [Migrations](#migrations)

---

## Overview

Floyo uses PostgreSQL as its primary database, managed through Supabase. The schema is defined in Prisma (`prisma/schema.prisma`) and synchronized with Supabase migrations.

### Key Principles

- **Row-Level Security (RLS):** All tables have RLS policies
- **Cascading Deletes:** Related data is cleaned up automatically
- **Timestamps:** All tables track `createdAt` and `updatedAt`
- **UUIDs:** All primary keys use UUIDs
- **Indexes:** Optimized for common query patterns

---

## Core Tables

### `users`

User accounts and authentication.

**Columns:**
- `id` (UUID, PK) - Unique user identifier
- `email` (String, Unique) - User email address
- `emailVerified` (Boolean) - Email verification status
- `passwordHash` (String, Nullable) - Hashed password (null for OAuth)
- `name` (String, Nullable) - User display name
- `image` (String, Nullable) - Profile image URL
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `email` - For login lookups

**Relationships:**
- One-to-many: `events`, `patterns`, `relationships`, `sessions`
- One-to-one: `privacyPrefs`, `subscriptions`

**RLS Policies:**
- Users can only read/update their own data
- Service role can read all data

---

### `sessions`

Authentication sessions.

**Columns:**
- `id` (UUID, PK) - Session identifier
- `userId` (UUID, FK → users.id) - User reference
- `token` (String, Unique) - Session token
- `expiresAt` (DateTime) - Session expiration
- `createdAt` (DateTime) - Session creation timestamp

**Indexes:**
- `userId` - For user session lookups
- `token` - For token validation

**Relationships:**
- Many-to-one: `users`

**RLS Policies:**
- Users can only access their own sessions

---

### `events`

File system events tracking.

**Columns:**
- `id` (UUID, PK) - Event identifier
- `userId` (UUID, FK → users.id) - User reference
- `filePath` (String) - File path
- `eventType` (String) - Event type (created, modified, accessed, deleted)
- `tool` (String, Nullable) - Tool used
- `timestamp` (DateTime) - Event timestamp
- `metadata` (JSON, Nullable) - Additional event data

**Indexes:**
- `(userId, timestamp)` - For user event queries
- `filePath` - For file-based queries

**Relationships:**
- Many-to-one: `users`

**RLS Policies:**
- Users can only access their own events

---

### `patterns`

Detected file usage patterns.

**Columns:**
- `id` (UUID, PK) - Pattern identifier
- `userId` (UUID, FK → users.id) - User reference
- `fileExtension` (String) - File extension pattern
- `count` (Int) - Usage count
- `lastUsed` (DateTime) - Last usage timestamp
- `tools` (String[]) - Tools used with this pattern
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user pattern queries
- Unique: `(userId, fileExtension)` - One pattern per extension per user

**Relationships:**
- Many-to-one: `users`

**RLS Policies:**
- Users can only access their own patterns

---

### `relationships`

File relationships and dependencies.

**Columns:**
- `id` (UUID, PK) - Relationship identifier
- `userId` (UUID, FK → users.id) - User reference
- `sourceFile` (String) - Source file path
- `targetFile` (String) - Target file path
- `relationType` (String) - Relationship type
- `weight` (Float) - Relationship strength (0.0-1.0)
- `lastSeen` (DateTime) - Last observation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user relationship queries
- Unique: `(userId, sourceFile, targetFile)` - One relationship per pair

**Relationships:**
- Many-to-one: `users`

**RLS Policies:**
- Users can only access their own relationships

---

### `subscriptions`

User subscription and billing information.

**Columns:**
- `id` (UUID, PK) - Subscription identifier
- `userId` (UUID, FK → users.id, Unique) - User reference
- `plan` (String) - Plan type (free, pro, enterprise)
- `status` (String) - Status (active, canceled, past_due)
- `stripeId` (String, Nullable, Unique) - Stripe subscription ID
- `currentPeriodStart` (DateTime, Nullable) - Current period start
- `currentPeriodEnd` (DateTime, Nullable) - Current period end
- `cancelAtPeriodEnd` (Boolean) - Cancel at period end flag
- `createdAt` (DateTime) - Subscription creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user subscription lookups

**Relationships:**
- One-to-one: `users`

**RLS Policies:**
- Users can only access their own subscriptions

---

## Privacy Tables

### `privacy_prefs`

User privacy preferences.

**Columns:**
- `id` (UUID, PK) - Preference identifier
- `userId` (UUID, FK → users.id, Unique) - User reference
- `consentGiven` (Boolean) - Consent status
- `dataRetentionDays` (Int) - Data retention period
- `mfaRequired` (Boolean) - MFA requirement
- `lastReviewedAt` (DateTime, Nullable) - Last review timestamp
- `monitoringEnabled` (Boolean) - Monitoring enabled flag
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user preference lookups

**Relationships:**
- One-to-one: `users`
- One-to-many: `appAllowlists`, `signalToggles`, `telemetryEvents`, `privacyTransparencyLogs`

**RLS Policies:**
- Users can only access their own preferences

---

### `app_allowlist`

App-specific monitoring permissions.

**Columns:**
- `id` (UUID, PK) - Allowlist entry identifier
- `userId` (UUID, FK → privacy_prefs.userId) - User reference
- `appId` (String) - Application identifier
- `appName` (String) - Application name
- `enabled` (Boolean) - Monitoring enabled flag
- `scope` (String) - Monitoring scope (metadata_only, metadata_plus_usage, none)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user allowlist queries
- Unique: `(userId, appId)` - One entry per app per user

**Relationships:**
- Many-to-one: `privacy_prefs`

**RLS Policies:**
- Users can only access their own allowlists

---

### `signal_toggles`

Signal-specific monitoring controls.

**Columns:**
- `id` (UUID, PK) - Toggle identifier
- `userId` (UUID, FK → privacy_prefs.userId) - User reference
- `signalKey` (String) - Signal key (e.g., window_titles, durations)
- `enabled` (Boolean) - Signal enabled flag
- `samplingRate` (Float) - Sampling rate (0.0-1.0)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user signal queries
- Unique: `(userId, signalKey)` - One toggle per signal per user

**Relationships:**
- Many-to-one: `privacy_prefs`

**RLS Policies:**
- Users can only access their own toggles

---

### `telemetry_events`

Telemetry event data.

**Columns:**
- `id` (UUID, PK) - Event identifier
- `userId` (UUID, FK → privacy_prefs.userId) - User reference
- `timestamp` (DateTime) - Event timestamp
- `appId` (String) - Application identifier
- `eventType` (String) - Event type
- `durationMs` (Int, Nullable) - Event duration
- `metadataRedactedJson` (JSON, Nullable) - Redacted metadata
- `createdAt` (DateTime) - Creation timestamp

**Indexes:**
- `(userId, timestamp)` - For user event queries
- `appId` - For app-based queries
- `timestamp` - For time-based queries

**Relationships:**
- Many-to-one: `privacy_prefs`

**RLS Policies:**
- Users can only access their own events

---

## Extended Tables

### `organizations`

Organization/team management.

**Columns:**
- `id` (UUID, PK) - Organization identifier
- `name` (String) - Organization name
- `slug` (String, Unique) - URL-friendly identifier
- `plan` (String) - Plan type (free, pro, enterprise)
- `settings` (JSON, Nullable) - Organization settings
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `slug` - For organization lookups

**Relationships:**
- One-to-many: `organizationMembers`, `workflows`, `userIntegrations`

**RLS Policies:**
- Members can read organization data
- Only admins can update

---

### `workflows`

Workflow definitions.

**Columns:**
- `id` (UUID, PK) - Workflow identifier
- `userId` (UUID, Nullable, FK → users.id) - User reference
- `organizationId` (UUID, Nullable, FK → organizations.id) - Organization reference
- `name` (String) - Workflow name
- `description` (String, Nullable) - Workflow description
- `definition` (JSON) - Workflow definition/configuration
- `isActive` (Boolean) - Active status
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user workflow queries
- `organizationId` - For organization workflow queries
- `isActive` - For active workflow queries

**Relationships:**
- Many-to-one: `users`, `organizations`
- One-to-many: `workflowVersions`, `workflowExecutions`

**RLS Policies:**
- Users can access their own workflows
- Organization members can access org workflows

---

### `user_integrations`

User integration connections.

**Columns:**
- `id` (UUID, PK) - Integration identifier
- `userId` (UUID, Nullable, FK → users.id) - User reference
- `organizationId` (UUID, Nullable, FK → organizations.id) - Organization reference
- `provider` (String) - Integration provider (zapier, tiktok, meta, etc.)
- `name` (String) - Integration name
- `config` (JSON) - Encrypted configuration/credentials
- `isActive` (Boolean) - Active status
- `lastSyncAt` (DateTime, Nullable) - Last sync timestamp
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

**Indexes:**
- `userId` - For user integration queries
- `organizationId` - For organization integration queries
- `provider` - For provider-based queries
- `isActive` - For active integration queries

**Relationships:**
- Many-to-one: `users`, `organizations`

**RLS Policies:**
- Users can access their own integrations
- Organization members can access org integrations

---

## Relationships

### Entity Relationship Diagram

```
users
  ├── sessions (1:N)
  ├── events (1:N)
  ├── patterns (1:N)
  ├── relationships (1:N)
  ├── subscriptions (1:1)
  └── privacy_prefs (1:1)
      ├── app_allowlist (1:N)
      ├── signal_toggles (1:N)
      ├── telemetry_events (1:N)
      └── privacy_transparency_logs (1:N)

organizations
  ├── organization_members (1:N)
  ├── workflows (1:N)
  └── user_integrations (1:N)

workflows
  ├── workflow_versions (1:N)
  └── workflow_executions (1:N)
```

---

## Indexes

### Performance Indexes

All tables have indexes optimized for common query patterns:

1. **User-based queries:** Most tables index `userId` for fast user data retrieval
2. **Time-based queries:** Event tables index `timestamp` for time-range queries
3. **Composite indexes:** Common combinations like `(userId, timestamp)` for filtered queries
4. **Unique indexes:** Prevent duplicate entries (e.g., `(userId, fileExtension)`)

### Index Strategy

- **Primary keys:** Always indexed (automatic)
- **Foreign keys:** Indexed for join performance
- **Frequently queried columns:** Indexed individually
- **Composite queries:** Composite indexes for multi-column filters

---

## Constraints

### Unique Constraints

- `users.email` - One account per email
- `sessions.token` - Unique session tokens
- `patterns(userId, fileExtension)` - One pattern per extension per user
- `relationships(userId, sourceFile, targetFile)` - One relationship per file pair
- `subscriptions.userId` - One subscription per user
- `privacy_prefs.userId` - One preference set per user

### Check Constraints

- `events.eventType` - Must be one of: created, modified, accessed, deleted
- `subscriptions.plan` - Must be one of: free, pro, enterprise
- `subscriptions.status` - Must be one of: active, canceled, past_due
- `patterns.count` - Must be >= 0
- `relationships.weight` - Must be >= 0

### Foreign Key Constraints

- All foreign keys have `ON DELETE CASCADE` to maintain referential integrity
- Deleting a user automatically deletes all related data

---

## Migrations

### Migration Strategy

1. **Prisma Schema:** Define schema in `prisma/schema.prisma`
2. **Generate Migration:** Run `prisma migrate dev`
3. **Supabase Sync:** Apply migrations to Supabase
4. **Validation:** Run `npm run schema:validate` to check alignment

### Migration Files

Migrations are stored in:
- **Prisma:** `prisma/migrations/`
- **Supabase:** `supabase/migrations/`

### Migration Best Practices

1. **Always use `IF NOT EXISTS`** for idempotency
2. **Test migrations locally** before applying to production
3. **Backup database** before major migrations
4. **Review migration SQL** before applying
5. **Use transactions** for multi-step migrations

---

## Schema Validation

### Validation Script

Run schema alignment validation:

```bash
npm run schema:validate
```

This checks:
- Prisma schema vs Supabase migrations alignment
- Missing tables or columns
- Index consistency
- Constraint alignment

### Common Issues

1. **Schema Drift:** Prisma and Supabase migrations out of sync
   - **Solution:** Run alignment script and create migration

2. **Missing Indexes:** Performance issues
   - **Solution:** Add indexes to Prisma schema and create migration

3. **Constraint Mismatches:** Data integrity issues
   - **Solution:** Review constraints and align schemas

---

## Data Retention

### Retention Policies

Data retention is configurable per user via `privacy_prefs.dataRetentionDays`:

- **Free Tier:** 7 days (default)
- **Pro Tier:** 90 days (default)
- **Enterprise:** Unlimited (configurable)

### Automatic Cleanup

Cron job (`/api/privacy/cron/cleanup`) runs daily to:
- Delete events older than retention period
- Clean up expired sessions
- Remove orphaned data

---

## Security

### Row-Level Security (RLS)

All tables have RLS policies:
- Users can only access their own data
- Service role can access all data (for admin operations)
- Organization members can access org data

### Encryption

- **At Rest:** Database encryption (Supabase managed)
- **In Transit:** TLS/SSL for all connections
- **Sensitive Fields:** Integration credentials encrypted in `user_integrations.config`

---

## Backup & Recovery

### Backup Strategy

- **Automatic:** Supabase daily backups
- **Manual:** Export via `/api/privacy/export`
- **Point-in-Time:** Supabase PITR available (Enterprise)

### Recovery Procedures

1. **Data Loss:** Restore from Supabase backup
2. **Schema Issues:** Rollback migration
3. **Corruption:** Restore from backup and verify integrity

---

**Last Updated:** 2025-01-XX  
**For schema changes:** Update Prisma schema and create migration  
**For questions:** See `/docs` or contact support
