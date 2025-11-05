# Influencer Outreach Automation — floyo (CAD)

**Purpose**: Systematic approach to influencer partnerships and content amplification

---

## 🎯 Target Influencer Types

1. **Tech YouTubers** (10K-100K subscribers)
   - Focus: Productivity, automation, developer tools
   - Example: "Tech Productivity Tips", "Developer Workflows"

2. **Productivity Twitter/X** (5K-50K followers)
   - Focus: Time-saving, workflow optimization
   - Example: "Productivity Hacks", "Solo Operator Tips"

3. **Indie Hacker Communities** (Reddit, Discord)
   - Focus: Solo operators, small teams
   - Example: r/indiebiz, r/SaaS, Indie Hackers

4. **LinkedIn Thought Leaders** (5K-20K connections)
   - Focus: Business automation, entrepreneurship
   - Example: "Small Business Automation", "Canadian Tech"

---

## 📋 Outreach Process

### **Step 1: Research & List Building**

**Tools:**
- **YouTube**: Search "productivity automation", filter by views/subscribers
- **Twitter/X**: Search "productivity tools", filter by followers/engagement
- **LinkedIn**: Search "workflow automation", filter by connections
- **Reddit**: Search r/productivity, r/automation, r/indiebiz

**Template: Airtable/Notion Database**

| Column | Type | Example |
|--------|------|---------|
| Name | Text | John Doe |
| Platform | Select | YouTube, Twitter, LinkedIn, Reddit |
| Handle | Text | @johndoe |
| Followers | Number | 25000 |
| Engagement Rate | Number | 3.5 |
| Contact Email | Email | john@example.com |
| Status | Select | New, Contacted, Responded, Partnership, Declined |
| Notes | Text | |

**Automation:**
- Zapier: YouTube API → Add to Airtable
- Zapier: Twitter API → Add to Airtable
- Manual: LinkedIn → Add to Airtable

---

### **Step 2: Initial Outreach**

**Email Template 1: Cold Outreach**

**Subject**: Partnership Opportunity — floyo × [Influencer Name]

**Body**:
```
Hi {{name}},

I've been following your content on {{platform}} and love your take on {{topic}}. 

I'm building floyo, a local-first workflow automation tool for solo operators. Your audience ({{audience_description}}) would find it valuable—it helps save 5-10 hours/week by detecting file usage patterns.

**Partnership Offer:**
- Free Pro account (lifetime)
- Revenue share (20% of conversions from your link)
- Co-marketing opportunities

**What We're Looking For:**
- Honest review/testimonial
- Tutorial video (if YouTube)
- Social mention (if Twitter/LinkedIn)

**Timeline**: Flexible—whenever works for you.

Interested? Reply and we can chat.

Best,
[Your Name]
Founder, floyo
```

**Email Template 2: Warm Outreach (If They Mentioned Automation)**

**Subject**: Saw your post on {{topic}} — thought you'd like floyo

**Body**:
```
Hi {{name}},

I saw your post about {{topic}} and thought floyo might be a good fit.

floyo is a local-first workflow automation tool that runs entirely on your device—no cloud dependency, complete privacy. Perfect for privacy-conscious solo operators.

**Quick Demo**: https://floyo.dev/demo

**Partnership**: If you're interested, I'd love to send you a free Pro account and see if it fits your workflow.

No pressure—just thought you'd appreciate it.

Best,
[Your Name]
Founder, floyo
```

---

### **Step 3: Follow-up Sequence**

**Follow-up 1 (Day 3)**
```
Subject: Re: Partnership Opportunity — floyo

Hi {{name}},

Just following up on my previous email. If you're not interested, no worries—just reply "not interested" and I'll remove you from future emails.

If you are interested, here's the free Pro account: https://floyo.dev/partner-signup?code={{partner_code}}

Best,
[Your Name]
```

**Follow-up 2 (Day 7)**
```
Subject: Last chance: Free Pro account expires soon

Hi {{name}},

Quick reminder: Your free Pro account expires in 3 days. Claim it here: https://floyo.dev/partner-signup?code={{partner_code}}

If you're not interested, just reply "unsubscribe" and I'll remove you.

Best,
[Your Name]
```

---

### **Step 4: Partnership Management**

**Track in Notion/Airtable:**
- Partnership status
- Content delivered (review, video, post)
- Conversions from their link
- Revenue share payments

**Automation:**
- Zapier: New conversion from partner link → Update Airtable
- Zapier: Monthly revenue share calculation → Email partner

---

## 📊 Content Seeding Checklist

### **Pre-Launch**

- [ ] Identify 10-20 target influencers
- [ ] Send initial outreach emails
- [ ] Follow up with non-responders
- [ ] Secure 3-5 partnerships

### **Launch Day**

- [ ] Partner posts go live
- [ ] Monitor mentions/tags
- [ ] Engage with comments
- [ ] Track conversions

### **Post-Launch**

- [ ] Thank partners for support
- [ ] Share partner content on your channels
- [ ] Calculate revenue share
- [ ] Plan next campaign

---

## 🤖 Automation Setup (Zapier/Make)

### **Zap 1: Influencer Discovery**

**Trigger**: YouTube API (New video with keywords)
**Action**: Add to Airtable (Influencer Database)
**Filter**: Subscribers > 10K, Engagement Rate > 2%

### **Zap 2: Outreach Sequence**

**Trigger**: New Airtable record (Influencer Database, Status = "New")
**Action 1**: Send Email (Gmail/SendGrid)
  - Template: Cold Outreach
  - Delay: 0 (immediate)
**Action 2**: Update Airtable (Status = "Contacted")

### **Zap 3: Follow-up Sequence**

**Trigger**: Airtable record updated (Status = "Contacted", Updated > 3 days ago)
**Action**: Send Email (Follow-up 1)
**Filter**: Status != "Responded" AND Status != "Partnership"

### **Zap 4: Conversion Tracking**

**Trigger**: Stripe Webhook (Payment Succeeded)
**Action**: Update Airtable (Influencer Database)
**Filter**: UTM Source contains partner handle
**Update**: Add conversion count, calculate revenue share

---

## 📈 Metrics & ROI

### **Track Metrics**
- Outreach emails sent
- Response rate
- Partnership conversion rate
- Conversions from partner links
- Revenue share paid
- ROI (Revenue / Outreach Cost)

### **Monthly Report**
```
Influencer Outreach — [Month]

Outreach:
- Emails sent: {{sent}}
- Responses: {{responses}}
- Response rate: {{response_rate}}%

Partnerships:
- Active partners: {{active}}
- Content delivered: {{content}}
- Conversions: {{conversions}}
- Revenue: ${{revenue}} CAD

ROI: {{roi}}%
```

---

## 🎯 Best Practices

1. **Personalize**: Mention specific content/post
2. **Value First**: Focus on value to their audience
3. **Be Flexible**: No rigid requirements
4. **Track Everything**: Use UTM parameters for attribution
5. **Follow Up**: But don't spam (max 2 follow-ups)
6. **Build Relationships**: Long-term partnerships > one-off posts

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
