# Daily Operations Routine — floyo (CAD)

**Purpose**: 15-minute startup checklist for Canadian solo/small-team venture operations

---

## 🌅 Morning Startup (15 minutes)

### **5 min: System Health Check**
```bash
# Run automated health checks
npm run ops:doctor

# Check dashboard for overnight alerts
open https://your-dashboard.vercel.app/ops
```

**What to verify:**
- ✅ No critical alerts in Slack/email
- ✅ Supabase connection healthy
- ✅ Vercel deployment status green
- ✅ Daily backup completed (check `/ops/logs/backups/`)

### **5 min: Review Overnight Activity**
- **New Signups**: Check Supabase dashboard → `users` table (last 24h)
- **Support Tickets**: Check email inbox + automated routing (if configured)
- **Revenue**: Check Stripe dashboard → today's MRR changes
- **Marketing**: Review lead forms → CRM sync status

### **5 min: Daily Tasks Queue**
```
Priority 1 (Critical):
- [ ] Address any P0/P1 support tickets
- [ ] Review failed automation runs (check GitHub Actions)
- [ ] Verify scheduled backups completed

Priority 2 (Important):
- [ ] Review marketing dashboard → new leads
- [ ] Check finance dashboard → reconcile Stripe → Supabase
- [ ] Review growth metrics → DAU/MAU trends

Priority 3 (Nice-to-have):
- [ ] Community engagement (Reddit, Twitter, Product Hunt)
- [ ] Content seeding (LinkedIn post, blog update)
- [ ] Grant/incubator deadline tracking
```

---

## 🤖 Automated Runs (No Action Required)

### **Every Hour**
- ✅ Supabase → Stripe webhook sync (via Supabase Edge Function)
- ✅ Form submissions → CRM (via Zapier/Make)
- ✅ Social media auto-logging (via Zapier)

### **Daily (Overnight)**
- ✅ Analytics script runs → commits report to `/ops/dashboards/reports/`
- ✅ Supabase backup → encrypted snapshot to S3/local
- ✅ Finance dashboard → CAD reconciliation (GST/HST tracking)
- ✅ Marketing dashboard → lead attribution update

### **Weekly (Sunday 2 AM ET)**
- ✅ Full Supabase migration backup
- ✅ Generate weekly growth report → `/ops/dashboards/reports/weekly-YYYYMMDD.md`
- ✅ Rotate API keys/secrets (if 20-day alert triggered)
- ✅ Generate finance summary → `/ops/dashboards/reports/finance-weekly-YYYYMMDD.csv`

### **Monthly**
- ✅ DR rehearsal (disaster recovery test)
- ✅ Dependencies update check
- ✅ Red-team security sweep

---

## 📊 Dashboard Quick Links

| Dashboard | URL | Frequency |
|-----------|-----|-----------|
| **Marketing** | `/ops/dashboards/marketing-dashboard.xlsx` | Daily |
| **Finance (CAD)** | `/ops/dashboards/finance-dashboard.xlsx` | Daily |
| **KPI Tracker** | `/ops/dashboards/kpi-tracker.csv` | Daily |
| **Growth Reports** | `/ops/dashboards/reports/` | Weekly |

---

## 🔧 Manual Fallbacks (If Automation Fails)

### **If Analytics Script Fails**
```bash
# Manual run
cd /workspace
npm run ops:release
# Reports generated in /ops/dashboards/reports/
```

### **If Supabase Backup Fails**
```bash
# Manual backup
npm run ops:snapshot
# Or use Supabase CLI
supabase db dump -f backups/floyo_manual_$(date +%Y%m%d).sql
```

### **If CRM Sync Fails**
1. Export form submissions from Supabase → `forms` table
2. Import to Notion/Airtable manually (template in `/ops/marketing/crm-integration-guide.md`)
3. Check Zapier/Make logs → re-run failed tasks

### **If Finance Dashboard Stale**
```bash
# Manual Stripe → Supabase sync
cd /workspace
python scripts/sync_stripe_to_supabase.py --date-range last-7-days
```

---

## 📧 Support Escalation

| Severity | Response Time | Action |
|----------|---------------|--------|
| **P0** (Outage) | 15 min | Check GitHub Actions → Vercel status → Supabase status |
| **P1** (Critical Bug) | 2 hours | Check support inbox → assign → respond |
| **P2** (Feature Request) | 24 hours | Log to roadmap → respond |
| **P3** (Nice-to-have) | 1 week | Log to backlog |

**Support Inbox**: Check every 2 hours during business hours (9 AM - 6 PM ET)

---

## 🎯 Weekly Routine (Sunday Afternoon)

### **30 min: Weekly Review**
1. **Growth Metrics**: Review `/ops/dashboards/reports/weekly-*.md`
   - DAU/MAU trends
   - Conversion funnel (signup → activation → paid)
   - Churn rate

2. **Finance Review**: Review `/ops/dashboards/reports/finance-weekly-*.csv`
   - MRR changes
   - GST/HST reconciliation
   - Expenses vs. budget

3. **Marketing Review**: Review `/ops/dashboards/marketing-dashboard.xlsx`
   - Lead sources (UTM tracking)
   - Conversion rates
   - Campaign ROI

4. **Support Review**: Review tickets closed this week
   - Common issues → document in FAQ
   - Feature requests → prioritize

### **1 hour: Planning**
- Review upcoming deadlines (grants, incubators)
- Plan next week's content/outreach
- Update investor CRM if fundraising

---

## 📅 Monthly Routine (Last Sunday)

### **2 hours: Monthly Deep Dive**
1. **Business Metrics**
   - LTV:CAC ratio
   - Churn analysis
   - Cohort retention

2. **Finance Close**
   - GST/HST filing prep (if applicable)
   - Expense categorization
   - Revenue recognition

3. **Product Roadmap**
   - Review feature flags → what's working?
   - User feedback synthesis
   - Technical debt prioritization

4. **Fundraising/Grants**
   - Update investor CRM
   - Review grant deadlines
   - Prepare pitch deck updates

---

## 🚨 Emergency Contacts

| Service | Contact | Status Page |
|---------|---------|-------------|
| **Vercel** | support@vercel.com | status.vercel.com |
| **Supabase** | support@supabase.com | status.supabase.com |
| **Stripe** | support@stripe.com | status.stripe.com |
| **GitHub** | github.com/support | githubstatus.com |

---

## 📝 Notes

- **All times in Eastern Time (ET)** unless specified
- **All financials in CAD** (use Bank of Canada exchange rate API if needed)
- **Offline mode**: Reports export to `/ops/logs/` if online sync fails
- **Audit logs**: All manual actions logged to `/ops/logs/audit/`

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
