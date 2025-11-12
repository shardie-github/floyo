> Archived on 2025-11-12. Superseded by: (see docs/final index)

# CRM Integration Guide — floyo (CAD)

**Purpose**: Step-by-step guide for integrating floyo with popular CRM platforms (Notion, Airtable, Google Sheets)

---

## 🎯 Supported CRM Platforms

1. **Notion** (Recommended for solo operators)
2. **Airtable** (Good for small teams)
3. **Google Sheets** (Free, simple)

---

## 📋 Option 1: Notion Integration

### **Setup**

1. **Create Notion Integration**
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name: "floyo CRM"
   - Copy "Internal Integration Token"

2. **Create Database**
   - Create new page → "Leads Database"
   - Add properties:
     - Email (Email)
     - Name (Text)
     - Source (Select: Website, Product Hunt, LinkedIn, Twitter, Other)
     - Status (Select: New, Contacted, Qualified, Converted, Lost)
     - UTM Source (Text)
     - UTM Campaign (Text)
     - Created (Date)
     - Last Contacted (Date)
     - Conversion Date (Date)
     - Plan (Select: Free, Pro, Enterprise)
     - Notes (Text)

3. **Share Database with Integration**
   - Click "Share" → "Add people" → Select "floyo CRM" integration

4. **Zapier/Make Setup**
   - **Trigger**: Webhook (Supabase form submission)
   - **Action**: Create Notion Page
     - Database: Select "Leads Database"
     - Properties: Map fields from webhook

### **Automation Rules**

**Rule 1: New Lead → Create Notion Page**
```
Trigger: Supabase webhook (form_submissions.insert)
Action: Create Notion page
  - Email: {{email}}
  - Name: {{name}}
  - Source: {{source}}
  - Status: "New"
  - Created: {{created_at}}
```

**Rule 2: Conversion → Update Notion Page**
```
Trigger: Stripe webhook (payment.succeeded)
Action: Update Notion page
  - Find by: Email = {{customer_email}}
  - Status: "Converted"
  - Conversion Date: {{created_at}}
  - Plan: {{plan_name}}
```

---

## 📊 Option 2: Airtable Integration

### **Setup**

1. **Create Airtable Base**
   - Base name: "floyo CRM"
   - Table name: "Leads"

2. **Create Fields**
   | Field Name | Type | Options |
   |------------|------|---------|
   | Email | Email | |
   | Name | Single line text | |
   | Source | Single select | Website, Product Hunt, LinkedIn, Twitter, Other |
   | Status | Single select | New, Contacted, Qualified, Converted, Lost |
   | UTM Source | Single line text | |
   | UTM Campaign | Single line text | |
   | Created | Date | |
   | Last Contacted | Date | |
   | Conversion Date | Date | |
   | Plan | Single select | Free, Pro, Enterprise |
   | Notes | Long text | |

3. **Get API Key**
   - Go to https://airtable.com/api
   - Copy "Personal Access Token"

4. **Zapier/Make Setup**
   - **Trigger**: Webhook (Supabase form submission)
   - **Action**: Create Airtable Record
     - Base: "floyo CRM"
     - Table: "Leads"
     - Fields: Map from webhook

### **Automation Rules**

Same as Notion (see above).

---

## 📝 Option 3: Google Sheets Integration

### **Setup**

1. **Create Google Sheet**
   - Name: "floyo CRM - Leads"
   - Columns:
     | A | B | C | D | E | F | G | H | I | J |
     |---|---|---|---|---|---|---|---|---|---|
     | Email | Name | Source | Status | UTM Source | UTM Campaign | Created | Last Contacted | Conversion Date | Plan |

2. **Install Zapier Google Sheets Add-on** (if using Zapier)

3. **Zapier/Make Setup**
   - **Trigger**: Webhook (Supabase form submission)
   - **Action**: Add Google Sheets Row
     - Spreadsheet: "floyo CRM - Leads"
     - Worksheet: "Leads"
     - Values: Map from webhook

### **Automation Rules**

Same as Notion (see above).

---

## 🔄 Sync Patterns

### **Pattern 1: One-Way Sync (Supabase → CRM)**

**Use Case**: Lead capture only

```
Supabase Form Submission → Webhook → CRM Create
```

**Pros:**
- Simple
- No conflicts
- Fast

**Cons:**
- Updates must be manual in CRM
- No bi-directional sync

### **Pattern 2: Bi-Directional Sync**

**Use Case**: Support team updates CRM, syncs back to Supabase

```
Supabase → CRM (Create)
CRM Update → Supabase Update (via webhook)
```

**Setup:**
1. Zapier/Make: CRM Update → Webhook → Supabase Update
2. Map CRM fields to Supabase `form_submissions` table

---

## 📊 Reporting Views

### **Notion Views**

**View 1: New Leads**
- Filter: Status = "New"
- Sort: Created (Newest first)

**View 2: This Week**
- Filter: Created >= Last 7 days
- Sort: Created (Newest first)

**View 3: High Priority**
- Filter: Source = "Product Hunt" OR UTM Campaign contains "paid"
- Sort: Created (Newest first)

**View 4: Converted**
- Filter: Status = "Converted"
- Sort: Conversion Date (Newest first)

### **Airtable Views**

Same structure as Notion views.

### **Google Sheets Views**

Create separate sheets:
- "New Leads" (Filter: Status = "New")
- "This Week" (Filter: Created >= Last 7 days)
- "Converted" (Filter: Status = "Converted")

---

## 🔧 Troubleshooting

### **Duplicate Records**
- **Cause**: Webhook fires multiple times
- **Fix**: Add deduplication logic in Zapier/Make (check if email exists before creating)

### **Missing Fields**
- **Cause**: Field mapping incorrect
- **Fix**: Review Zapier/Make field mappings → ensure all required fields are mapped

### **Sync Delays**
- **Cause**: API rate limits
- **Fix**: Add delays between actions, use batch processing

---

## 📝 Maintenance

**Weekly:**
- Review CRM for duplicate records
- Clean up stale leads (>30 days, status = "New")
- Update conversion statuses

**Monthly:**
- Archive old leads (>90 days)
- Review CRM structure → optimize fields
- Update automation rules based on performance

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
