# Google Merchant Center Readiness — floyo

## Overview

**Purpose:** Prepare floyo for Google Merchant Center listing (if applicable for e-commerce or paid app distribution).

**Note:** floyo is primarily a productivity app, not an e-commerce product. This document is prepared for potential future use or if floyo includes paid app distribution via Google Merchant Center.

---

## Merchant Center Setup

### Account Requirements
- **Business Registration:** Sole Proprietor (Ontario)
- **Tax Information:** GST/HST registration (if applicable)
- **Payment Methods:** Stripe, PayPal (for app purchases)
- **Currency:** CAD (Canadian Dollar)

### Product Information

**Product Type:** Digital Product (Software Application)  
**Category:** Productivity Software  
**Brand:** floyo  
**MPN:** FLOYO-001 (if applicable)

---

## Product Data Feed

### Required Attributes

**Basic Information:**
- `id`: floyo-starter, floyo-pro
- `title`: floyo Starter Subscription, floyo Pro Subscription
- `description`: Local-first workflow automation subscription
- `link`: [YOUR-DOMAIN]/pricing
- `image_link`: [YOUR-DOMAIN]/assets/app-icon-512x512.png
- `availability`: in stock
- `price`: 12.00 CAD, 29.00 CAD
- `brand`: floyo
- `condition`: new
- `google_product_category`: Software > Productivity Software

### Pricing Information
- **Starter:** $12.00 CAD/month
- **Pro:** $29.00 CAD/month
- **Currency:** CAD
- **Tax:** GST/HST 13% (Ontario) applied at checkout

---

## Google Merchant Center Requirements

### Compliance Checklist
- ✅ **Product Information:** Accurate titles, descriptions, prices
- ✅ **Pricing:** CAD currency, GST/HST included
- ✅ **Images:** High-quality product images (512x512 minimum)
- ✅ **Links:** Valid product links, support URLs
- ✅ **Privacy:** Privacy policy linked

### Review Guidelines Responses

**Q: Is your product available for purchase?**
A: Yes. floyo subscriptions are available via Stripe (Starter $12 CAD/month, Pro $29 CAD/month).

**Q: What is your return/refund policy?**
A: 30-day money-back guarantee (see refund policy at [YOUR-DOMAIN]/refund-policy).

**Q: What is your shipping policy?**
A: Digital product (software application), no shipping required. Instant download/access.

---

## Product Feed Schema (XML Example)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <item>
      <g:id>floyo-starter</g:id>
      <g:title>floyo Starter Subscription</g:title>
      <g:description>Local-first workflow automation. Unlimited directories, pattern detection, email support.</g:description>
      <g:link>[YOUR-DOMAIN]/pricing/starter</g:link>
      <g:image_link>[YOUR-DOMAIN]/assets/app-icon-512x512.png</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>12.00 CAD</g:price>
      <g:brand>floyo</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>Software > Productivity Software</g:google_product_category>
    </item>
    <item>
      <g:id>floyo-pro</g:id>
      <g:title>floyo Pro Subscription</g:title>
      <g:description>Advanced workflow automation. API access, priority support, advanced features.</g:description>
      <g:link>[YOUR-DOMAIN]/pricing/pro</g:link>
      <g:image_link>[YOUR-DOMAIN]/assets/app-icon-512x512.png</g:image_link>
      <g:availability>in stock</g:availability>
      <g:price>29.00 CAD</g:price>
      <g:brand>floyo</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>Software > Productivity Software</g:google_product_category>
    </item>
  </channel>
</rss>
```

---

## Merchant Center Checklist

### Pre-Submission
- [ ] Google Merchant Center account created
- [ ] Business information verified
- [ ] Tax information configured (GST/HST)
- [ ] Product feed prepared (XML format)
- [ ] Product images prepared (512x512 minimum)
- [ ] Pricing information verified (CAD)

### Submission
- [ ] Product feed uploaded
- [ ] Product information reviewed
- [ ] Pricing verified
- [ ] Images uploaded
- [ ] Links tested
- [ ] Submission for review

### Post-Submission
- [ ] Monitor feed status
- [ ] Respond to review feedback (if any)
- [ ] Update product information as needed

---

*Last Updated: 2024-01-XX*  
*Version: 1.0.0*
