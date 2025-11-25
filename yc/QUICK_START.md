# YC Readiness Quick Start

**One command to rule them all:**

```bash
npm run yc:setup-complete
```

This runs all automation and prepares everything for YC!

---

## What Gets Done Automatically

1. ✅ Fetches real metrics from database
2. ✅ Generates team template from git history
3. ✅ Calculates financial model
4. ✅ Tests all features
5. ✅ Provides summary and next actions

---

## Manual Steps (After Automation)

1. **Fill in team info** (15 min)
   - Edit `/yc/YC_TEAM_NOTES.md`
   - Add founder backgrounds

2. **Update financials** (10 min)
   - Edit `/yc/FINANCIAL_MODEL.md`
   - Add real cash/burn numbers

3. **Test features** (15 min)
   - Visit `/admin/metrics`
   - Visit `/invite`
   - Test referral flow

4. **Deploy** (30 min)
   - Run referral migration: `npm run yc:deploy-referral`
   - Deploy to production
   - Test end-to-end

---

## That's It!

After running `npm run yc:setup-complete` and filling in real data, you're YC-ready! 🚀
