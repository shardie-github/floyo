# Automated Lead Flow Guide — floyo (CAD)

**Purpose**: Step-by-step guide for lead capture → CRM → email automation setup

---

## 🔄 Complete Lead Flow Architecture

```
[Lead Source] → [Form Capture] → [Zapier/Make] → [CRM] → [Email Sequence] → [Conversion]
     ↓              ↓                  ↓            ↓            ↓               ↓
  Website      Supabase           Webhook      Notion      Gmail/SendGrid   Stripe
  Product Hunt  Forms Table       Trigger      Database     Automated        Payment
  LinkedIn      Webhook
  Twitter
```

---

## 📋 Step 1: Lead Capture Setup

### **Option A: Supabase Forms (Recommended)**

1. **Create Form Table in Supabase**
```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT, -- 'website', 'product_hunt', 'linkedin', etc.
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new' -- 'new', 'contacted', 'qualified', 'converted', 'lost'
);

-- Enable RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts
CREATE POLICY "Allow public form submissions"
  ON form_submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated reads
CREATE POLICY "Allow authenticated reads"
  ON form_submissions FOR SELECT
  TO authenticated
  USING (true);
```

2. **Create Form Component (Frontend)**
```typescript
// Example: frontend/components/LeadForm.tsx
const submitLead = async (formData: FormData) => {
  const { data, error } = await supabase
    .from('form_submissions')
    .insert({
      email: formData.email,
      name: formData.name,
      source: 'website', // or detect from referrer
      utm_source: getUTMParam('utm_source'),
      utm_medium: getUTMParam('utm_medium'),
      utm_campaign: getUTMParam('utm_campaign'),
      message: formData.message,
    });
};
```

3. **Enable Webhook Trigger**
```sql
-- Create webhook function
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://hooks.zapier.com/hooks/catch/YOUR_WEBHOOK_ID/',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'name', NEW.name,
      'source', NEW.source,
      'utm_source', NEW.utm_source,
      'created_at', NEW.created_at
    )::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_new_lead
  AFTER INSERT ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_lead();
```

### **Option B: Third-Party Forms (Typeform, Google Forms)**

1. **Typeform → Zapier**
   - Zapier Trigger: "New Typeform Entry"
   - Action: Webhook → Supabase `form_submissions` table

2. **Google Forms → Zapier**
   - Zapier Trigger: "New Google Form Response"
   - Action: Webhook → Supabase `form_submissions` table

---

## 🔗 Step 2: Zapier/Make Automation Setup

### **Zapier Blueprint**

**Zap 1: New Lead → CRM**
- **Trigger**: Webhook from Supabase (`form_submissions` table insert)
- **Action 1**: Create Notion Page
  - Database: "Leads"
  - Properties:
    - Email: `{{email}}`
    - Name: `{{name}}`
    - Source: `{{source}}`
    - UTM Source: `{{utm_source}}`
    - UTM Campaign: `{{utm_campaign}}`
    - Status: "New"
    - Created: `{{created_at}}`
- **Action 2**: Create Airtable Record (if using Airtable)
  - Base: "Marketing"
  - Table: "Leads"
  - Fields: Same as above

**Zap 2: New Lead → Email Sequence**
- **Trigger**: Same webhook from Supabase
- **Filter**: Only if `status == 'new'`
- **Action 1**: Send Email (Gmail or SendGrid)
  - Template: "Welcome Email" (see below)
  - To: `{{email}}`
  - Subject: "Welcome to floyo — Let's automate your workflow"
- **Action 2**: Schedule Follow-up (Delayed)
  - Delay: 3 days
  - Template: "Follow-up Email"

**Zap 3: Lead Conversion → Update CRM**
- **Trigger**: Stripe Webhook (Payment Succeeded)
- **Action**: Update Notion/Airtable
  - Find Lead by Email
  - Update Status: "Converted"
  - Update Conversion Date: `{{created_at}}`
  - Update Plan: `{{plan_name}}`

### **Make.com Blueprint**

**Scenario 1: Lead Capture Flow**
```
1. Webhook (Supabase) → 
2. Router (filter by source) →
   - Branch A: Product Hunt → Create Notion + Send Email
   - Branch B: Website → Create Notion + Send Email + Add to Slack
   - Branch C: LinkedIn → Create Notion + Send Email + Add to LinkedIn CRM
3. Update Supabase (status = 'processed')
```

**Scenario 2: Nurture Sequence**
```
1. Webhook (Supabase) → 
2. Delay 3 days →
3. Check if converted (Stripe) →
   - If not converted: Send Email #2
   - If converted: Stop sequence
4. Delay 7 days →
5. Check if converted again →
   - If not converted: Send Email #3
```

---

## 📧 Step 3: Email Templates

### **Welcome Email (Immediate)**

**Subject**: Welcome to floyo — Let's automate your workflow

**Body**:
```
Hi {{name}},

Thanks for your interest in floyo! 🎉

floyo is a local-first workflow automation tool that helps solo operators save 5-10 hours/week by detecting patterns in your file usage and suggesting API integrations.

**Next Steps:**
1. Sign up for free: https://floyo.dev/signup
2. Watch 2-min demo: https://floyo.dev/demo
3. Join our community: https://discord.gg/floyo

**Special Offer for Early Adopters:**
Use code EARLY20 for 20% off your first 3 months.

Questions? Just reply to this email.

Best,
[Your Name]
Founder, floyo
```

### **Follow-up Email #1 (Day 3)**

**Subject**: Still interested in automating your workflow?

**Body**:
```
Hi {{name}},

I noticed you checked out floyo a few days ago. Wondering if you had any questions?

**Common Questions:**
- "Do I need to code?" → No! floyo provides sample code for all integrations.
- "Is my data private?" → Yes! Everything runs locally—no cloud dependency.
- "How much does it cost?" → Starts at $12 CAD/month (40% cheaper than Zapier).

**Try it free for 14 days:** https://floyo.dev/signup

No pressure, just want to make sure you have what you need.

Best,
[Your Name]
```

### **Follow-up Email #2 (Day 7)**

**Subject**: Last chance: 20% off expires tomorrow

**Body**:
```
Hi {{name}},

Quick reminder: Your early adopter discount (20% off) expires tomorrow.

**Why floyo?**
- Local-first privacy (your files never leave your device)
- 40% cheaper than Zapier
- File system awareness (competitors don't offer this)

**Start your 14-day free trial:** https://floyo.dev/signup?code=EARLY20

If you're not interested, no worries—just reply "unsubscribe" and I'll remove you from future emails.

Best,
[Your Name]
```

### **Conversion Email (After Payment)**

**Subject**: Welcome to floyo Pro! 🎉

**Body**:
```
Hi {{name}},

Thanks for joining floyo Pro! 🚀

**Your Account:**
- Plan: {{plan_name}}
- Billing: {{billing_amount}} CAD/month
- Next billing date: {{next_billing_date}}

**Get Started:**
1. Download floyo: https://floyo.dev/download
2. Watch onboarding video: https://floyo.dev/onboarding
3. Join Pro Slack: https://slack.floyo.dev/pro

**Resources:**
- Documentation: https://docs.floyo.dev
- Community: https://discord.gg/floyo
- Support: support@floyo.dev

Questions? Just reply to this email.

Best,
[Your Name]
```

---

## 📊 Step 4: CRM Setup (Notion)

### **Database Structure**

**Table: Leads**
| Property | Type | Options |
|----------|------|---------|
| Email | Email | |
| Name | Text | |
| Source | Select | Website, Product Hunt, LinkedIn, Twitter, Other |
| UTM Source | Text | |
| UTM Campaign | Text | |
| Status | Select | New, Contacted, Qualified, Converted, Lost |
| Created | Date | |
| Last Contacted | Date | |
| Conversion Date | Date | |
| Plan | Select | Free, Pro, Enterprise |
| Notes | Text | |

**Views:**
- **New Leads** (Filter: Status = "New")
- **This Week** (Filter: Created >= Last 7 days)
- **High Priority** (Filter: Source = "Product Hunt" OR UTM Campaign contains "paid")
- **Converted** (Filter: Status = "Converted")

---

## 📈 Step 5: Analytics & Attribution

### **UTM Tracking**

**Website Forms:**
```
https://floyo.dev/signup?utm_source=website&utm_medium=form&utm_campaign=homepage
```

**Product Hunt:**
```
https://floyo.dev/signup?utm_source=product_hunt&utm_medium=referral&utm_campaign=launch
```

**LinkedIn Ads:**
```
https://floyo.dev/signup?utm_source=linkedin&utm_medium=paid&utm_campaign=2025_q1
```

**Twitter:**
```
https://floyo.dev/signup?utm_source=twitter&utm_medium=organic&utm_campaign=community
```

### **Tracking Dashboard**

Create Supabase view:
```sql
CREATE VIEW lead_attribution AS
SELECT 
  utm_source,
  utm_medium,
  utm_campaign,
  COUNT(*) as total_leads,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
  ROUND(100.0 * COUNT(CASE WHEN status = 'converted' THEN 1 END) / COUNT(*), 2) as conversion_rate
FROM form_submissions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY total_leads DESC;
```

---

## ✅ Step 6: Testing Checklist

- [ ] Test form submission → Supabase insert
- [ ] Test webhook → Zapier/Make trigger
- [ ] Test CRM creation (Notion/Airtable)
- [ ] Test welcome email delivery
- [ ] Test follow-up email delays
- [ ] Test conversion webhook → CRM update
- [ ] Test unsubscribe flow
- [ ] Test UTM tracking → attribution dashboard

---

## 🔧 Troubleshooting

### **Webhook Not Firing**
1. Check Supabase logs → `supabase/logs`
2. Check Zapier/Make logs → re-run failed tasks
3. Verify webhook URL is correct
4. Check RLS policies allow webhook access

### **Email Not Sending**
1. Check Gmail/SendGrid API limits
2. Verify email templates are valid
3. Check spam folder
4. Verify email addresses are valid

### **CRM Not Updating**
1. Check Zapier/Make connection status
2. Verify API keys are valid
3. Check Notion/Airtable permissions
4. Review error logs in Zapier/Make

---

## 📝 Maintenance

**Weekly:**
- Review lead conversion rates
- Check email open/click rates
- Review CRM for stale leads (>30 days)

**Monthly:**
- Update email templates based on performance
- Review UTM attribution → optimize campaigns
- Clean up CRM (archive old leads)

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
