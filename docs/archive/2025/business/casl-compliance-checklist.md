> Archived on 2025-11-12. Superseded by: (see docs/final index)

# CASL Compliance Checklist — floyo

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready

---

## Overview

Canada's Anti-Spam Legislation (CASL) regulates commercial electronic messages (CEMs). This checklist ensures floyo complies with CASL requirements.

**Key Requirements:**
- Consent (express or implied)
- Identification information
- Unsubscribe mechanism
- Record-keeping

---

## 1. Consent Requirements

### 1.1 Express Consent (Opt-In)
- ✅ **Marketing Emails:** Opt-in required (checkbox, explicit consent)
- ✅ **Double Opt-In:** Recommended (confirmation email)
- ✅ **Consent Records:** Maintained (email, timestamp, IP address if available)
- ✅ **Granular Consent:** Separate consent for different types of emails (marketing vs. transactional)

**Implementation:**
- [ ] Opt-in checkbox on website/landing page
- [ ] Confirmation email sent after opt-in (double opt-in)
- [ ] Consent records stored (database, timestamp)
- [ ] Consent withdrawal mechanism (unsubscribe)

### 1.2 Implied Consent
- ✅ **Existing Business Relationship:** Valid for 2 years after last purchase
- ✅ **Inquiry:** Valid for 6 months after inquiry
- ✅ **Opt-Out:** Consent expires if user unsubscribes

**Implementation:**
- [ ] Track purchase dates (for 2-year window)
- [ ] Track inquiry dates (for 6-month window)
- [ ] Expire consent automatically after window

---

## 2. Identification Information

### 2.1 Required Information
Every CEM must include:
- ✅ **Sender Name:** floyo or [YOUR-COMPANY-NAME]
- ✅ **Contact Information:** Email [YOUR-EMAIL], address [YOUR-ADDRESS] (if applicable)
- ✅ **Unsubscribe Link:** Clearly visible, functional

**Implementation:**
- [ ] Email template includes sender name
- [ ] Email template includes contact information
- [ ] Unsubscribe link in every email (footer)

---

## 3. Unsubscribe Mechanism

### 3.1 Requirements
- ✅ **Unsubscribe Link:** Clearly visible, functional
- ✅ **No Cost:** Free to unsubscribe
- ✅ **No Conditions:** No conditions or fees
- ✅ **Timely Processing:** Processed within 10 business days

**Implementation:**
- [ ] Unsubscribe link in every email (footer, prominent)
- [ ] One-click unsubscribe (no barriers)
- [ ] Unsubscribe confirmation page
- [ ] Processing within 10 business days (automated)

### 3.2 Unsubscribe Options
- ✅ **Granular:** Different types of emails (marketing vs. transactional)
- ✅ **Complete:** Option to unsubscribe from all marketing emails

**Implementation:**
- [ ] Unsubscribe page with granular options
- [ ] "Unsubscribe from all" option

---

## 4. Record-Keeping

### 4.1 Consent Records
Maintain records of:
- ✅ **Email Address:** Subscriber's email
- ✅ **Consent Date:** Date and time of consent
- ✅ **Consent Method:** How consent was obtained (website, in-app, etc.)
- ✅ **IP Address:** If available (for audit trail)
- ✅ **Unsubscribe Date:** If applicable

**Implementation:**
- [ ] Database table: `email_consents`
  - `email` (string)
  - `consent_date` (datetime)
  - `consent_method` (string)
  - `ip_address` (string, optional)
  - `unsubscribe_date` (datetime, optional)
  - `consent_type` (string: marketing, transactional)

### 4.2 Retention Period
- ✅ **Consent Records:** Retained for 3 years after unsubscribe
- ✅ **Audit Trail:** Maintained for compliance audits

**Implementation:**
- [ ] Retention policy: 3 years after unsubscribe
- [ ] Regular audits (quarterly)

---

## 5. Email Types

### 5.1 Transactional Emails (CASL Exempt)
- ✅ **Account Creation:** Welcome email (no consent required)
- ✅ **Password Reset:** Security email (no consent required)
- ✅ **Invoice:** Billing email (no consent required)
- ✅ **Support Response:** Support email (no consent required)

**Implementation:**
- [ ] Transactional emails clearly marked (not marketing)
- [ ] No unsubscribe required (but provide option)

### 5.2 Commercial Emails (CASL Regulated)
- ✅ **Marketing:** Product updates, promotions (consent required)
- ✅ **Newsletter:** Weekly/monthly updates (consent required)
- ✅ **Announcements:** New features, launches (consent required)

**Implementation:**
- [ ] Marketing emails require express consent (opt-in)
- [ ] Unsubscribe link in every marketing email

---

## 6. Compliance Checklist

### Pre-Launch
- [ ] Consent mechanism implemented (opt-in checkbox)
- [ ] Double opt-in implemented (confirmation email)
- [ ] Consent records database created
- [ ] Email templates include identification information
- [ ] Unsubscribe link in every email
- [ ] Unsubscribe processing implemented (10-day window)
- [ ] Privacy Policy updated (CASL section)

### Post-Launch
- [ ] Consent records maintained (every opt-in)
- [ ] Unsubscribe requests processed within 10 days
- [ ] Regular audits (quarterly)
- [ ] Record retention (3 years)

---

## 7. Email Template Compliance

### 7.1 Required Elements
Every marketing email must include:

```
Subject: [Clear, non-deceptive subject line]

From: floyo <[YOUR-EMAIL]>
Reply-To: [YOUR-EMAIL]

Body:
- Clear identification of sender (floyo)
- Contact information ([YOUR-EMAIL], [YOUR-ADDRESS])
- Unsubscribe link (prominent, functional)
- Mailing address (if applicable)

Footer:
[Unsubscribe Link] | [Privacy Policy] | [Contact]
```

### 7.2 Example Footer

```
---
floyo — Local-First Workflow Automation
Email: [YOUR-EMAIL]
Address: [YOUR-ADDRESS]

[Unsubscribe] | [Privacy Policy] | [Contact]
```

---

## 8. Consent Management

### 8.1 Consent Collection
- **Website:** Opt-in checkbox on landing page
- **In-App:** Settings → Notifications → Marketing emails (opt-in)
- **Double Opt-In:** Confirmation email sent after opt-in

### 8.2 Consent Withdrawal
- **Unsubscribe Link:** One-click unsubscribe (no barriers)
- **Settings:** In-app unsubscribe (Settings → Notifications)
- **Email:** Reply to unsubscribe (if applicable)

---

## 9. Compliance Monitoring

### 9.1 Regular Audits
- **Frequency:** Quarterly
- **Scope:** Consent records, unsubscribe processing, email templates
- **Documentation:** Audit report, findings, actions

### 9.2 Metrics to Track
- **Consent Rate:** Opt-in rate (target: ≥ 20% of users)
- **Unsubscribe Rate:** Unsubscribe rate (target: < 5% per email)
- **Compliance Rate:** 100% (all emails include required elements)

---

## 10. Penalties and Risks

### 10.1 CASL Penalties
- **Individual Violation:** Up to $1,000,000 CAD
- **Business Violation:** Up to $10,000,000 CAD
- **Personal Liability:** Officers and directors can be held liable

### 10.2 Risk Mitigation
- ✅ **Compliance Checklist:** This document
- ✅ **Regular Audits:** Quarterly reviews
- ✅ **Legal Review:** Privacy policy reviewed (if scale requires)
- ✅ **Training:** Self-training on CASL requirements

---

## 11. Implementation Checklist

### Immediate (Pre-Launch)
- [ ] Consent mechanism (opt-in checkbox)
- [ ] Double opt-in (confirmation email)
- [ ] Consent records database
- [ ] Email templates (CASL-compliant)
- [ ] Unsubscribe link (every email)
- [ ] Unsubscribe processing (10-day window)

### Ongoing (Post-Launch)
- [ ] Consent records maintained (every opt-in)
- [ ] Unsubscribe requests processed (within 10 days)
- [ ] Regular audits (quarterly)
- [ ] Record retention (3 years)

---

## 12. Resources

### CASL Resources
- **CRTC CASL Guide:** https://crtc.gc.ca/eng/internet/anti.htm
- **CASL Compliance Guide:** https://www.ic.gc.ca/eic/site/030.nsf/eng/home

### Internal Resources
- **Privacy Policy:** [docs/business/approvals/privacy-policy-pipeda.md](./privacy-policy-pipeda.md)
- **Terms of Service:** [docs/business/approvals/terms-of-service.md](./terms-of-service.md)

---

**Last Updated:** January 2024  
**Version:** 1.0.0  
**Status:** Production-ready
