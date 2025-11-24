# Database Schema Overview

This document provides a high-level overview of the Supabase database schema, including tables, indexes, functions, triggers, and RLS policies.

**Last Updated:** 2025-01-15  
**Migration Strategy:** Single master migration (`99999999999999_master_consolidated_schema.sql`)

---

## Core Tables

### User Management
- **users** - User accounts (id, email, emailVerified, passwordHash, name, image, createdAt, updatedAt)
- **sessions** - Authentication sessions (id, userId, token, expiresAt, createdAt)
- **mfa_enforced_sessions** - MFA session tracking (id, userId, sessionToken, expiresAt, createdAt)

### Core Data
- **events** - File system events (id, userId, filePath, eventType, tool, timestamp, metadata)
- **patterns** - Detected file patterns (id, userId, fileExtension, count, lastUsed, tools, updatedAt)
- **relationships** - File relationships (id, userId, sourceFile, targetFile, relationType, weight, lastSeen, updatedAt)

### Business Logic
- **subscriptions** - User subscriptions (id, userId, plan, status, stripeId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, createdAt, updatedAt)
- **utm_tracks** - UTM tracking (id, userId, source, medium, campaign, term, content, firstTouch, lastTouch, timestamp)
- **cohorts** - Cohort analysis (id, userId, cohortMonth, acquiredAt, createdAt)
- **feature_flags** - Feature flags (id, key, enabled, description, metadata, createdAt, updatedAt)
- **offers** - Pricing offers (id, key, name, description, planType, discount, validFrom, validTo, enabled, metadata, createdAt, updatedAt)

### Privacy & Compliance
- **privacy_prefs** - Privacy preferences (id, userId, consentGiven, dataRetentionDays, mfaRequired, lastReviewedAt, monitoringEnabled, createdAt, updatedAt)
- **app_allowlist** - App allowlist (id, userId, appId, appName, enabled, scope, createdAt, updatedAt)
- **signal_toggles** - Signal toggles (id, userId, signalKey, enabled, samplingRate, createdAt, updatedAt)
- **telemetry_events** - Telemetry events (id, userId, timestamp, appId, eventType, durationMs, metadataRedactedJson, createdAt)
- **privacy_transparency_log** - Privacy transparency log (id, userId, action, resource, resourceId, oldValueHash, newValueHash, metadata, timestamp)

### Audit & Monitoring
- **audit_logs** - Audit logs (id, userId, action, resource, resourceId, metadata, ipAddress, userAgent, timestamp)
- **audit_log** - Alternative audit log table (id, user_id, action, meta, ts)
- **retention_policies** - Data retention policies (id, tableName, retentionDays, enabled, lastRun, createdAt, updatedAt)
- **metrics_log** - Performance metrics (id, ts, source, metric, created_at)

### Organizations & Workflows
- **organizations** - Organizations (id, name, slug, plan, settings, createdAt, updatedAt)
- **organization_members** - Organization members (id, organizationId, userId, role, createdAt, updatedAt)
- **workflows** - Workflows (id, userId, organizationId, name, description, definition, isActive, createdAt, updatedAt)
- **workflow_versions** - Workflow versions (id, workflowId, version, definition, createdAt)
- **workflow_executions** - Workflow executions (id, workflowId, status, input, output, error, startedAt, completedAt)
- **workflow_runs** - Workflow runs queue (id, user_id, workflow_id, status, retries, error, data, result, created_at, updated_at)

### Integrations
- **user_integrations** - User integrations (id, userId, organizationId, provider, name, config, isActive, lastSyncAt, createdAt, updatedAt)

### Analytics & Events (Alternative Schema)
- **events** (alternative) - Generic events table (id, occurred_at, user_id, event_name, props)
- **spend** - Ad spend tracking (id, platform, campaign_id, adset_id, date, spend_cents, clicks, impressions, conv)
- **metrics_daily** - Daily metrics rollup (id, day, sessions, add_to_carts, orders, revenue_cents, refunds_cents, aov_cents, cac_cents, conversion_rate, gross_margin_cents, traffic)

---

## Key Indexes

### User & Session Indexes
- `idx_users_email` - Users email lookup
- `idx_sessions_user_id` - Session user lookup
- `idx_sessions_token` - Session token lookup
- `idx_sessions_expires_at` - Expired session cleanup

### Events Indexes
- `idx_events_user_id_timestamp` - User events by time
- `idx_events_file_path` - File path lookups
- `idx_events_event_type` - Event type filtering
- `idx_events_user_timestamp` - Composite user+time
- `idx_events_user_id_event_type` - User+type filtering

### Patterns & Relationships
- `idx_patterns_user_id` - User patterns
- `idx_patterns_file_extension` - Extension lookups
- `idx_relationships_user_id` - User relationships
- `idx_relationships_source_target` - File relationship lookups

### Privacy & Telemetry
- `idx_telemetry_events_user_timestamp` - User telemetry by time
- `idx_telemetry_events_app_id` - App filtering
- `idx_privacy_transparency_log_user_timestamp` - User transparency logs

### Organization & Workflow
- `idx_organization_members_user_id` - User org membership
- `idx_organization_members_org_id` - Org member lookup
- `idx_workflows_user_id` - User workflows
- `idx_workflows_org_id` - Org workflows
- `idx_workflow_runs_user_status` - Workflow run status

---

## Functions

### Utility Functions
- `auth.uid()` - Get current user ID from JWT
- `update_updated_at_column()` - Trigger function for updatedAt timestamps
- `is_admin()` - Check if user is admin
- `is_org_member(org_id UUID)` - Check org membership
- `is_org_admin(org_id UUID)` - Check org admin status

### Monitoring Functions
- `get_table_sizes()` - Get table size statistics
- `get_index_usage()` - Get index usage statistics
- `privacy_guardian_health_check()` - Privacy system health check

### Data Management
- `cleanup_retention_data()` - Clean up old data based on retention policies
- `cleanup_telemetry_by_retention()` - Clean up telemetry based on user preferences
- `audit_rls_violation(table_name, attempted_user_id, operation)` - Log RLS violations

### Analytics Functions
- `upsert_events(_rows jsonb)` - Bulk upsert events
- `upsert_spend(_rows jsonb)` - Bulk upsert spend data
- `recompute_metrics_daily(_start date, _end date)` - Recompute daily metrics
- `system_healthcheck()` - System health check

### Privacy Functions
- `encrypt_telemetry_metadata(plaintext JSONB, encryption_key TEXT)` - Encrypt metadata
- `redact_telemetry_metadata(raw_metadata JSONB)` - Redact sensitive fields
- `auto_redact_telemetry()` - Trigger function for auto-redaction

---

## Triggers

### UpdatedAt Triggers
- `update_users_updated_at` - Users table
- `update_patterns_updated_at` - Patterns table
- `update_relationships_updated_at` - Relationships table
- `update_subscriptions_updated_at` - Subscriptions table
- `update_feature_flags_updated_at` - Feature flags table
- `update_offers_updated_at` - Offers table
- `update_retention_policies_updated_at` - Retention policies table
- `update_privacy_prefs_updated_at` - Privacy prefs table
- `update_app_allowlist_updated_at` - App allowlist table
- `update_signal_toggles_updated_at` - Signal toggles table
- `update_workflow_runs_updated_at` - Workflow runs table

### Privacy Triggers
- `auto_redact_telemetry_before_insert` - Auto-redact telemetry on insert

---

## RLS Policies

### Policy Pattern
Most tables follow this pattern:
- **Users can view own data** - `auth.uid() = userId`
- **Users can manage own data** - `auth.uid() = userId` (INSERT/UPDATE/DELETE)
- **Service role bypass** - `auth.role() = 'service_role'` (for background jobs)

### Public Read Tables
- **feature_flags** - Anyone can view
- **offers** - Anyone can view enabled offers
- **roles** - Anyone can view

### Organization-Aware Tables
- **organizations** - Members can view, admins can update
- **organization_members** - Members can view, admins can manage
- **workflows** - Users can view own + org workflows if member
- **user_integrations** - Users can view own + org integrations if member

### Privacy Tables (Zero Trust)
- **telemetry_events** - Users can ONLY view/insert own (no admin bypass)
- **privacy_transparency_log** - Users can ONLY view own (immutable)
- **privacy_prefs** - Users can ONLY manage own

---

## Migration Files Reference

### Current Migrations (to be archived)
1. `20240101000000_initial_schema.sql` - Core tables, indexes, RLS
2. `20240101000001_validation_queries.sql` - Validation queries
3. `20240101000002_enhanced_policies.sql` - Service role policies, monitoring functions
4. `20240101000003_privacy_monitoring.sql` - Privacy tables, zero-trust RLS
5. `2025-11-05_telemetry.sql` - Alternative telemetry schema
6. `2025-11-05_trust_audit.sql` - Alternative audit log
7. `20250101000000_performance_indexes.sql` - Performance indexes
8. `20250106000000_metrics_log.sql` - Metrics log table
9. `20250110000000_consolidated_rls_policies.sql` - Consolidated RLS for all tables
10. `20250115000000_activation_analytics_indexes.sql` - Activation analytics indexes
11. `20251105_crux_hardening.sql` - Additional performance indexes
12. `20251105_workflow_runs.sql` - Workflow runs table
13. `000000000800_upsert_functions.sql` - Upsert functions for analytics

### Master Migration
- `99999999999999_master_consolidated_schema.sql` - **Single canonical migration** (to be created)

---

## Notes

- **Schema Conflicts:** There are some duplicate/conflicting table definitions (e.g., `telemetry_events` vs `events`, `audit_logs` vs `audit_log`)
- **Naming Inconsistencies:** Some tables use camelCase (`userId`), others use snake_case (`user_id`)
- **RLS Coverage:** All tables should have RLS enabled with appropriate policies
- **Index Strategy:** Indexes optimized for common query patterns (user_id + timestamp, etc.)
