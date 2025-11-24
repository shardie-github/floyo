# NPS (Net Promoter Score) Tools & Strategies

**Purpose:** Achieve and maintain high NPS score (>70)

## 📊 NPS Overview

### What is NPS?

**Net Promoter Score (NPS)** measures customer loyalty and satisfaction.

**Calculation:**
- Promoters (9-10): Loyal customers who recommend
- Passives (7-8): Satisfied but not enthusiastic
- Detractors (0-6): Unhappy customers

**Formula:** `NPS = % Promoters - % Detractors`

**Target:** >70 (World-class)

---

## 🎯 NPS Survey Implementation

### Survey Component

**File:** `frontend/components/NPSSurvey.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export function NPSSurvey() {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showSurvey, setShowSurvey] = useState(false);

  // Show survey after user has been active for 7 days
  useEffect(() => {
    const lastSurveyDate = localStorage.getItem('lastNPSSurvey');
    const daysSinceLastSurvey = lastSurveyDate 
      ? (Date.now() - parseInt(lastSurveyDate)) / (1000 * 60 * 60 * 24)
      : Infinity;

    if (daysSinceLastSurvey > 90) { // Show every 90 days
      setShowSurvey(true);
    }
  }, []);

  const handleSubmit = async () => {
    await fetch('/api/nps/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score, feedback }),
    });

    localStorage.setItem('lastNPSSurvey', Date.now().toString());
    setShowSurvey(false);
  };

  return (
    <Dialog open={showSurvey} onOpenChange={setShowSurvey}>
      <DialogContent>
        <h2>How likely are you to recommend Floyo?</h2>
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              onClick={() => setScore(n)}
              className={`w-12 h-12 rounded ${
                score === n ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {score !== null && (
          <>
            <textarea
              placeholder="What's the main reason for your score?"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button onClick={handleSubmit}>Submit</button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### NPS API

**File:** `backend/api/nps.py`

```python
"""
NPS Survey API
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth.utils import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/nps", tags=["nps"])

class NPSSubmission(BaseModel):
    score: int  # 0-10
    feedback: str | None = None

@router.post("/submit")
async def submit_nps(
    submission: NPSSubmission,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Submit NPS survey response."""
    
    # Validate score
    if not 0 <= submission.score <= 10:
        raise ValueError("Score must be between 0 and 10")
    
    # Determine category
    if submission.score >= 9:
        category = "promoter"
    elif submission.score >= 7:
        category = "passive"
    else:
        category = "detractor"
    
    # Store submission
    nps_entry = NPSSubmission(
        user_id=current_user.id,
        score=submission.score,
        feedback=submission.feedback,
        category=category,
        submitted_at=datetime.now(),
    )
    db.add(nps_entry)
    db.commit()
    
    # Trigger follow-up if detractor
    if category == "detractor":
        trigger_detractor_followup(current_user.id, submission.feedback)
    
    return {"message": "Thank you for your feedback!"}

@router.get("/score")
async def get_nps_score(db: Session = Depends(get_db)):
    """Get current NPS score."""
    
    # Get recent submissions (last 30 days)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    submissions = db.query(NPSSubmission).filter(
        NPSSubmission.submitted_at >= thirty_days_ago
    ).all()
    
    if not submissions:
        return {"score": None, "count": 0}
    
    promoters = sum(1 for s in submissions if s.score >= 9)
    detractors = sum(1 for s in submissions if s.score <= 6)
    total = len(submissions)
    
    nps_score = ((promoters - detractors) / total) * 100 if total > 0 else 0
    
    return {
        "score": round(nps_score, 1),
        "count": total,
        "promoters": promoters,
        "passives": len(submissions) - promoters - detractors,
        "detractors": detractors,
    }
```

---

## 📈 NPS Tracking Dashboard

**File:** `frontend/app/admin/nps/page.tsx`

```typescript
export default function NPSDashboard() {
  const { data: nps } = useQuery({
    queryKey: ['nps'],
    queryFn: async () => {
      const res = await fetch('/api/admin/nps');
      return res.json();
    },
  });

  return (
    <div>
      <h1>NPS Dashboard</h1>
      
      {/* Current NPS Score */}
      <div className="text-4xl font-bold">
        {nps?.score || 'N/A'}
      </div>
      <div className="text-sm text-gray-500">
        {nps?.count || 0} responses
      </div>
      
      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-green-600">Promoters</div>
          <div className="text-2xl">{nps?.promoters || 0}</div>
        </div>
        <div>
          <div className="text-yellow-600">Passives</div>
          <div className="text-2xl">{nps?.passives || 0}</div>
        </div>
        <div>
          <div className="text-red-600">Detractors</div>
          <div className="text-2xl">{nps?.detractors || 0}</div>
        </div>
      </div>
      
      {/* Trend Chart */}
      <NPSChart data={nps?.trend} />
      
      {/* Feedback Analysis */}
      <FeedbackAnalysis feedback={nps?.recentFeedback} />
    </div>
  );
}
```

---

## 🎯 NPS Improvement Strategies

### Strategy 1: Reduce Detractors

**Identify Common Issues:**
- Analyze detractor feedback
- Identify patterns
- Prioritize fixes

**Action Plan:**
1. Address top 3 issues
2. Follow up with detractors
3. Offer solutions
4. Re-survey after fixes

### Strategy 2: Convert Passives to Promoters

**Engagement Tactics:**
- Showcase advanced features
- Provide personalized tips
- Offer exclusive content
- Request testimonials

**Action Plan:**
1. Identify passive users
2. Send targeted emails
3. Offer feature demos
4. Request feedback

### Strategy 3: Retain Promoters

**Retention Tactics:**
- Thank promoters
- Request testimonials
- Offer referral rewards
- Feature in case studies

**Action Plan:**
1. Thank you email
2. Referral program invite
3. Testimonial request
4. Exclusive updates

---

## 📧 Follow-Up Automation

### Detractor Follow-Up

**Email Template:**

```
Subject: We'd love to make Floyo better for you

Hi [Name],

Thank you for your feedback. We noticed you gave us a [score] rating, and we'd 
love to understand how we can improve.

We've identified [issue] as a concern. Here's what we're doing about it:

[Solution]

Would you be open to a quick 10-minute call to discuss how we can make Floyo 
better for you?

[CTA: Schedule Call]
```

### Promoter Follow-Up

**Email Template:**

```
Subject: Thank you for being a Floyo promoter! 🎉

Hi [Name],

Thank you for your [score] rating! We're thrilled that Floyo is working well 
for you.

As a thank you, we'd love to:
- Feature your story in our case studies
- Offer you early access to new features
- Give you a referral reward

[CTA: Learn More]
```

---

## 📊 NPS Analysis Tools

### Feedback Analysis

**File:** `tools/nps-analyzer.ts`

```typescript
/**
 * NPS Feedback Analyzer
 * Analyzes feedback to identify improvement opportunities
 */

export function analyzeFeedback(feedback: string[]): {
  themes: { theme: string; count: number; sentiment: 'positive' | 'negative' }[];
  topIssues: string[];
  topPraise: string[];
} {
  // Simple keyword analysis (can be enhanced with NLP)
  const themes = {
    'performance': 0,
    'features': 0,
    'pricing': 0,
    'support': 0,
    'usability': 0,
  };
  
  const issues: string[] = [];
  const praise: string[] = [];
  
  feedback.forEach(f => {
    const lower = f.toLowerCase();
    
    // Theme detection
    if (lower.includes('slow') || lower.includes('fast')) themes.performance++;
    if (lower.includes('feature') || lower.includes('functionality')) themes.features++;
    if (lower.includes('price') || lower.includes('cost')) themes.pricing++;
    if (lower.includes('support') || lower.includes('help')) themes.support++;
    if (lower.includes('easy') || lower.includes('hard')) themes.usability++;
    
    // Sentiment detection (simple)
    if (lower.includes('love') || lower.includes('great') || lower.includes('awesome')) {
      praise.push(f);
    }
    if (lower.includes('hate') || lower.includes('terrible') || lower.includes('awful')) {
      issues.push(f);
    }
  });
  
  return {
    themes: Object.entries(themes)
      .map(([theme, count]) => ({
        theme,
        count,
        sentiment: count > 0 ? 'positive' : 'negative',
      }))
      .sort((a, b) => b.count - a.count),
    topIssues: issues.slice(0, 5),
    topPraise: praise.slice(0, 5),
  };
}
```

---

## 🎁 Promoter Rewards Program

### Referral Program

**Structure:**
- Promoter refers friend
- Both get 1 month free Pro
- Promoter gets additional reward after 3 referrals

**Implementation:**

```typescript
// Referral tracking
interface ReferralReward {
  referrerId: string;
  refereeId: string;
  reward: 'pro_month_free';
  status: 'pending' | 'completed';
  createdAt: Date;
}

export async function processReferral(
  referrerId: string,
  refereeId: string
): Promise<void> {
  // Create rewards for both
  await createReward(referrerId, 'pro_month_free');
  await createReward(refereeId, 'pro_month_free');
  
  // Track referral
  await trackReferral(referrerId, refereeId);
  
  // Check for milestone rewards
  const referralCount = await getReferralCount(referrerId);
  if (referralCount === 3) {
    await createReward(referrerId, 'pro_year_free');
  }
}
```

---

## 📈 NPS Goals & Targets

### Current State

**Baseline:** Establish baseline NPS score

**Target:** >70 NPS (World-class)

### Improvement Plan

**Month 1:**
- Target: 50+ NPS
- Focus: Reduce detractors
- Actions: Fix top 3 issues

**Month 2:**
- Target: 60+ NPS
- Focus: Convert passives
- Actions: Engagement campaigns

**Month 3:**
- Target: 70+ NPS
- Focus: Retain promoters
- Actions: Referral program

---

## ✅ NPS Checklist

### Implementation

- [ ] NPS survey component created
- [ ] NPS API endpoints implemented
- [ ] NPS dashboard created
- [ ] Follow-up automation configured
- [ ] Feedback analysis tool created
- [ ] Referral program implemented

### Monitoring

- [ ] NPS score tracked daily
- [ ] Feedback analyzed weekly
- [ ] Detractor follow-ups automated
- [ ] Promoter rewards automated
- [ ] Monthly NPS report generated

---

**Last Updated:** 2025-01-XX  
**Maintained By:** Unified Background Agent
