# Chatbot FAQ Builder — floyo (CAD)

**Purpose**: Guide for building and maintaining a chatbot FAQ system

---

## 🤖 Chatbot Platforms

### **Option 1: Supabase Edge Function + Simple Bot**
- **Cost**: Free (within Supabase limits)
- **Setup**: Custom JavaScript bot
- **Best For**: Basic FAQ, simple routing

### **Option 2: Intercom/Crisp**
- **Cost**: ~$20-50 CAD/month
- **Setup**: Built-in bot builder
- **Best For**: Full-featured support bot

### **Option 3: Custom GPT/Claude Integration**
- **Cost**: Pay-per-use (~$0.01-0.10 CAD per query)
- **Setup**: API integration
- **Best For**: Advanced, context-aware responses

---

## 📋 FAQ Database Structure

### **Supabase Table**

```sql
CREATE TABLE IF NOT EXISTS faq_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT, -- 'getting-started', 'billing', 'technical', 'troubleshooting'
  keywords TEXT[], -- Array of keywords for matching
  priority INTEGER DEFAULT 0, -- Higher = shown first
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE faq_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public reads
CREATE POLICY "Allow public FAQ reads"
  ON faq_entries FOR SELECT
  TO anon
  USING (true);
```

---

## 💬 FAQ Content

### **Category: Getting Started**

**Q: What is floyo?**
**A**: floyo is a local-first workflow automation tool that detects patterns in your file usage and suggests API integrations. It runs entirely on your device—no cloud dependency, complete privacy.

**Keywords**: ["what", "is", "floyo", "about", "description"]

---

**Q: How do I get started?**
**A**: 
1. Sign up at https://floyo.dev/signup
2. Download floyo for your platform
3. Grant file system access when prompted
4. Start using your files—floyo will detect patterns automatically

**Keywords**: ["start", "begin", "getting started", "setup", "install"]

---

**Q: Do I need to know how to code?**
**A**: No! floyo provides sample code for all integrations. You can approve suggestions and workflows run automatically. However, basic coding knowledge helps if you want to customize workflows.

**Keywords**: ["code", "programming", "developer", "technical", "coding"]

---

### **Category: Billing**

**Q: How much does floyo cost?**
**A**: 
- **Free**: Basic pattern detection
- **Pro**: $12 CAD/month — Full automation, unlimited workflows
- **Enterprise**: $49 CAD/month — Team features, priority support

**Keywords**: ["price", "cost", "pricing", "plan", "subscription", "billing"]

---

**Q: Can I cancel anytime?**
**A**: Yes! Cancel anytime from your billing page. You'll retain access until the end of your billing period.

**Keywords**: ["cancel", "cancelation", "refund", "unsubscribe"]

---

**Q: Do you offer refunds?**
**A**: Yes, we offer a 14-day money-back guarantee. If you're not satisfied, contact support@floyo.dev within 14 days of purchase.

**Keywords**: ["refund", "money back", "guarantee", "satisfaction"]

---

### **Category: Technical**

**Q: Is my data private?**
**A**: Yes! floyo runs entirely locally—your files never leave your device. We're PIPEDA compliant (Canadian privacy law).

**Keywords**: ["privacy", "data", "security", "private", "local", "PIPEDA"]

---

**Q: What file types does floyo support?**
**A**: floyo monitors all file types but focuses on:
- Documents (PDF, DOCX, TXT, MD)
- Code files (Python, JavaScript, TypeScript, etc.)
- Data files (CSV, JSON, XML)
- Images (JPG, PNG, SVG)

**Keywords**: ["file types", "formats", "supported", "files"]

---

**Q: Can I sync across devices?**
**A**: Yes! Pro and Enterprise plans include cloud sync (optional). Your patterns sync securely across devices.

**Keywords**: ["sync", "cloud", "devices", "multiple", "backup"]

---

### **Category: Troubleshooting**

**Q: floyo isn't detecting patterns. What should I do?**
**A**: 
1. Ensure floyo has file system access (check permissions)
2. Use files consistently for 2-3 repetitions
3. Check monitored directories in settings
4. Contact support@floyo.dev if issues persist

**Keywords**: ["not detecting", "patterns", "not working", "issue", "problem"]

---

**Q: I can't log in. Help!**
**A**: 
1. Try password reset: https://floyo.dev/reset-password
2. Check email for verification link
3. Disable VPN if using one
4. Contact support@floyo.dev if still stuck

**Keywords**: ["login", "can't log in", "password", "access", "account"]

---

**Q: My workflow stopped working.**
**A**: 
1. Check if workflow is enabled in settings
2. Verify file paths haven't changed
3. Check logs: Settings → Logs
4. Contact support@floyo.dev with error details

**Keywords**: ["workflow", "not working", "stopped", "broken", "error"]

---

## 🔧 Chatbot Implementation

### **Simple Bot (Supabase Edge Function)**

```typescript
// supabase/functions/chatbot/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { question } = await req.json()
  
  // Simple keyword matching
  const keywords = question.toLowerCase().split(' ')
  
  // Query FAQ entries
  const { data, error } = await supabase
    .from('faq_entries')
    .select('*')
    .order('priority', { ascending: false })
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
  
  // Find best match
  let bestMatch = null
  let bestScore = 0
  
  for (const entry of data) {
    const entryKeywords = entry.keywords.map(k => k.toLowerCase())
    const score = keywords.filter(k => entryKeywords.includes(k)).length
    
    if (score > bestScore) {
      bestScore = score
      bestMatch = entry
    }
  }
  
  if (bestMatch && bestScore > 0) {
    // Update views
    await supabase
      .from('faq_entries')
      .update({ views: bestMatch.views + 1 })
      .eq('id', bestMatch.id)
    
    return new Response(JSON.stringify({
      answer: bestMatch.answer,
      category: bestMatch.category,
    }), {
      headers: { "Content-Type": "application/json" },
    })
  }
  
  // Fallback
  return new Response(JSON.stringify({
    answer: "I couldn't find an answer. Contact support@floyo.dev for help.",
    category: "general",
  }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

---

## 📊 Analytics & Improvement

### **Track Metrics**
- **Views**: Which FAQs are most viewed?
- **Helpful/Not Helpful**: Which FAQs need improvement?
- **Fallback Rate**: How often does bot fail to match?

### **Improvement Process**
1. **Weekly Review**: Check top FAQs → ensure answers are clear
2. **Monthly Update**: Add new FAQs based on support tickets
3. **Quarterly Audit**: Remove outdated FAQs, update keywords

---

## 🎯 Best Practices

1. **Keep Answers Concise**: 2-3 sentences max
2. **Use Keywords**: Include variations (e.g., "price", "cost", "pricing")
3. **Link to Docs**: Include links to detailed documentation
4. **Update Regularly**: Keep FAQs current with product changes
5. **Test Matches**: Test common questions → verify bot matches correctly

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
