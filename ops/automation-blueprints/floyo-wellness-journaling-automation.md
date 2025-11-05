# Wellness Journaling Automation — floyo (CAD)

**Purpose**: Automated workflows for wellness journaling patterns detected by floyo

**Context**: floyo detects file usage patterns. When users create/edit journal files (e.g., `.md`, `.txt`, `.docx` files with keywords like "journal", "wellness", "mood", "reflection"), floyo can suggest wellness journaling automation workflows.

---

## 🎯 Detected Patterns

### **Pattern 1: Daily Journal Entry**

**Detection**: User creates/edits a file with pattern:
- Filename: `journal-YYYY-MM-DD.md` or `wellness-YYYY-MM-DD.txt`
- Frequency: Daily (same time each day)
- Location: `~/Documents/Journal/` or similar

**Suggested Automation**:
```
Workflow: Auto-create daily journal template
Trigger: Daily at [detected time]
Action: Create file `journal-{today}.md` with template:
  - Date: {{today}}
  - Mood: [dropdown]
  - Energy Level: [1-10]
  - Gratitude: [3 items]
  - Goals: [list]
  - Reflection: [free text]
```

**Zapier/Make Setup**:
```json
{
  "name": "Daily Journal Template",
  "trigger": {
    "type": "schedule",
    "time": "{{detected_time}}",
    "timezone": "America/Toronto"
  },
  "actions": [
    {
      "action": "create_file",
      "path": "~/Documents/Journal/journal-{{date}}.md",
      "template": "journal_template.md"
    },
    {
      "action": "send_notification",
      "message": "Your daily journal template is ready! 📝"
    }
  ]
}
```

---

### **Pattern 2: Weekly Reflection Summary**

**Detection**: User creates weekly summary files:
- Filename: `weekly-reflection-YYYY-MM-DD.md`
- Frequency: Weekly (same day each week)
- Content: Aggregates daily entries

**Suggested Automation**:
```
Workflow: Auto-generate weekly reflection summary
Trigger: Weekly on [detected day] at [detected time]
Action: 
  1. Read all daily journal files from past week
  2. Extract key themes (mood trends, gratitude patterns, goal progress)
  3. Generate summary file `weekly-reflection-{{date}}.md`
  4. Include charts/graphs if applicable
```

**Implementation**:
```python
# scripts/wellness/weekly_reflection.py
import os
from pathlib import Path
from datetime import datetime, timedelta

def generate_weekly_reflection(journal_dir: str):
    """Generate weekly reflection from daily journal entries."""
    journal_path = Path(journal_dir)
    today = datetime.now()
    week_start = today - timedelta(days=7)
    
    entries = []
    for file in journal_path.glob("journal-*.md"):
        file_date = datetime.fromisoformat(file.stem.split("-")[1])
        if week_start <= file_date <= today:
            entries.append(read_journal_entry(file))
    
    summary = analyze_entries(entries)
    write_weekly_reflection(summary, week_start)
```

---

### **Pattern 3: Mood Tracking**

**Detection**: User tracks mood in journal entries:
- Keywords: "mood", "feeling", "emotion"
- Pattern: Regular entries with mood indicators

**Suggested Automation**:
```
Workflow: Mood tracking visualization
Trigger: Weekly on [detected day]
Action:
  1. Extract mood data from journal entries
  2. Generate mood chart (line graph)
  3. Save to `mood-tracker-{{date}}.png`
  4. Update mood dashboard (if using app)
```

**Zapier/Make Setup**:
```json
{
  "name": "Mood Tracking Visualization",
  "trigger": {
    "type": "schedule",
    "frequency": "weekly",
    "day": "{{detected_day}}"
  },
  "actions": [
    {
      "action": "read_files",
      "pattern": "journal-*.md",
      "date_range": "last_7_days"
    },
    {
      "action": "extract_mood",
      "pattern": "Mood: (.*)"
    },
    {
      "action": "generate_chart",
      "type": "line",
      "data": "{{extracted_moods}}",
      "output": "mood-tracker-{{date}}.png"
    }
  ]
}
```

---

### **Pattern 4: Gratitude Journaling**

**Detection**: User maintains gratitude lists:
- Keywords: "gratitude", "grateful", "thankful"
- Pattern: Regular entries with gratitude items

**Suggested Automation**:
```
Workflow: Gratitude compilation
Trigger: Monthly on [detected day]
Action:
  1. Extract all gratitude items from journal entries
  2. Compile into monthly gratitude list
  3. Generate file `gratitude-{{month}}-{{year}}.md`
  4. Include statistics (total items, themes)
```

---

### **Pattern 5: Goal Tracking**

**Detection**: User tracks goals in journal:
- Keywords: "goal", "objective", "target"
- Pattern: Regular goal updates/check-ins

**Suggested Automation**:
```
Workflow: Goal progress tracking
Trigger: Weekly on [detected day]
Action:
  1. Extract goals from journal entries
  2. Track progress (completed, in-progress, not started)
  3. Generate progress report `goals-progress-{{date}}.md`
  4. Send reminder for incomplete goals
```

---

## 🤖 Automation Implementations

### **Zapier Flow: Daily Journal Reminder**

**Zap 1: Daily Journal Reminder**
```
Trigger: Schedule (Daily at 9 PM ET)
Action 1: Create file (via Google Drive/Dropbox integration)
  - Template: journal_template.md
  - Filename: journal-{{date}}.md
Action 2: Send notification (via email/Slack)
  - Message: "Your daily journal template is ready! 📝"
```

---

### **Make.com Scenario: Weekly Reflection**

**Scenario 1: Weekly Reflection Generator**
```
Module 1: Schedule (Weekly on Sunday at 8 PM ET)
Module 2: Read files (journal-*.md from last 7 days)
Module 3: Extract data (mood, gratitude, goals)
Module 4: Generate summary (Markdown file)
Module 5: Save file (weekly-reflection-{{date}}.md)
Module 6: Send notification (Email/Slack)
```

---

### **Supabase Edge Function: Journal Analytics**

```typescript
// supabase/functions/journal-analytics/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { userId, journalEntries } = await req.json()
  
  // Analyze journal entries
  const analytics = {
    moodTrend: calculateMoodTrend(journalEntries),
    gratitudeThemes: extractGratitudeThemes(journalEntries),
    goalProgress: trackGoalProgress(journalEntries),
    weeklySummary: generateWeeklySummary(journalEntries),
  }
  
  // Store in Supabase
  const { data, error } = await supabase
    .from('wellness_analytics')
    .insert({
      user_id: userId,
      analytics: analytics,
      created_at: new Date().toISOString(),
    })
  
  return new Response(JSON.stringify({ analytics }), {
    headers: { "Content-Type": "application/json" },
  })
})
```

---

## 📊 Wellness Dashboard Integration

### **floyo Wellness Dashboard**

**Metrics to Track:**
- Daily journal entries (completion rate)
- Mood trends (7-day, 30-day)
- Gratitude themes (most common)
- Goal completion rate
- Weekly reflection consistency

**Dashboard Location**: `/ops/dashboards/wellness-dashboard-template.csv`

---

## 🔗 Integration Examples

### **Integration 1: Journal → Notion**

**Use Case**: Sync journal entries to Notion wellness database

**Zapier Setup**:
```
Trigger: New file created (journal-*.md)
Action: Create Notion page
  - Database: Wellness Journal
  - Properties:
    - Date: {{date}}
    - Mood: {{extracted_mood}}
    - Gratitude: {{extracted_gratitude}}
    - Goals: {{extracted_goals}}
    - Content: {{file_content}}
```

---

### **Integration 2: Journal → Google Sheets**

**Use Case**: Track mood/gratitude in spreadsheet

**Zapier Setup**:
```
Trigger: New file created (journal-*.md)
Action: Add Google Sheets row
  - Spreadsheet: Wellness Tracker
  - Worksheet: Daily Entries
  - Values:
    - Date: {{date}}
    - Mood: {{extracted_mood}}
    - Energy: {{extracted_energy}}
    - Gratitude Count: {{gratitude_count}}
```

---

### **Integration 3: Journal → Email Reminder**

**Use Case**: Send weekly wellness summary via email

**Zapier Setup**:
```
Trigger: Schedule (Weekly on Sunday)
Action: Generate summary from journal entries
Action: Send email
  - To: {{user_email}}
  - Subject: Your Weekly Wellness Summary
  - Body: {{weekly_summary}}
  - Attachments: {{mood_chart}}
```

---

## 📝 Template Files

### **Daily Journal Template**

```markdown
# Journal Entry — {{date}}

## Mood
- Current Mood: [dropdown: Happy, Neutral, Sad, Anxious, Excited]
- Energy Level: [1-10 slider]

## Gratitude
1. 
2. 
3. 

## Goals for Today
- [ ] 
- [ ] 
- [ ] 

## Reflection
[Free text area]

## Tomorrow's Focus
[Free text]
```

---

### **Weekly Reflection Template**

```markdown
# Weekly Reflection — Week of {{week_start}}

## Mood Trends
- Average Mood: {{avg_mood}}
- Mood Range: {{mood_range}}
- Trend: {{mood_trend}} (↑/↓/→)

## Gratitude Highlights
{{gratitude_summary}}

## Goal Progress
{{goal_progress_summary}}

## Insights
{{weekly_insights}}

## Next Week's Focus
{{next_week_focus}}
```

---

## 🎯 Best Practices

1. **Privacy First**: All journal data stays local (floyo's core principle)
2. **User Consent**: Always ask before enabling automation
3. **Flexible Templates**: Allow users to customize templates
4. **Export Options**: Support export to various formats (PDF, CSV, JSON)
5. **Backup**: Regular backups of journal data

---

## 📊 Analytics & Insights

**Track Metrics:**
- Journal entry consistency
- Mood trends over time
- Gratitude themes
- Goal completion rates
- Reflection frequency

**Generate Reports:**
- Weekly wellness summary
- Monthly reflection report
- Annual wellness review

---

**Last Updated**: 2025-01-XX  
**Next Review**: Monthly
