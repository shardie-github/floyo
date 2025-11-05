# Helpdesk Playbook — floyo (CAD)

**Purpose**: Standard operating procedures for customer support operations

---

## 🎯 Support Tiers

| Tier | Response Time | Resolution Time | Examples |
|------|---------------|-----------------|----------|
| **P0** (Critical) | 15 min | 2 hours | Site down, payment failed, data loss |
| **P1** (High) | 2 hours | 24 hours | Feature broken, login issues |
| **P2** (Medium) | 24 hours | 3 days | Feature request, bug report |
| **P3** (Low) | 1 week | 2 weeks | Nice-to-have, documentation |

---

## 📧 Support Channels

### **Primary: Email**
- **Address**: support@floyo.dev
- **Check Frequency**: Every 2 hours (9 AM - 6 PM ET)
- **Auto-Response**: Yes (Zapier template)

### **Secondary: In-App Chat**
- **Widget**: Intercom/Crisp (if configured)
- **Hours**: 9 AM - 6 PM ET (weekdays)

### **Tertiary: Community**
- **Discord**: https://discord.gg/floyo
- **Reddit**: r/floyo
- **Check Frequency**: Daily

---

## 🔄 Support Workflow

### **Step 1: Ticket Intake**

**Email → Zapier → Notion/Sheet**

**Zapier Setup:**
```
Trigger: New Email (Gmail/Outlook)
Action 1: Create Notion Page (Support Tickets database)
  - From: {{from_email}}
  - Subject: {{subject}}
  - Body: {{body}}
  - Status: "New"
  - Priority: Auto-assign based on keywords
Action 2: Send Slack Notification
  - Channel: #support
  - Message: "New ticket: {{subject}}"
```

**Auto-Priority Rules:**
- **P0 Keywords**: "down", "broken", "error", "can't", "won't", "failed"
- **P1 Keywords**: "bug", "issue", "problem", "not working"
- **P2 Keywords**: "request", "suggestion", "feature", "enhancement"
- **P3 Keywords**: "question", "help", "how", "documentation"

### **Step 2: Triage**

**Manual Review (if auto-priority unclear):**
1. Read ticket → understand issue
2. Check Supabase logs → look for errors
3. Check GitHub Issues → see if reported
4. Assign priority
5. Assign to queue (if team) or self-assign

### **Step 3: Response**

**Template Library:**

**P0 Response (Immediate)**
```
Subject: Re: [P0] {{subject}}

Hi {{name}},

Thanks for reporting this. We're investigating immediately and will update you within 15 minutes.

Best,
[Your Name]
floyo Support
```

**P1 Response (Within 2 hours)**
```
Subject: Re: [P1] {{subject}}

Hi {{name}},

Thanks for reporting this. We've logged it and are working on a fix. We'll update you within 24 hours.

In the meantime, here's a workaround: [workaround if available]

Best,
[Your Name]
floyo Support
```

**P2 Response (Within 24 hours)**
```
Subject: Re: [P2] {{subject}}

Hi {{name}},

Thanks for your request. We've added it to our roadmap and will prioritize based on user feedback.

Timeline: [estimate if available]

Best,
[Your Name]
floyo Support
```

**P3 Response (Within 1 week)**
```
Subject: Re: [P3] {{subject}}

Hi {{name}},

Thanks for your suggestion. We've logged it for future consideration.

Best,
[Your Name]
floyo Support
```

### **Step 4: Resolution**

**Close Ticket:**
1. Verify issue resolved
2. Update ticket status: "Resolved"
3. Send follow-up email:
```
Subject: Re: {{subject}} — Resolved

Hi {{name}},

This issue has been resolved. If you have any other questions, just reply to this email.

Best,
[Your Name]
floyo Support
```

---

## 📊 Common Issues & Solutions

### **Issue 1: "Can't log in"**

**Diagnosis:**
1. Check Supabase `users` table → verify email exists
2. Check `auth.sessions` → verify session valid
3. Check error logs → look for auth errors

**Solutions:**
- **Forgot password**: Send password reset link
- **2FA issue**: Verify TOTP code, reset if needed
- **Account locked**: Unlock account, reset password

**Template:**
```
Hi {{name}},

Here's a password reset link: https://floyo.dev/reset-password?token={{token}}

If you're still having issues, reply to this email.

Best,
[Your Name]
```

### **Issue 2: "Feature not working"**

**Diagnosis:**
1. Check feature flags → verify feature enabled
2. Check user plan → verify feature available
3. Check error logs → look for specific errors

**Solutions:**
- **Feature flag off**: Enable for user
- **Plan limitation**: Upgrade required
- **Bug**: Log to GitHub Issues, provide workaround

**Template:**
```
Hi {{name}},

This feature requires {{plan_name}} plan. Upgrade here: https://floyo.dev/upgrade

If you're already on {{plan_name}}, this might be a bug. We're investigating.

Best,
[Your Name]
```

### **Issue 3: "Payment failed"**

**Diagnosis:**
1. Check Stripe dashboard → verify payment attempt
2. Check Supabase `subscriptions` table → verify status
3. Check error logs → look for Stripe errors

**Solutions:**
- **Card declined**: Ask to update payment method
- **Insufficient funds**: Suggest alternative payment
- **Stripe error**: Check Stripe status page

**Template:**
```
Hi {{name}},

Your payment failed. Please update your payment method: https://floyo.dev/billing

If you continue to have issues, reply to this email.

Best,
[Your Name]
```

### **Issue 4: "Data missing"**

**Diagnosis:**
1. Check Supabase `files` table → verify data exists
2. Check RLS policies → verify user has access
3. Check backups → verify data not deleted

**Solutions:**
- **RLS issue**: Fix policy, grant access
- **Data deleted**: Restore from backup
- **Sync issue**: Trigger manual sync

**Template:**
```
Hi {{name}},

We've restored your data from backup. Please check again in 5 minutes.

If data is still missing, reply to this email with details.

Best,
[Your Name]
```

---

## 🤖 Automation Rules

### **Auto-Response**

**Zapier Setup:**
```
Trigger: New Email (Gmail/Outlook)
Filter: From contains "@" (not from support@floyo.dev)
Action: Send Email
  - To: {{from_email}}
  - Subject: Re: {{subject}}
  - Body: "Thanks for contacting floyo support. We'll respond within [SLA time]."
```

### **Escalation**

**Zapier Setup:**
```
Trigger: Notion Page Updated (Support Tickets)
Filter: Status = "P0" AND Updated > 2 hours ago
Action: Send Slack Notification
  - Channel: #support-critical
  - Message: "P0 ticket not resolved: {{ticket_url}}"
```

### **Follow-up**

**Zapier Setup:**
```
Trigger: Notion Page Updated (Support Tickets)
Filter: Status = "Resolved" AND Resolved < 24 hours ago
Action: Send Email
  - To: {{customer_email}}
  - Subject: How was your support experience?
  - Body: "Hi {{name}}, How was your support experience? [CSAT survey link]"
```

---

## 📈 Metrics & Reporting

### **Daily Metrics**
- Tickets opened
- Tickets closed
- Average response time
- Average resolution time
- Customer satisfaction (CSAT)

### **Weekly Report**
```
Week of [DATE]

Tickets:
- Opened: {{opened}}
- Closed: {{closed}}
- Pending: {{pending}}

SLA Compliance:
- P0: {{p0_compliance}}%
- P1: {{p1_compliance}}%
- P2: {{p2_compliance}}%

Top Issues:
1. {{issue_1}} ({{count}})
2. {{issue_2}} ({{count}})
3. {{issue_3}} ({{count}})

CSAT: {{csat_score}}/5
```

---

## 🔧 Tools & Integrations

### **Required Tools**
- **Email**: Gmail/Outlook (Zapier integration)
- **CRM**: Notion/Airtable (ticket tracking)
- **Slack**: Notifications
- **Supabase**: Logs, user data
- **Stripe**: Payment issues

### **Optional Tools**
- **Intercom/Crisp**: In-app chat
- **Zendesk**: Full helpdesk (if scaling)
- **Sentry**: Error tracking
- **LogRocket**: Session replay

---

## 📝 Maintenance

**Daily:**
- Review open tickets
- Check SLA compliance
- Respond to P0/P1 tickets

**Weekly:**
- Generate weekly report
- Review common issues → update FAQ
- Update templates based on feedback

**Monthly:**
- Review CSAT trends
- Identify top issues → prioritize fixes
- Update playbook based on learnings

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
