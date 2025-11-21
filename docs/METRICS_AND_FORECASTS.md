# Metrics & Forecasting Framework

**Last Updated:** 2025-01-XX  
**Status:** Product Analytics & Finance Framework  
**Owner:** Product & Finance Teams

---

## Table of Contents

1. [Metrics Overview](#metrics-overview)
2. [Event Model](#event-model)
3. [Data Storage Plan](#data-storage-plan)
4. [Forecasting Scenarios](#forecasting-scenarios)

---

## Metrics Overview

### North Star Metric

**Primary North Star: Weekly Active Users with Value Realization (WAU-VR)**

**Definition:** Count of unique users who, in a given week, have:
1. Tracked at least 10 file events, AND
2. Generated at least 1 actionable insight, AND
3. Taken at least 1 action (viewed recommendation, connected integration, or created workflow)

**Formula:**
```
WAU-VR = COUNT(DISTINCT user_id) 
WHERE week = current_week
  AND events_count >= 10
  AND insights_generated >= 1
  AND actions_taken >= 1
```

**Rationale:** This metric captures users who complete the full product loop (track → analyze → act → derive value). It aligns with product-market fit validation and correlates strongly with retention and monetization.

**Target:** 
- M1 (Month 1): 20+ WAU-VR
- M3 (Month 3): 150+ WAU-VR
- M6 (Month 6): 1,500+ WAU-VR

---

### Supporting Metrics

#### Acquisition Metrics

**1. New User Signups**
- **Definition:** Count of new user accounts created
- **Formula:** `COUNT(DISTINCT user_id) WHERE created_at >= period_start AND created_at < period_end`
- **Data Source:** `users` table, `created_at` field
- **Events:** `USER_SIGNED_UP`
- **Target:** 500 (M1), 1,500 (M3), 5,000 (M6)

**2. Signup Conversion Rate**
- **Definition:** Percentage of visitors who sign up
- **Formula:** `(signups / unique_visitors) * 100`
- **Data Source:** Analytics (PostHog/Vercel), `users` table
- **Events:** `PAGE_VIEWED` (landing), `USER_SIGNED_UP`
- **Target:** 3% (M1), 5% (M3), 7% (M6)

**3. Acquisition Channel Distribution**
- **Definition:** Percentage of signups by channel (organic, paid, referral, social)
- **Formula:** `COUNT(signups) BY channel / TOTAL(signups) * 100`
- **Data Source:** `utm_tracks` table, `source`, `medium`, `campaign` fields
- **Events:** `USER_SIGNED_UP` (with UTM params)
- **Target:** 60% organic, 20% referral, 15% paid, 5% other (M3)

**4. Cost Per Acquisition (CAC)**
- **Definition:** Total marketing spend divided by new users acquired
- **Formula:** `total_marketing_spend / new_users_acquired`
- **Data Source:** Marketing spend tracking, `users` table
- **Target:** <$10 (M1), <$15 (M3), <$20 (M6)

**5. Referral Rate**
- **Definition:** Percentage of new users who came via referral
- **Formula:** `(referral_signups / total_signups) * 100`
- **Data Source:** `utm_tracks` table, `campaign = 'referral'` or referral tracking
- **Events:** `USER_SIGNED_UP` (with referral_code)
- **Target:** 10% (M1), 20% (M3), 25% (M6)

---

#### Activation Metrics

**6. Onboarding Completion Rate**
- **Definition:** Percentage of signups who complete onboarding
- **Formula:** `(onboarding_completed / signups) * 100`
- **Data Source:** `users` table, `onboarding_completed_at` field (or event tracking)
- **Events:** `ONBOARDING_STARTED`, `ONBOARDING_COMPLETED`
- **Target:** 80% (M1), 85% (M3), 90% (M6)

**7. Time to First Event**
- **Definition:** Median time from signup to first file event tracked
- **Formula:** `MEDIAN(first_event_timestamp - signup_timestamp)`
- **Data Source:** `users.created_at`, `events.timestamp` (first event per user)
- **Events:** `EVENT_TRACKED` (first event)
- **Target:** <5 minutes (M1), <3 minutes (M3), <2 minutes (M6)

**8. Time to First Insight**
- **Definition:** Median time from signup to first insight generated
- **Formula:** `MEDIAN(first_insight_timestamp - signup_timestamp)`
- **Data Source:** `users.created_at`, insights generation timestamp (from events or patterns)
- **Events:** `INSIGHT_GENERATED` (first insight)
- **Target:** <10 minutes (M1), <5 minutes (M3), <3 minutes (M6)

**9. Activation Rate**
- **Definition:** Percentage of signups who reach activation (complete core loop)
- **Formula:** `(activated_users / signups) * 100`
- **Activation Criteria:** User has tracked 10+ events AND generated 1+ insight AND taken 1+ action
- **Data Source:** `events`, `patterns`, action tracking (workflows/integrations)
- **Events:** `USER_ACTIVATED` (composite event)
- **Target:** 40% (M1), 50% (M3), 60% (M6)

**10. Core Loop Completion Rate**
- **Definition:** Percentage of activated users who complete the core loop (track → insight → action)
- **Formula:** `(core_loop_completed / activated_users) * 100`
- **Data Source:** Event tracking for full loop completion
- **Events:** `CORE_LOOP_COMPLETED`
- **Target:** 60% (M1), 70% (M3), 80% (M6)

---

#### Engagement & Retention Metrics

**11. Daily Active Users (DAU)**
- **Definition:** Count of unique users who performed any action in a day
- **Formula:** `COUNT(DISTINCT user_id) WHERE date = current_date AND (event_tracked OR insight_viewed OR action_taken)`
- **Data Source:** `events`, `telemetry_events`, action tracking
- **Target:** 50 (M1), 300 (M3), 1,500 (M6)

**12. Weekly Active Users (WAU)**
- **Definition:** Count of unique users active in a week
- **Formula:** `COUNT(DISTINCT user_id) WHERE week = current_week AND active = true`
- **Data Source:** Aggregated from daily activity
- **Target:** 100 (M1), 600 (M3), 3,000 (M6)

**13. Monthly Active Users (MAU)**
- **Definition:** Count of unique users active in a month
- **Formula:** `COUNT(DISTINCT user_id) WHERE month = current_month AND active = true`
- **Data Source:** Aggregated from daily activity
- **Target:** 500 (M1), 1,500 (M3), 5,000 (M6)

**14. Events Per Active User (EPAU)**
- **Definition:** Average number of file events tracked per active user per week
- **Formula:** `SUM(events_count) / COUNT(DISTINCT active_users)`
- **Data Source:** `events` table, aggregated by user and week
- **Target:** 50 (M1), 100 (M3), 150 (M6)

**15. Workflows Created**
- **Definition:** Count of workflows created by users
- **Formula:** `COUNT(workflow_id) WHERE created_at >= period_start`
- **Data Source:** `workflows` table
- **Events:** `WORKFLOW_CREATED`
- **Target:** 20 (M1), 200 (M3), 1,000 (M6)

**16. Integrations Connected**
- **Definition:** Count of active integrations connected by users
- **Formula:** `COUNT(integration_id) WHERE is_active = true`
- **Data Source:** `user_integrations` table
- **Events:** `INTEGRATION_CONNECTED`
- **Target:** 30 (M1), 300 (M3), 1,500 (M6)

**17. 1-Day Retention Rate**
- **Definition:** Percentage of users who return the day after signup
- **Formula:** `(users_active_day_1 / users_signed_up_day_0) * 100`
- **Data Source:** Cohort analysis on `users` and activity tracking
- **Target:** 50% (M1), 60% (M3), 70% (M6)

**18. 7-Day Retention Rate**
- **Definition:** Percentage of users who return 7 days after signup
- **Formula:** `(users_active_day_7 / users_signed_up_day_0) * 100`
- **Data Source:** Cohort analysis
- **Target:** 25% (M1), 30% (M3), 35% (M6)

**19. 30-Day Retention Rate**
- **Definition:** Percentage of users who return 30 days after signup
- **Formula:** `(users_active_day_30 / users_signed_up_day_0) * 100`
- **Data Source:** Cohort analysis
- **Target:** 15% (M1), 20% (M3), 25% (M6)

**20. Cohort Retention Curve**
- **Definition:** Retention rate by cohort over time (cohort analysis)
- **Formula:** Retention matrix by cohort month and week
- **Data Source:** `cohorts` table + activity tracking
- **Target:** Improve retention curve slope (reduce churn rate)

---

#### Monetization Metrics

**21. Free-to-Paid Conversion Rate**
- **Definition:** Percentage of free users who convert to paid plans
- **Formula:** `(paid_conversions / free_users) * 100`
- **Data Source:** `subscriptions` table, `plan` field
- **Events:** `SUBSCRIPTION_CREATED` (plan != 'free')
- **Target:** 10% (M1), 15% (M3), 20% (M6)

**22. Monthly Recurring Revenue (MRR)**
- **Definition:** Sum of all active subscription revenue per month
- **Formula:** `SUM(monthly_price) WHERE subscription_status = 'active' AND plan != 'free'`
- **Data Source:** `subscriptions` table, plan pricing
- **Target:** $50 (M1), $300 (M3), $1,875 (M5), $25,000 (M6)

**23. Average Revenue Per User (ARPU)**
- **Definition:** Total MRR divided by total paying users
- **Formula:** `MRR / COUNT(paying_users)`
- **Data Source:** `subscriptions` table
- **Target:** $15 (M1), $20 (M3), $25 (M6)

**24. Customer Lifetime Value (LTV)**
- **Definition:** Average revenue per customer over their lifetime
- **Formula:** `ARPU / monthly_churn_rate` (simplified) OR `SUM(revenue_per_customer) / COUNT(customers)`
- **Data Source:** Historical subscription data, churn analysis
- **Target:** $60 (M1), $120 (M3), $200 (M6)

**25. LTV:CAC Ratio**
- **Definition:** Customer lifetime value divided by customer acquisition cost
- **Formula:** `LTV / CAC`
- **Data Source:** Calculated from LTV and CAC metrics
- **Target:** >2:1 (M1), >3:1 (M3), >4:1 (M6)

**26. Monthly Churn Rate**
- **Definition:** Percentage of paying customers who cancel per month
- **Formula:** `(churned_customers / total_paying_customers_at_start) * 100`
- **Data Source:** `subscriptions` table, `status = 'canceled'`, `canceled_at` field
- **Events:** `SUBSCRIPTION_CANCELED`
- **Target:** <10% (M1), <7% (M3), <5% (M6)

**27. Trial-to-Paid Conversion Rate**
- **Definition:** Percentage of trial users who convert to paid
- **Formula:** `(trial_conversions / trial_starts) * 100`
- **Data Source:** `subscriptions` table, trial tracking
- **Events:** `TRIAL_STARTED`, `TRIAL_CONVERTED`
- **Target:** 30% (M1), 40% (M3), 50% (M6)

**28. Revenue Per Active User (RPAU)**
- **Definition:** MRR divided by MAU (including free users)
- **Formula:** `MRR / MAU`
- **Data Source:** MRR and MAU metrics
- **Target:** $0.10 (M1), $0.20 (M3), $5.00 (M6)

---

## Event Model

### Event Schema

All events follow this base structure:

```typescript
interface BaseEvent {
  event_id: string;           // UUID
  event_type: string;         // Event type (e.g., "USER_SIGNED_UP")
  user_id: string | null;     // UUID (null for anonymous events)
  session_id: string | null;  // Session identifier
  timestamp: string;          // ISO 8601 timestamp
  properties: Record<string, any>;  // Event-specific properties
  context: {
    ip_address?: string;
    user_agent?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  };
}
```

### Core Events

#### Acquisition Events

**1. USER_SIGNED_UP**
- **Description:** User creates a new account
- **Required Properties:**
  - `user_id`: string (UUID)
  - `email`: string
  - `signup_method`: "email" | "oauth" | "magic_link"
  - `onboarding_started`: boolean
- **Optional Properties:**
  - `referral_code`: string
  - `invite_code`: string
- **Fire Location:** 
  - `frontend/app/(auth)/signup/page.tsx` (after Supabase Auth signup)
  - `backend/api/auth.py` (signup endpoint)
- **Storage:** `users` table (already exists), `audit_logs` table

**2. PAGE_VIEWED**
- **Description:** User views a page (for conversion tracking)
- **Required Properties:**
  - `page_path`: string (e.g., "/", "/pricing", "/dashboard")
  - `page_title`: string
- **Optional Properties:**
  - `referrer`: string
  - `utm_*`: UTM parameters
- **Fire Location:** 
  - `frontend/app/layout.tsx` (page view tracking middleware)
  - Analytics service (PostHog/Vercel Analytics)
- **Storage:** Analytics service (PostHog), optionally `audit_logs` for key pages

**3. REFERRAL_LINK_CLICKED**
- **Description:** User clicks a referral link
- **Required Properties:**
  - `referral_code`: string
  - `referrer_user_id`: string (UUID)
- **Fire Location:** 
  - `frontend/app/(auth)/signup/page.tsx` (check for referral param)
- **Storage:** `utm_tracks` table (with referral campaign)

---

#### Activation Events

**4. ONBOARDING_STARTED**
- **Description:** User begins onboarding flow
- **Required Properties:**
  - `user_id`: string (UUID)
  - `onboarding_version`: string (e.g., "v1")
- **Fire Location:** 
  - `frontend/app/onboarding/page.tsx` (on mount)
- **Storage:** `audit_logs` table, analytics service

**5. ONBOARDING_STEP_COMPLETED**
- **Description:** User completes an onboarding step
- **Required Properties:**
  - `user_id`: string (UUID)
  - `step_number`: number (1, 2, 3)
  - `step_name`: string (e.g., "welcome", "privacy_consent", "first_setup")
- **Fire Location:** 
  - `frontend/app/onboarding/[step]/page.tsx` (on step completion)
- **Storage:** `audit_logs` table, analytics service

**6. ONBOARDING_COMPLETED**
- **Description:** User completes entire onboarding flow
- **Required Properties:**
  - `user_id`: string (UUID)
  - `completion_time_seconds`: number
  - `steps_completed`: number[]
- **Fire Location:** 
  - `frontend/app/onboarding/page.tsx` (on final step completion)
- **Storage:** `users` table (add `onboarding_completed_at` field), `audit_logs` table

**7. EVENT_TRACKED** (First Event)
- **Description:** User's first file event is tracked (activation milestone)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `event_type`: "created" | "modified" | "accessed" | "deleted"
  - `file_path`: string
  - `is_first_event`: boolean (true for first event)
- **Fire Location:** 
  - `backend/api/telemetry/ingest.py` (check if first event for user)
  - `frontend/lib/tracking.ts` (client-side tracking)
- **Storage:** `events` table (already exists), trigger `USER_ACTIVATED` if criteria met

**8. INSIGHT_GENERATED**
- **Description:** System generates an insight/recommendation for user
- **Required Properties:**
  - `user_id`: string (UUID)
  - `insight_type`: "pattern" | "recommendation" | "integration_suggestion"
  - `insight_id`: string (UUID)
  - `is_first_insight`: boolean
- **Optional Properties:**
  - `pattern_id`: string (if pattern-based)
  - `recommendation_text`: string
- **Fire Location:** 
  - `backend/ml/pattern_detection.py` (pattern detected)
  - `backend/api/insights.py` (insight generation endpoint)
- **Storage:** `patterns` table (already exists), `audit_logs` for insight events

**9. USER_ACTIVATED**
- **Description:** User reaches activation milestone (composite event)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `activation_criteria_met`: {
    - `events_tracked`: number (>= 10)
    - `insights_generated`: number (>= 1)
    - `actions_taken`: number (>= 1)
  }
  - `time_to_activation_seconds`: number
- **Fire Location:** 
  - Background job or trigger after `EVENT_TRACKED`, `INSIGHT_GENERATED`, or `ACTION_TAKEN`
  - `backend/services/activation_service.py` (new service)
- **Storage:** `audit_logs` table, `users` table (add `activated_at` field)

**10. CORE_LOOP_COMPLETED**
- **Description:** User completes full core loop (track → insight → action)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `loop_sequence`: ["track", "insight", "action"]
  - `completion_time_seconds`: number
- **Fire Location:** 
  - Triggered after user takes action following insight
  - `backend/services/activation_service.py`
- **Storage:** `audit_logs` table, analytics service

---

#### Engagement Events

**11. EVENT_TRACKED** (Ongoing)
- **Description:** File event tracked (ongoing usage)
- **Required Properties:** Same as #7, but `is_first_event = false`
- **Fire Location:** Same as #7
- **Storage:** `events` table

**12. INSIGHT_VIEWED**
- **Description:** User views an insight/recommendation
- **Required Properties:**
  - `user_id`: string (UUID)
  - `insight_id`: string (UUID)
  - `insight_type`: string
- **Fire Location:** 
  - `frontend/app/dashboard/insights/page.tsx` (on insight card view)
- **Storage:** `audit_logs` table, analytics service

**13. RECOMMENDATION_CLICKED**
- **Description:** User clicks on a recommendation
- **Required Properties:**
  - `user_id`: string (UUID)
  - `recommendation_id`: string (UUID)
  - `recommendation_type`: string
  - `click_location`: "dashboard" | "email" | "notification"
- **Fire Location:** 
  - `frontend/components/dashboard/RecommendationCard.tsx` (on click)
- **Storage:** `audit_logs` table, analytics service

**14. WORKFLOW_CREATED**
- **Description:** User creates a new workflow
- **Required Properties:**
  - `user_id`: string (UUID)
  - `workflow_id`: string (UUID)
  - `workflow_name`: string
  - `workflow_type`: string
- **Fire Location:** 
  - `frontend/app/dashboard/workflows/new/page.tsx` (on workflow creation)
  - `backend/api/workflows.py` (workflow creation endpoint)
- **Storage:** `workflows` table (already exists), `audit_logs` table

**15. WORKFLOW_EXECUTED**
- **Description:** User executes/runs a workflow
- **Required Properties:**
  - `user_id`: string (UUID)
  - `workflow_id`: string (UUID)
  - `execution_id`: string (UUID)
  - `execution_status`: "success" | "failed" | "partial"
- **Fire Location:** 
  - `backend/workflow_execution_engine.py` (on workflow run)
- **Storage:** `workflow_executions` table (already exists), `audit_logs` table

**16. INTEGRATION_CONNECTED**
- **Description:** User connects an external integration
- **Required Properties:**
  - `user_id`: string (UUID)
  - `integration_id`: string (UUID)
  - `provider`: string (e.g., "zapier", "github", "slack")
  - `connection_status`: "success" | "failed"
- **Fire Location:** 
  - `frontend/app/dashboard/integrations/[provider]/connect/page.tsx` (on OAuth callback)
  - `backend/api/integrations.py` (integration connection endpoint)
- **Storage:** `user_integrations` table (already exists), `audit_logs` table

**17. INTEGRATION_USED**
- **Description:** User uses a connected integration
- **Required Properties:**
  - `user_id`: string (UUID)
  - `integration_id`: string (UUID)
  - `usage_type`: string (e.g., "webhook_received", "api_call")
- **Fire Location:** 
  - `backend/connectors/[provider].py` (on integration usage)
- **Storage:** `audit_logs` table, analytics service

**18. DASHBOARD_VIEWED**
- **Description:** User views the main dashboard
- **Required Properties:**
  - `user_id`: string (UUID)
  - `dashboard_section`: "overview" | "insights" | "workflows" | "integrations"
- **Fire Location:** 
  - `frontend/app/dashboard/page.tsx` (on page load)
- **Storage:** Analytics service (PostHog), optionally `audit_logs`

**19. SEARCH_PERFORMED**
- **Description:** User performs a search (insights, workflows, etc.)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `search_query`: string
  - `search_type`: "insights" | "workflows" | "integrations" | "all"
  - `results_count`: number
- **Fire Location:** 
  - `frontend/components/dashboard/SearchBar.tsx` (on search submit)
- **Storage:** Analytics service, `audit_logs` table

---

#### Retention Events

**20. USER_RETURNED** (Composite)
- **Description:** User returns after being inactive (calculated event)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `days_since_last_active`: number
  - `return_trigger`: "organic" | "email" | "notification"
- **Fire Location:** 
  - Calculated in analytics/background job when user activity detected after inactivity
- **Storage:** Analytics service, cohort analysis

**21. RE_ENGAGEMENT_EMAIL_SENT**
- **Description:** System sends re-engagement email to inactive user
- **Required Properties:**
  - `user_id`: string (UUID)
  - `email_type`: "re_engagement" | "feature_update" | "tips"
  - `days_inactive`: number
- **Fire Location:** 
  - `backend/notifications/email_service.py` (email sending)
- **Storage:** Email service logs, `audit_logs` table

**22. RE_ENGAGEMENT_EMAIL_CLICKED**
- **Description:** User clicks link in re-engagement email
- **Required Properties:**
  - `user_id`: string (UUID)
  - `email_type`: string
  - `link_url`: string
- **Fire Location:** 
  - Email service webhook or tracking pixel
- **Storage:** Email service logs, `audit_logs` table

---

#### Monetization Events

**23. PRICING_PAGE_VIEWED**
- **Description:** User views pricing page
- **Required Properties:**
  - `user_id`: string (UUID) | null (anonymous)
  - `source`: "nav" | "upgrade_prompt" | "direct" | "email"
- **Fire Location:** 
  - `frontend/app/pricing/page.tsx` (on page load)
- **Storage:** Analytics service, `audit_logs` table

**24. UPGRADE_PROMPT_SHOWN**
- **Description:** System shows upgrade prompt to free user
- **Required Properties:**
  - `user_id`: string (UUID)
  - `prompt_type`: "limit_reached" | "feature_locked" | "trial_ending"
  - `trigger_feature`: string (e.g., "workflow_limit", "integration_limit")
- **Fire Location:** 
  - `frontend/components/billing/UpgradePrompt.tsx` (on display)
- **Storage:** Analytics service, `audit_logs` table

**25. UPGRADE_PROMPT_CLICKED**
- **Description:** User clicks upgrade prompt
- **Required Properties:**
  - `user_id`: string (UUID)
  - `prompt_type`: string
  - `target_plan`: "pro" | "enterprise"
- **Fire Location:** 
  - `frontend/components/billing/UpgradePrompt.tsx` (on click)
- **Storage:** Analytics service, `audit_logs` table

**26. TRIAL_STARTED**
- **Description:** User starts free trial of paid plan
- **Required Properties:**
  - `user_id`: string (UUID)
  - `plan`: "pro" | "enterprise"
  - `trial_days`: number (e.g., 14)
  - `trial_end_date`: string (ISO 8601)
- **Fire Location:** 
  - `backend/api/billing.py` (trial creation endpoint)
  - `frontend/app/billing/upgrade/page.tsx` (on trial start)
- **Storage:** `subscriptions` table (already exists), `audit_logs` table

**27. TRIAL_CONVERTED**
- **Description:** User converts from trial to paid subscription
- **Required Properties:**
  - `user_id`: string (UUID)
  - `plan`: string
  - `trial_duration_days`: number
  - `conversion_date`: string (ISO 8601)
- **Fire Location:** 
  - `backend/api/billing.py` (Stripe webhook handler for subscription creation)
- **Storage:** `subscriptions` table, `audit_logs` table

**28. TRIAL_EXPIRED**
- **Description:** User's trial expires without conversion
- **Required Properties:**
  - `user_id`: string (UUID)
  - `plan`: string
  - `expiration_date`: string (ISO 8601)
- **Fire Location:** 
  - Background job checking trial expiration
  - `backend/services/billing_service.py` (trial expiration check)
- **Storage:** `subscriptions` table, `audit_logs` table

**29. SUBSCRIPTION_CREATED**
- **Description:** User creates a paid subscription (trial or direct)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `subscription_id`: string (UUID)
  - `plan`: "free" | "pro" | "enterprise"
  - `stripe_subscription_id`: string
  - `monthly_price`: number (in cents)
  - `billing_cycle`: "monthly" | "annual"
- **Fire Location:** 
  - `backend/api/billing.py` (Stripe webhook handler)
  - `frontend/app/billing/upgrade/page.tsx` (on subscription creation)
- **Storage:** `subscriptions` table (already exists), `audit_logs` table

**30. SUBSCRIPTION_UPDATED**
- **Description:** User upgrades/downgrades subscription
- **Required Properties:**
  - `user_id`: string (UUID)
  - `subscription_id`: string (UUID)
  - `old_plan`: string
  - `new_plan`: string
  - `change_type`: "upgrade" | "downgrade"
- **Fire Location:** 
  - `backend/api/billing.py` (Stripe webhook handler)
- **Storage:** `subscriptions` table, `audit_logs` table

**31. SUBSCRIPTION_CANCELED**
- **Description:** User cancels subscription
- **Required Properties:**
  - `user_id`: string (UUID)
  - `subscription_id`: string (UUID)
  - `plan`: string
  - `cancel_at_period_end`: boolean
  - `cancellation_reason`: string (optional, from survey)
- **Fire Location:** 
  - `backend/api/billing.py` (Stripe webhook handler or cancellation endpoint)
  - `frontend/app/billing/settings/page.tsx` (on cancel)
- **Storage:** `subscriptions` table, `audit_logs` table

**32. PAYMENT_SUCCEEDED**
- **Description:** Payment successfully processed
- **Required Properties:**
  - `user_id`: string (UUID)
  - `subscription_id`: string (UUID)
  - `amount`: number (in cents)
  - `currency`: string (e.g., "usd")
  - `invoice_id`: string
- **Fire Location:** 
  - `backend/api/billing.py` (Stripe webhook handler: `invoice.payment_succeeded`)
- **Storage:** Stripe records, `audit_logs` table

**33. PAYMENT_FAILED**
- **Description:** Payment failed (card declined, etc.)
- **Required Properties:**
  - `user_id`: string (UUID)
  - `subscription_id`: string (UUID)
  - `failure_reason`: string
  - `retry_count`: number
- **Fire Location:** 
  - `backend/api/billing.py` (Stripe webhook handler: `invoice.payment_failed`)
- **Storage:** Stripe records, `audit_logs` table

**34. USAGE_LIMIT_REACHED**
- **Description:** User reaches usage limit for their plan
- **Required Properties:**
  - `user_id`: string (UUID)
  - `limit_type`: "events" | "workflows" | "integrations" | "storage"
  - `current_usage`: number
  - `limit_value`: number
  - `plan`: string
- **Fire Location:** 
  - `backend/api/telemetry/ingest.py` (on event limit check)
  - `backend/api/workflows.py` (on workflow limit check)
- **Storage:** `audit_logs` table, analytics service

---

### Event Implementation Plan

**Phase 1: Core Events (Weeks 1-2)**
- Implement base event tracking infrastructure
- Add `USER_SIGNED_UP`, `ONBOARDING_COMPLETED`, `EVENT_TRACKED`, `INSIGHT_GENERATED`
- Set up analytics service integration (PostHog or similar)

**Phase 2: Activation Events (Weeks 2-3)**
- Add `USER_ACTIVATED`, `CORE_LOOP_COMPLETED`
- Implement activation service to calculate composite events

**Phase 3: Engagement Events (Weeks 3-4)**
- Add `WORKFLOW_CREATED`, `INTEGRATION_CONNECTED`, `DASHBOARD_VIEWED`
- Track user engagement patterns

**Phase 4: Monetization Events (Weeks 4-6)**
- Add all billing/subscription events
- Integrate Stripe webhooks for payment events
- Track conversion funnel events

---

## Data Storage Plan

### Event Storage Architecture

**Primary Storage: Analytics Service (PostHog/Segment)**
- Real-time event streaming
- Built-in analytics and dashboards
- User properties and cohort management
- Funnel and retention analysis

**Secondary Storage: Database Tables**

**1. Enhanced `audit_logs` Table**
```sql
-- Already exists, enhance with:
ALTER TABLE audit_logs ADD COLUMN event_type VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN event_properties JSONB;
ALTER TABLE audit_logs ADD COLUMN session_id VARCHAR(255);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
```

**2. New `product_events` Table (Optional, for custom analytics)**
```sql
CREATE TABLE product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  properties JSONB,
  context JSONB, -- IP, user agent, UTM params
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_events_user_id ON product_events(user_id);
CREATE INDEX idx_product_events_event_type ON product_events(event_type);
CREATE INDEX idx_product_events_timestamp ON product_events(timestamp);
CREATE INDEX idx_product_events_user_timestamp ON product_events(user_id, timestamp);
```

**3. Enhanced `users` Table**
```sql
-- Add activation tracking fields
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN activated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN first_event_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN first_insight_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_users_activated_at ON users(activated_at);
CREATE INDEX idx_users_last_active_at ON users(last_active_at);
```

**4. New `user_activity_daily` Table (Aggregated Metrics)**
```sql
CREATE TABLE user_activity_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  events_count INTEGER DEFAULT 0,
  insights_viewed INTEGER DEFAULT 0,
  workflows_created INTEGER DEFAULT 0,
  integrations_used INTEGER DEFAULT 0,
  actions_taken INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_user_activity_daily_date ON user_activity_daily(date);
CREATE INDEX idx_user_activity_daily_user_date ON user_activity_daily(user_id, date);
CREATE INDEX idx_user_activity_daily_active ON user_activity_daily(date, is_active);
```

**5. New `metrics_aggregated` Table (Business Metrics)**
```sql
CREATE TABLE metrics_aggregated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC,
  metric_type VARCHAR(50), -- 'count', 'rate', 'average', 'sum'
  period_type VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(metric_name, period_type, period_start)
);

CREATE INDEX idx_metrics_aggregated_name_period ON metrics_aggregated(metric_name, period_type, period_start);
```

### Data Pipeline

**Real-Time Event Flow:**
```
Client (Frontend/Backend)
  ↓
Analytics Service (PostHog) [Primary]
  ↓
Database (audit_logs / product_events) [Secondary]
  ↓
Background Jobs (Aggregation)
  ↓
Metrics Tables (user_activity_daily, metrics_aggregated)
```

**Aggregation Jobs:**
- **Daily:** Aggregate daily user activity (run at 00:00 UTC)
- **Weekly:** Calculate WAU, retention metrics (run Monday 00:00 UTC)
- **Monthly:** Calculate MAU, MRR, churn (run 1st of month 00:00 UTC)

**Implementation:**
- Use Supabase Edge Functions or Vercel Cron Jobs
- Or Python Celery workers (if using backend workers)

---

## Forecasting Scenarios

### Core Assumptions

**User Growth Assumptions:**
- **M1:** 500 signups, 40% activation, 25% 7-day retention
- **M3:** 1,500 signups, 50% activation, 30% 7-day retention
- **M6:** 5,000 signups, 60% activation, 35% 7-day retention

**Conversion Assumptions:**
- **Free-to-Paid Conversion:** 10% (M1) → 15% (M3) → 20% (M6)
- **Trial-to-Paid Conversion:** 30% (M1) → 40% (M3) → 50% (M6)
- **Trial Start Rate (of free users):** 20% (M1) → 25% (M3) → 30% (M6)

**Revenue Assumptions:**
- **Pro Plan Price:** $19/month (placeholder - adjust based on market research)
- **Enterprise Plan Price:** $99/month (placeholder)
- **Pro:Enterprise Mix:** 90% Pro, 10% Enterprise (M1-M3), 85% Pro, 15% Enterprise (M6)
- **Annual Discount:** 20% (2 months free)

**Churn Assumptions:**
- **Monthly Churn Rate:** 10% (M1) → 7% (M3) → 5% (M6)
- **Churn improves** as product matures and retention improves

**CAC & LTV Assumptions:**
- **CAC:** $10 (M1) → $15 (M3) → $20 (M6)
- **ARPU:** $15 (M1) → $20 (M3) → $25 (M6)
- **LTV (simplified):** ARPU / (monthly_churn_rate / 100)
  - M1: $15 / 0.10 = $150
  - M3: $20 / 0.07 = $286
  - M6: $25 / 0.05 = $500

---

### Scenario 1: Conservative Growth

**Assumptions:**
- Lower signup growth (slower than roadmap targets)
- Lower activation (35% vs 40% target)
- Lower conversion (8% vs 10% target)
- Higher churn (12% vs 10% target)

**12-Month Forecast:**

| Month | Signups | MAU | Activated Users | Paying Users | MRR | ARPU | Churn Rate |
|-------|---------|-----|-----------------|--------------|-----|------|------------|
| M1    | 400     | 200 | 140             | 11           | $209 | $19  | 12%        |
| M2    | 500     | 350 | 175             | 18           | $342 | $19  | 12%        |
| M3    | 600     | 500 | 210             | 25           | $475 | $19  | 11%        |
| M4    | 800     | 700 | 280             | 35           | $665 | $19  | 10%        |
| M5    | 1,000   | 950 | 350             | 48           | $912 | $19  | 9%         |
| M6    | 1,200   | 1,250| 438            | 65           | $1,235 | $19 | 8%         |
| M7    | 1,500   | 1,600| 560             | 88           | $1,672 | $19 | 7%         |
| M8    | 1,800   | 2,000| 700             | 116          | $2,204 | $19 | 7%         |
| M9    | 2,200   | 2,500| 875             | 150          | $2,850 | $19 | 6%         |
| M10   | 2,600   | 3,100| 1,085           | 191          | $3,629 | $19 | 6%         |
| M11   | 3,000   | 3,800| 1,330           | 239          | $4,541 | $19 | 5%         |
| M12   | 3,500   | 4,600| 1,610           | 297          | $5,643 | $19 | 5%         |

**Key Metrics (M12):**
- **MRR:** $5,643
- **ARR:** $67,716
- **Paying Users:** 297
- **LTV:** $380 (ARPU $19 / 5% churn)
- **LTV:CAC:** 19:1 (assuming CAC $20)
- **CAC Payback:** ~1 month

**Notes:**
- Conservative growth trajectory
- Lower than roadmap targets but sustainable
- Focus on improving activation and conversion

---

### Scenario 2: Aggressive Growth

**Assumptions:**
- Higher signup growth (meets/exceeds roadmap targets)
- Higher activation (50% vs 40% target)
- Higher conversion (15% vs 10% target)
- Lower churn (7% vs 10% target) due to better product-market fit

**12-Month Forecast:**

| Month | Signups | MAU | Activated Users | Paying Users | MRR | ARPU | Churn Rate |
|-------|---------|-----|-----------------|--------------|-----|------|------------|
| M1    | 500     | 300 | 250             | 38           | $722 | $19  | 10%        |
| M2    | 800     | 600 | 480             | 78           | $1,482 | $19 | 9%         |
| M3    | 1,500   | 1,200| 900             | 158          | $3,002 | $19 | 8%         |
| M4    | 2,000   | 2,000| 1,400           | 266          | $5,054 | $19 | 8%         |
| M5    | 3,000   | 3,200| 2,400           | 456          | $8,664 | $19 | 7%         |
| M6    | 5,000   | 5,500| 4,400           | 880          | $16,720 | $19 | 7%         |
| M7    | 6,000   | 8,000| 6,400           | 1,344         | $25,536 | $19 | 6%         |
| M8    | 7,000   | 11,000| 8,800          | 1,936         | $36,784 | $19 | 6%         |
| M9    | 8,000   | 14,500| 11,600         | 2,668         | $50,692 | $19 | 5%         |
| M10   | 9,000   | 18,500| 14,800         | 3,552         | $67,488 | $19 | 5%         |
| M11   | 10,000  | 23,000| 18,400         | 4,600         | $87,400 | $19 | 5%         |
| M12   | 12,000  | 28,500| 22,800         | 5,700         | $108,300 | $19 | 5%         |

**Key Metrics (M12):**
- **MRR:** $108,300
- **ARR:** $1,299,600
- **Paying Users:** 5,700
- **LTV:** $380 (ARPU $19 / 5% churn)
- **LTV:CAC:** 19:1 (assuming CAC $20)
- **CAC Payback:** ~1 month

**Notes:**
- Aggressive growth trajectory
- Exceeds roadmap targets significantly
- Requires strong product-market fit and execution
- Higher marketing spend needed to sustain growth

---

### Scenario 3: Realistic Growth (Recommended)

**Assumptions:**
- Meets roadmap targets
- Balanced activation (45% average)
- Balanced conversion (12.5% average)
- Improving churn (9% → 6% over 12 months)

**12-Month Forecast:**

| Month | Signups | MAU | Activated Users | Paying Users | MRR | ARPU | Churn Rate |
|-------|---------|-----|-----------------|--------------|-----|------|------------|
| M1    | 500     | 250 | 200             | 25           | $475 | $19  | 10%        |
| M2    | 600     | 450 | 270             | 38           | $722 | $19  | 9%         |
| M3    | 1,500   | 1,000| 675            | 101          | $1,919 | $19 | 8%         |
| M4    | 1,800   | 1,600| 900             | 153          | $2,907 | $19 | 8%         |
| M5    | 2,500   | 2,500| 1,375           | 240          | $4,560 | $19 | 7%         |
| M6    | 5,000   | 4,500| 2,700           | 506          | $9,614 | $19 | 7%         |
| M7    | 6,000   | 6,500| 3,900           | 741          | $14,079 | $19 | 6%         |
| M8    | 7,000   | 9,000| 5,400           | 1,053        | $20,007 | $19 | 6%         |
| M9    | 8,000   | 12,000| 7,200          | 1,440        | $27,360 | $19 | 6%         |
| M10   | 9,000   | 15,500| 9,450          | 1,890        | $35,910 | $19 | 6%         |
| M11   | 10,000  | 19,500| 11,925         | 2,385        | $45,315 | $19 | 6%         |
| M12   | 12,000  | 24,500| 15,000         | 3,000        | $57,000 | $19 | 6%         |

**Key Metrics (M12):**
- **MRR:** $57,000
- **ARR:** $684,000
- **Paying Users:** 3,000
- **LTV:** $317 (ARPU $19 / 6% churn)
- **LTV:CAC:** 15.8:1 (assuming CAC $20)
- **CAC Payback:** ~1.1 months

**Notes:**
- Balanced growth trajectory
- Meets roadmap targets
- Sustainable with focused execution
- Room for optimization in activation and conversion

---

### Forecasting Model Structure

**Input Variables (Placeholders - Update with Real Data):**
```python
# User Growth
MONTHLY_SIGNUPS = [500, 600, 1500, 1800, 2500, 5000, ...]  # Per month
ACTIVATION_RATE = 0.45  # 45% of signups activate
RETENTION_7D = 0.30  # 30% 7-day retention

# Conversion
FREE_TO_PAID_CONVERSION = 0.125  # 12.5% convert
TRIAL_TO_PAID_CONVERSION = 0.40  # 40% of trials convert
TRIAL_START_RATE = 0.25  # 25% of free users start trial

# Revenue
PRO_PLAN_PRICE = 19  # $19/month
ENTERPRISE_PLAN_PRICE = 99  # $99/month
PRO_ENTERPRISE_MIX = 0.90  # 90% Pro, 10% Enterprise

# Churn
MONTHLY_CHURN_RATE = 0.07  # 7% monthly churn (improves over time)

# CAC
CAC = 20  # $20 customer acquisition cost
```

**Calculation Logic:**
```python
# Monthly calculations
new_signups = MONTHLY_SIGNUPS[month]
activated_users = new_signups * ACTIVATION_RATE
free_users = MAU - paying_users  # Existing + new activated
trial_starts = free_users * TRIAL_START_RATE
trial_conversions = trial_starts * TRIAL_TO_PAID_CONVERSION
direct_upgrades = free_users * FREE_TO_PAID_CONVERSION
new_paying_users = trial_conversions + direct_upgrades

# Churn
churned_users = paying_users * MONTHLY_CHURN_RATE
net_paying_users = paying_users + new_paying_users - churned_users

# Revenue
pro_users = net_paying_users * PRO_ENTERPRISE_MIX
enterprise_users = net_paying_users * (1 - PRO_ENTERPRISE_MIX)
MRR = (pro_users * PRO_PLAN_PRICE) + (enterprise_users * ENTERPRISE_PLAN_PRICE)
ARPU = MRR / net_paying_users

# LTV
LTV = ARPU / MONTHLY_CHURN_RATE
LTV_CAC_RATIO = LTV / CAC
```

---

### Key Levers for Growth

**To Improve MRR:**
1. **Increase Signups:** Improve landing page conversion, content marketing, referrals
2. **Increase Activation:** Better onboarding, faster time to value
3. **Increase Conversion:** Better upgrade prompts, trial optimization, pricing
4. **Reduce Churn:** Improve retention, engagement, product value

**Sensitivity Analysis:**
- **10% increase in signups** → ~10% increase in MRR (linear)
- **10% increase in activation** → ~10% increase in activated users → ~10% increase in MRR
- **10% increase in conversion** → ~10% increase in paying users → ~10% increase in MRR
- **10% decrease in churn** → ~10% more retained users → ~10% increase in MRR

**Recommended Focus Areas (Priority Order):**
1. **Activation Rate** (biggest impact on funnel)
2. **Conversion Rate** (direct revenue impact)
3. **Churn Rate** (retention = revenue)
4. **Signup Growth** (scales everything)

---

## Implementation Checklist

### Phase 1: Event Tracking Infrastructure (Weeks 1-2)
- [ ] Set up analytics service (PostHog/Segment)
- [ ] Create base event tracking utility (`frontend/lib/analytics.ts`)
- [ ] Implement core events (`USER_SIGNED_UP`, `ONBOARDING_COMPLETED`, `EVENT_TRACKED`)
- [ ] Add database fields for activation tracking (`users` table)
- [ ] Set up event aggregation jobs (daily/weekly/monthly)

### Phase 2: Metrics Dashboard (Weeks 2-3)
- [ ] Create metrics dashboard (`/admin/metrics` or `/dashboard/analytics`)
- [ ] Implement North Star metric calculation (WAU-VR)
- [ ] Build acquisition metrics dashboard
- [ ] Build activation funnel visualization
- [ ] Build retention cohort analysis

### Phase 3: Forecasting Model (Weeks 3-4)
- [ ] Create forecasting spreadsheet/model (Python script or Google Sheets)
- [ ] Populate with real data from first month
- [ ] Build scenario comparison tool
- [ ] Set up monthly forecasting review process

### Phase 4: Advanced Analytics (Weeks 4-6)
- [ ] Implement all monetization events
- [ ] Build revenue dashboard (MRR, ARPU, LTV)
- [ ] Set up conversion funnel tracking
- [ ] Implement churn analysis and prediction

---

## Next Steps

1. **Review & Approve:** Review this framework with product and finance teams
2. **Set Up Infrastructure:** Implement event tracking infrastructure (Phase 1)
3. **Populate Real Data:** Start tracking events and populate forecasting model with real data
4. **Refine Assumptions:** Update placeholder assumptions based on Month 1 data
5. **Monthly Reviews:** Schedule monthly metrics and forecasting reviews
6. **Iterate:** Continuously refine metrics and forecasting model based on learnings

---

**Last Updated:** 2025-01-XX  
**Next Review:** After Month 1 data collection  
**Owner:** Product & Finance Teams
