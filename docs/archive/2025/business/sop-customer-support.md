> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Customer Support SOP — floyo

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready

---

## Overview

This Standard Operating Procedure (SOP) defines customer support processes, SLAs, and escalation procedures for floyo.

**Support Channels:** Email (primary), Community Forum (secondary)  
**Support Hours:** Monday-Friday, 9 AM - 5 PM EST (solo operator, side-gig)  
**Response SLAs:** 48 hours (Starter), 24 hours (Pro)

---

## 1. Support Channels

### 1.1 Email Support (Primary)
- **Email:** [YOUR-EMAIL]
- **Response Time:** 48 hours (Starter), 24 hours (Pro)
- **Hours:** Monday-Friday, 9 AM - 5 PM EST
- **Escalation:** Critical issues escalated immediately

### 1.2 Community Forum (Secondary)
- **Platform:** [YOUR-DOMAIN]/community (Discord/forum)
- **Response Time:** Best effort (community-supported)
- **Hours:** 24/7 (community moderators)
- **Escalation:** Email support if community can't resolve

---

## 2. Support Tiers

### 2.1 Free Tier
- **Support:** Community forum only
- **Response Time:** Best effort (community-supported)
- **Escalation:** N/A

### 2.2 Starter Tier ($12 CAD/month)
- **Support:** Email support
- **Response Time:** 48 hours (business days)
- **Escalation:** Critical issues escalated

### 2.3 Pro Tier ($29 CAD/month)
- **Support:** Email support, priority queue
- **Response Time:** 24 hours (business days)
- **Escalation:** Critical issues escalated immediately

---

## 3. Support SLAs

### 3.1 Response Times
| Tier | Channel | Response Time | Resolution Time |
|------|---------|---------------|-----------------|
| Free | Community | Best effort | N/A |
| Starter | Email | 48 hours | 5 business days |
| Pro | Email | 24 hours | 3 business days |

### 3.2 Escalation Criteria
**Critical (P0):**
- App crashes or data loss
- Security breach
- Payment issues

**High (P1):**
- Feature not working
- Workflow execution failures
- Account access issues

**Medium (P2):**
- Feature requests
- General questions
- Documentation requests

**Low (P3):**
- Enhancement requests
- Feedback
- General inquiries

---

## 4. Support Macros (Top 10 Issues)

### 4.1 Issue: "Pattern detection not working"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Thanks for reaching out. Let's troubleshoot pattern detection:

1. Check monitored directories: Settings → Directories → Ensure directories are configured
2. Verify file activity: Ensure files are being accessed/modified in monitored directories
3. Pattern threshold: Patterns require at least 3 occurrences (configurable in Settings)
4. Check exclusions: Ensure files aren't excluded (Settings → Exclusions)

If issues persist, please share:
- Screenshot of Settings → Directories
- Example of file activity you expect to detect
- Log files (if available)

Best regards,
floyo Support
```

### 4.2 Issue: "Workflow execution failed"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Sorry to hear your workflow failed. Let's debug:

1. Check logs: Settings → Workflows → [Workflow Name] → View Logs
2. Verify API keys: Ensure API keys are configured (Settings → API Keys)
3. Check permissions: Ensure file system permissions are granted
4. Test manually: Try running workflow steps manually to isolate issue

Please share:
- Workflow name and steps
- Error message from logs
- Screenshot of error (if applicable)

Best regards,
floyo Support
```

### 4.3 Issue: "Privacy concerns - data collection"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Thanks for your privacy concern. floyo is local-first and privacy-compliant:

1. Local Processing: All file processing happens locally (no cloud upload)
2. Telemetry: Optional, opt-in only (Settings → Privacy → Telemetry)
3. Data Storage: Files stored locally (encrypted)
4. PIPEDA Compliance: See Privacy Policy: [YOUR-DOMAIN]/privacy-policy

You can:
- Disable telemetry: Settings → Privacy → Telemetry → Off
- Export data: Settings → Privacy → Export Data
- Delete account: Settings → Account → Delete Account

If you have specific concerns, please share details.

Best regards,
floyo Support
```

### 4.4 Issue: "Subscription billing question"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Thanks for your billing question. Here's information:

1. Billing Cycle: Monthly or annual (see Settings → Account → Subscription)
2. Payment Method: Processed by Stripe (secure)
3. Receipts: Sent to your email after payment
4. Cancellation: Settings → Account → Cancel Subscription (takes effect at end of billing period)
5. Refunds: 30-day money-back guarantee (see Refund Policy: [YOUR-DOMAIN]/refund-policy)

If you need help with billing, please share:
- Email address (for account lookup)
- Invoice number (if applicable)
- Specific question

Best regards,
floyo Support
```

### 4.5 Issue: "Can't install app"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Let's troubleshoot installation:

1. System Requirements: macOS 10.15+, Windows 10+, Linux (Ubuntu 20.04+)
2. Permissions: Ensure you have admin permissions (for installation)
3. Antivirus: Check if antivirus is blocking installation
4. Download: Re-download from [YOUR-DOMAIN]/download

Please share:
- Operating system and version
- Error message (if any)
- Antivirus software (if applicable)

Best regards,
floyo Support
```

### 4.6 Issue: "Feature request"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Thanks for your feature request! We appreciate feedback.

1. Feature Request: [FEATURE_NAME]
2. Use Case: [USE_CASE]
3. Priority: [CUSTOMER_PRIORITY]

We'll add this to our roadmap and consider it for future releases. You can also:
- Vote on feature requests: [YOUR-DOMAIN]/feature-requests
- Community discussion: [YOUR-DOMAIN]/community

Best regards,
floyo Support
```

### 4.7 Issue: "Performance issues - app slow"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Let's troubleshoot performance:

1. System Resources: Check CPU/memory usage (Settings → System)
2. Directory Size: Large directories may slow monitoring (reduce monitored directories)
3. Pattern Detection: Disable pattern detection temporarily (Settings → Patterns)
4. Database Size: Export and clear old data (Settings → Privacy → Export Data → Clear)

Please share:
- System specifications (CPU, RAM, OS)
- Number of monitored directories
- Average file count per directory

Best regards,
floyo Support
```

### 4.8 Issue: "Integration not working"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Let's troubleshoot integration:

1. API Keys: Verify API keys are configured (Settings → API Keys)
2. Permissions: Ensure API keys have required permissions
3. Test Connection: Test API connection (Settings → Integrations → Test)
4. Documentation: See integration docs: [YOUR-DOMAIN]/docs/integrations

Please share:
- Integration name (e.g., Dropbox, Shopify)
- Error message (if any)
- API key status (masked, for security)

Best regards,
floyo Support
```

### 4.9 Issue: "Data export request"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Here's how to export your data:

1. Export Data: Settings → Privacy → Export Data → Export
2. Format: JSON or CSV (selectable)
3. Contents: Account info, patterns, workflows, telemetry (if opt-in)

If you need help with export or have specific requirements, please let me know.

Best regards,
floyo Support
```

### 4.10 Issue: "Account deletion request"
**Response Template:**
```
Hi [CUSTOMER_NAME],

Sorry to see you go. Here's how to delete your account:

1. Delete Account: Settings → Account → Delete Account → Confirm
2. Data Deletion: All account data deleted (local files remain on your device)
3. Confirmation: Confirmation email sent after deletion

If you have feedback on why you're leaving, we'd appreciate it (optional survey).

Best regards,
floyo Support
```

---

## 5. Incident Communication

### 5.1 Status Page
- **URL:** [YOUR-DOMAIN]/status
- **Updates:** Real-time status updates for incidents
- **Notification:** Email notification for critical incidents (Pro tier)

### 5.2 Incident Email Template
```
Subject: floyo Incident Update — [INCIDENT_TYPE]

Hi [CUSTOMER_NAME],

We're experiencing [INCIDENT_DESCRIPTION].

Status: [INVESTIGATING/IDENTIFIED/MONITORING/RESOLVED]
Impact: [IMPACT_DESCRIPTION]
Timeline: [ESTIMATED_RESOLUTION_TIME]

Updates: [YOUR-DOMAIN]/status

We apologize for the inconvenience and will keep you updated.

Best regards,
floyo Support
```

---

## 6. Tone Guide

### 6.1 Communication Principles
- **Professional:** Clear, concise, professional tone
- **Empathetic:** Acknowledge customer frustration
- **Helpful:** Provide actionable solutions
- **Transparent:** Be honest about limitations

### 6.2 Language Guidelines
- **Avoid:** Jargon, technical terms (unless customer is technical)
- **Use:** Plain language, clear instructions
- **Tone:** Friendly but professional

---

## 7. Escalation Procedures

### 7.1 Escalation Triggers
- **Critical Issues:** App crashes, data loss, security breaches
- **Payment Issues:** Billing errors, refund requests
- **Legal Requests:** PIPEDA requests, legal inquiries

### 7.2 Escalation Process
1. **Identify:** Issue severity (P0/P1/P2/P3)
2. **Escalate:** Email [YOUR-EMAIL] with [ESCALATION] tag
3. **Response:** Acknowledge within 1 hour (critical)
4. **Resolution:** Update customer within SLA

---

## 8. Support Metrics

### 8.1 Key Metrics
- **Response Time:** Average response time (target: ≤ SLA)
- **Resolution Time:** Average resolution time (target: ≤ SLA)
- **Customer Satisfaction:** CSAT score (target: ≥ 4.5/5)
- **Ticket Volume:** Number of tickets per week/month

### 8.2 Reporting
- **Frequency:** Weekly (internal), Monthly (external)
- **Dashboard:** [YOUR-DOMAIN]/support/metrics (internal)

---

## 9. Support Tools

### 9.1 Email Management
- **Tool:** Gmail/Outlook (solo operator)
- **Organization:** Labels/folders by tier, priority
- **Templates:** Email templates (macros)

### 9.2 Documentation
- **FAQ:** [YOUR-DOMAIN]/faq
- **Documentation:** [YOUR-DOMAIN]/docs
- **Community:** [YOUR-DOMAIN]/community

---

## 10. Continuous Improvement

### 10.1 Feedback Collection
- **CSAT Survey:** After ticket resolution
- **Feedback:** Monthly feedback survey
- **Improvement:** Quarterly review of support processes

### 10.2 Training
- **Self-Training:** PIPEDA, CASL, technical training
- **Documentation:** Keep support docs updated
- **Macros:** Update macros based on common issues

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
