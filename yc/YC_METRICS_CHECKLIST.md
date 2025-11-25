# YC Metrics Checklist - Floyo

**Last Updated:** 2025-01-20  
**Status:** Draft - Founders to validate instrumentation and fill in real metrics

---

## A. USAGE METRICS

### Proposed Metrics

#### DAU / WAU / MAU (Daily/Weekly/Monthly Active Users)

**Definition:**
- **DAU:** Users who tracked at least one file event in the last 24 hours
- **WAU:** Users who tracked at least one file event in the last 7 days
- **MAU:** Users who tracked at least one file event in the last 30 days

**Current Status:**
- ✅ **Infrastructure exists:** `events` table tracks file events with timestamps
- ✅ **Can calculate:** Query `events` table grouped by `user_id` and `timestamp`
- ❓ **Not instrumented:** No automated DAU/WAU/MAU calculation or dashboard

**Where to Instrument:**
- **Backend:** `/backend/jobs/metrics_aggregation.py` - Add DAU/WAU/MAU calculation
- **Dashboard:** `/backend/analytics.py` - Add endpoint to return DAU/WAU/MAU
- **Frontend:** Create admin dashboard showing DAU/WAU/MAU trends

**Proposed Implementation:**
```python
# Add to backend/jobs/metrics_aggregation.py
def calculate_dau_wau_mau(db: Session, date: datetime = None):
    """Calculate DAU, WAU, MAU for a given date."""
    if date is None:
        date = datetime.utcnow()
    
    # DAU: events in last 24 hours
    dau_start = date - timedelta(days=1)
    dau = db.query(func.count(func.distinct(Event.user_id))).filter(
        Event.timestamp >= dau_start
    ).scalar() or 0
    
    # WAU: events in last 7 days
    wau_start = date - timedelta(days=7)
    wau = db.query(func.count(func.distinct(Event.user_id))).filter(
        Event.timestamp >= wau_start
    ).scalar() or 0
    
    # MAU: events in last 30 days
    mau_start = date - timedelta(days=30)
    mau = db.query(func.count(func.distinct(Event.user_id))).filter(
        Event.timestamp >= mau_start
    ).scalar() or 0
    
    return {"dau": dau, "wau": wau, "mau": mau, "date": date.date().isoformat()}
```

---

#### Activation Rate

**Definition:**
- **Activated User:** User who has viewed at least one integration suggestion OR connected at least one integration
- **Activation Rate:** % of signups who activate within 7 days

**Current Status:**
- ✅ **Infrastructure exists:** `audit_log` table tracks activation events
- ✅ **Partially instrumented:** `/backend/auth/analytics_helpers.py` has `check_user_activation()`
- ✅ **Endpoint exists:** `/backend/analytics.py` has `/activation` endpoint
- ❓ **Not aggregated:** No automated activation rate calculation or dashboard

**Where to Instrument:**
- **Backend:** `/backend/jobs/metrics_aggregation.py` - Already has activation calculation
- **Dashboard:** `/backend/analytics.py` - Add `/activation-metrics` endpoint (already exists!)
- **Frontend:** Create admin dashboard showing activation rate trends

**Current Implementation:**
```python
# backend/jobs/metrics_aggregation.py already has:
activations = db.query(func.count(func.distinct(AuditLog.user_id))).filter(
    and_(
        AuditLog.action == 'activation_event:first_insight_view',
        AuditLog.created_at >= start_date,
        AuditLog.created_at < end_date
    )
).scalar() or 0
```

**TODO:** Verify activation events are being tracked properly in frontend.

---

#### Retention Rate

**Definition:**
- **7-Day Retention:** % of users who were active in week 0 and returned in week 1
- **30-Day Retention:** % of users who were active in month 0 and returned in month 1

**Current Status:**
- ✅ **Infrastructure exists:** `cohorts` table tracks user cohorts
- ✅ **Partially instrumented:** `/backend/auth/analytics_helpers.py` has `get_user_retention_metrics()`
- ✅ **Endpoint exists:** `/backend/analytics.py` has `/retention-cohorts` endpoint
- ❓ **Not aggregated:** No automated retention rate calculation or dashboard

**Where to Instrument:**
- **Backend:** `/backend/jobs/metrics_aggregation.py` - Add retention calculation
- **Dashboard:** `/backend/analytics.py` - Add `/retention-cohorts` endpoint (already exists!)
- **Frontend:** Create admin dashboard showing retention cohort analysis

**Current Implementation:**
```python
# backend/auth/analytics_helpers.py has:
def get_user_retention_metrics(db: Session, user_id: str):
    # Returns retention metrics for a user
    # TODO: Verify this calculates cohort retention properly
```

**TODO:** Verify cohort tracking is working properly and retention is calculated correctly.

---

#### Engagement Metrics

**Definition:**
- **Events per User:** Average number of file events tracked per user per day/week/month
- **Suggestions Viewed:** Average number of integration suggestions viewed per user
- **Suggestions Implemented:** Average number of integrations actually set up per user
- **Session Duration:** Average time spent in dashboard per session

**Current Status:**
- ✅ **Infrastructure exists:** `events` table tracks file events, `patterns` table tracks usage
- ❓ **Not instrumented:** No automated engagement metrics calculation

**Where to Instrument:**
- **Backend:** `/backend/jobs/metrics_aggregation.py` - Add engagement metrics calculation
- **Dashboard:** `/backend/analytics.py` - Add `/engagement-metrics` endpoint
- **Frontend:** Track session duration and suggestions viewed (PostHog/Sentry)

**Proposed Implementation:**
```python
# Add to backend/jobs/metrics_aggregation.py
def calculate_engagement_metrics(db: Session, days: int = 30):
    """Calculate engagement metrics for the last N days."""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Events per user
    events_per_user = db.query(
        func.count(Event.id) / func.count(func.distinct(Event.user_id))
    ).filter(Event.timestamp >= start_date).scalar() or 0
    
    # Suggestions viewed (from audit_log or events)
    # TODO: Add tracking for suggestions viewed
    
    # Suggestions implemented (from user_integrations table)
    integrations_per_user = db.query(
        func.count(UserIntegration.id) / func.count(func.distinct(UserIntegration.user_id))
    ).filter(UserIntegration.created_at >= start_date).scalar() or 0
    
    return {
        "events_per_user": round(events_per_user, 2),
        "integrations_per_user": round(integrations_per_user, 2),
        "period_days": days
    }
```

---

## B. GROWTH & ACQUISITION

### User Acquisition Channels

**Inferred from Repository:**
- **Product Hunt:** Mentioned in `/docs/GTM_MATERIALS.md`
- **Hacker News:** Mentioned in `/docs/GTM_MATERIALS.md`
- **Twitter/X:** Mentioned in `/docs/GTM_MATERIALS.md`
- **GitHub:** Open source presence (CLI tool)
- **Content Marketing:** Blog mentioned in `/docs/GTM_MATERIALS.md`

**Current Status:**
- ✅ **Infrastructure exists:** `utm_tracks` table tracks UTM parameters
- ❓ **Not instrumented:** No automated channel attribution or dashboard

**Where to Instrument:**
- **Frontend:** Track UTM parameters on signup (already in schema)
- **Backend:** Query `utm_tracks` table to attribute signups to channels
- **Dashboard:** Create channel attribution dashboard

**Proposed Implementation:**
```python
# Add to backend/analytics.py
@router.get("/acquisition-channels")
async def get_acquisition_channels(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get acquisition channel breakdown."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    channels = db.query(
        UTMTrack.source,
        UTMTrack.medium,
        func.count(func.distinct(UTMTrack.user_id)).label('signups')
    ).filter(
        UTMTrack.timestamp >= start_date,
        UTMTrack.firstTouch == True
    ).group_by(UTMTrack.source, UTMTrack.medium).all()
    
    return {"channels": [{"source": c.source, "medium": c.medium, "signups": c.signups} for c in channels]}
```

---

### Conversion Funnel

**Proposed Funnel:**
1. **Visitor** → Lands on website
2. **Signup** → Creates account
3. **Activated** → Views first suggestion OR connects first integration
4. **Engaged** → Tracks 10+ file events
5. **Retained** → Returns after 7 days
6. **Paying** → Upgrades to Pro/Enterprise

**Current Status:**
- ✅ **Infrastructure exists:** `users` table, `events` table, `subscriptions` table
- ✅ **Partially instrumented:** `/backend/analytics.py` has `/conversion-funnel` endpoint
- ❓ **Not complete:** Funnel stages may not be fully tracked

**Where to Instrument:**
- **Frontend:** Track funnel events (PostHog/Sentry)
- **Backend:** Verify `/conversion-funnel` endpoint calculates all stages correctly
- **Dashboard:** Create funnel visualization

**Current Implementation:**
```python
# backend/analytics.py has:
@router.get("/conversion-funnel")
async def get_conversion_funnel(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Returns funnel metrics
    # TODO: Verify all stages are tracked correctly
```

**TODO:** Verify funnel stages are tracked and calculated correctly.

---

## C. REVENUE & UNIT ECONOMICS

### Revenue Model

**Current Model:**
- **Free:** $0/month - Basic tracking, 2 integrations, 7-day retention
- **Pro:** $29/month - Unlimited tracking, all integrations, 90-day retention
- **Enterprise:** Custom pricing - SSO, unlimited retention, on-premise

**Current Status:**
- ✅ **Infrastructure exists:** `subscriptions` table with Stripe integration
- ✅ **Schema ready:** Stripe webhook handlers, subscription management
- ❓ **Not instrumented:** No automated revenue metrics calculation

**Where to Instrument:**
- **Backend:** Query `subscriptions` table to calculate MRR, ARR, ARPU
- **Dashboard:** Create revenue dashboard
- **Stripe:** Use Stripe API to get real-time revenue data

**Proposed Implementation:**
```python
# Add to backend/analytics.py
@router.get("/revenue-metrics")
async def get_revenue_metrics(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get revenue metrics (MRR, ARR, ARPU)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Calculate MRR from active subscriptions
    active_subscriptions = db.query(Subscription).filter(
        Subscription.status == 'active',
        Subscription.plan.in_(['pro', 'enterprise'])
    ).all()
    
    mrr = sum([
        29 if s.plan == 'pro' else (s.custom_price or 100)  # Default enterprise to $100
        for s in active_subscriptions
    ])
    
    arr = mrr * 12
    arpu = mrr / len(active_subscriptions) if active_subscriptions else 0
    
    return {
        "mrr": mrr,
        "arr": arr,
        "arpu": round(arpu, 2),
        "active_subscriptions": len(active_subscriptions),
        "period_days": days
    }
```

---

### Unit Economics

**Proposed Metrics:**
- **CAC (Customer Acquisition Cost):** Marketing spend / new customers
- **LTV (Lifetime Value):** ARPU × average customer lifetime
- **LTV:CAC Ratio:** Should be > 3:1
- **Payback Period:** Months to recover CAC
- **Gross Margin:** Revenue - infrastructure costs (Supabase, Vercel)

**Current Status:**
- ❌ **Not instrumented:** No CAC tracking, no LTV calculation, no cost tracking

**Where to Instrument:**
- **Marketing:** Track marketing spend by channel (Google Ads, Facebook Ads, etc.)
- **Backend:** Calculate LTV from subscription data
- **Infrastructure:** Track infrastructure costs (Supabase, Vercel)
- **Dashboard:** Create unit economics dashboard

**Proposed Implementation:**
```python
# Add to backend/analytics.py
@router.get("/unit-economics")
async def get_unit_economics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unit economics (CAC, LTV, LTV:CAC, payback period)."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # TODO: Get marketing spend from external source (Google Ads API, etc.)
    marketing_spend = 0  # Placeholder
    
    # Calculate CAC
    new_customers = db.query(func.count(User.id)).filter(
        User.created_at >= datetime.utcnow() - timedelta(days=30)
    ).scalar() or 0
    cac = marketing_spend / new_customers if new_customers > 0 else 0
    
    # Calculate LTV (assume 12-month average lifetime)
    arpu = 29  # Placeholder, should calculate from actual subscriptions
    ltv = arpu * 12
    
    # Calculate LTV:CAC
    ltv_cac_ratio = ltv / cac if cac > 0 else 0
    
    # Calculate payback period (months)
    payback_period = cac / arpu if arpu > 0 else 0
    
    return {
        "cac": round(cac, 2),
        "ltv": round(ltv, 2),
        "ltv_cac_ratio": round(ltv_cac_ratio, 2),
        "payback_period_months": round(payback_period, 2)
    }
```

---

### Gross Margin Drivers

**Infrastructure Costs:**
- **Supabase:** Database hosting (scales with users)
- **Vercel:** Frontend hosting (scales with traffic)
- **Stripe:** Payment processing (2.9% + $0.30 per transaction)
- **PostHog/Sentry:** Analytics/error tracking (may have free tiers)

**Current Status:**
- ❌ **Not instrumented:** No cost tracking, no margin calculation

**Where to Instrument:**
- **Infrastructure:** Track costs from Supabase, Vercel dashboards
- **Backend:** Calculate cost per user, gross margin
- **Dashboard:** Create cost/margin dashboard

**Proposed Implementation:**
```python
# Add to backend/analytics.py
@router.get("/cost-metrics")
async def get_cost_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get infrastructure costs and gross margin."""
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # TODO: Get actual costs from Supabase/Vercel APIs
    supabase_cost = 0  # Placeholder
    vercel_cost = 0  # Placeholder
    stripe_fees = 0  # Placeholder (2.9% + $0.30 per transaction)
    
    total_costs = supabase_cost + vercel_cost + stripe_fees
    
    # Get revenue
    mrr = 0  # Placeholder, should calculate from subscriptions
    gross_margin = mrr - total_costs
    gross_margin_percent = (gross_margin / mrr * 100) if mrr > 0 else 0
    
    return {
        "supabase_cost": supabase_cost,
        "vercel_cost": vercel_cost,
        "stripe_fees": stripe_fees,
        "total_costs": total_costs,
        "mrr": mrr,
        "gross_margin": gross_margin,
        "gross_margin_percent": round(gross_margin_percent, 2)
    }
```

---

## D. METRICS DASHBOARD REQUIREMENTS

### Key Metrics to Display

1. **North Star Metric:** [TODO: Founders to define]
   - Suggested: "Number of integrations implemented per user per month"
   - Alternative: "Time saved per user per month"

2. **Usage Metrics:**
   - DAU, WAU, MAU (trend chart)
   - Activation rate (trend chart)
   - Retention rate (cohort table)

3. **Growth Metrics:**
   - Signups per day/week/month (trend chart)
   - Acquisition channels (pie chart)
   - Conversion funnel (funnel chart)

4. **Revenue Metrics:**
   - MRR, ARR (trend chart)
   - ARPU (trend chart)
   - Subscription breakdown (pie chart: Free/Pro/Enterprise)

5. **Engagement Metrics:**
   - Events per user (trend chart)
   - Suggestions viewed (trend chart)
   - Integrations implemented (trend chart)

6. **Unit Economics:**
   - CAC, LTV, LTV:CAC ratio
   - Payback period
   - Gross margin

---

## TODO: Founders to Complete

> **TODO:** Verify all metrics are being tracked:
> - Test DAU/WAU/MAU calculation
> - Test activation rate calculation
> - Test retention rate calculation
> - Test revenue metrics calculation

> **TODO:** Create admin dashboard:
> - Build dashboard UI showing all metrics
> - Add real-time updates
> - Add export functionality

> **TODO:** Set up automated reporting:
> - Daily metrics email
> - Weekly metrics report
> - Monthly metrics review

> **TODO:** Define North Star Metric:
> - What's the one metric that matters most?
> - How do you measure product-market fit?

> **TODO:** Fill in real metrics:
> - Current DAU/WAU/MAU
> - Current activation rate
> - Current retention rate
> - Current MRR/ARR
> - Current CAC/LTV

---

**Status:** ✅ Draft Complete - Infrastructure exists, needs instrumentation and real data
