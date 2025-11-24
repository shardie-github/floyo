# Frontend Hosting Strategy

**Last Updated:** 2025-01-XX  
**Status:** Vercel is the canonical hosting platform

---

## Executive Summary

**Canonical Hosting:** Vercel  
**Framework:** Next.js 14+ (App Router)  
**Deployment:** Automated via GitHub Actions (CI-first)  
**Preview:** Per-PR deployments  
**Production:** `main` branch deployments

**Rationale:**
- ✅ Native Next.js support (zero-config)
- ✅ Automatic preview deployments (per-PR)
- ✅ Edge network (global CDN)
- ✅ Serverless functions (API routes)
- ✅ Free tier sufficient for MVP
- ✅ CI-first (no local CLI required)

---

## 1. Hosting Platform: Vercel

### Why Vercel

**Advantages:**
- ✅ **Zero-config Next.js:** Optimized for Next.js out of the box
- ✅ **Preview Deployments:** Automatic per-PR preview URLs
- ✅ **Edge Network:** Global CDN for static assets
- ✅ **Serverless Functions:** Next.js API routes auto-deployed
- ✅ **Analytics:** Built-in web vitals and analytics
- ✅ **Free Tier:** 100GB bandwidth, unlimited requests (sufficient for MVP)

**Limitations:**
- ⚠️ **Vendor Lock-in:** Vercel-specific features (cron, KV)
- ⚠️ **Cost Scaling:** Pro tier ($20/month) for team features
- ⚠️ **Build Time Limits:** 45 minutes on free tier

**Alternatives Considered:**
- **Netlify:** Similar features, but Vercel has better Next.js integration
- **Cloudflare Pages:** Good for static sites, less optimal for Next.js
- **Self-hosted:** Too much ops overhead for MVP

**Decision:** ✅ **Vercel is canonical** - best fit for Next.js app

---

## 2. Deployment Configuration

### Vercel Configuration File

**Location:** `vercel.json` (root)

**Key Settings:**
```json
{
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/.next",
  "framework": "nextjs",
  "installCommand": "cd frontend && npm ci",
  "devCommand": "cd frontend && npm run dev",
  "functions": {
    "api/**/*.js": {
      "runtime": "edge"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ],
  "crons": [
    {
      "path": "/api/privacy/cron/cleanup",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/metrics/collect",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Features:**
- ✅ Security headers (X-Frame-Options)
- ✅ Cache control for static assets
- ✅ Cron jobs for scheduled tasks
- ✅ Edge runtime for API routes

### Environment Variables

**Required in Vercel Dashboard:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side Supabase key (if needed)
- `DATABASE_URL` - Direct PostgreSQL connection (if needed)
- `SENTRY_DSN` - Error tracking (optional)
- `NEXT_PUBLIC_POSTHOG_KEY` - Analytics (optional)

**Environment-Specific:**
- **Production:** Production values
- **Preview:** Preview/test values
- **Development:** Local `.env.local`

**Setup:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables for each environment
3. CI workflow pulls via `vercel pull`

---

## 3. CI-First Deployment Flow

### Primary Workflow: `frontend-deploy.yml`

**Location:** `.github/workflows/frontend-deploy.yml`

**Triggers:**
- Pull requests → Preview deployment
- Push to `main` → Production deployment
- Manual trigger (`workflow_dispatch`)

**Jobs:**

#### 1. Build and Test
- Checkout repository
- Setup Node.js 20
- Install dependencies (`npm ci`)
- Run lint (`npm run lint`)
- Run tests (`npm test`)
- Run typecheck (`npm run typecheck`)
- Build Next.js (`npm run build`)

#### 2. Deploy
- Install Vercel CLI (`npm install -g vercel@latest`)
- Determine environment (preview vs production)
- Pull Vercel config (`vercel pull`)
- Build with Vercel (`vercel build`)
- Deploy (`vercel deploy --prebuilt`)
- Comment PR with preview URL (if PR)

**Concurrency:**
- Group: `frontend-deploy-${{ github.ref }}`
- Prevents overlapping deployments per branch

**Status:** ✅ **Fully implemented and working**

### Preview Deployments

**Per-PR Deployments:**
- Automatic preview URL for each PR
- Commented on PR via `marocchino/sticky-pull-request-comment`
- Preview URL format: `https://<project>-<hash>.vercel.app`

**Benefits:**
- ✅ Test changes before merge
- ✅ Share preview with stakeholders
- ✅ QA testing on real deployment

### Production Deployments

**Main Branch Deployments:**
- Automatic on push to `main`
- Production URL: `https://<project>.vercel.app` (custom domain if configured)
- Zero-downtime deployments (Vercel handles)

**Rollback:**
- Vercel Dashboard → Deployments → Rollback
- Or via Vercel CLI: `vercel rollback`

---

## 4. Build Optimization

### Next.js Build Settings

**Current Configuration:**
- **Framework:** Next.js 14+ (App Router)
- **Output:** Hybrid (static + server-side)
- **Image Optimization:** Next.js Image component
- **Code Splitting:** Automatic (Next.js handles)

**Optimizations:**
- ✅ Static assets cached (via `vercel.json` headers)
- ✅ API routes use edge runtime (faster)
- ✅ Automatic code splitting
- ✅ Image optimization (Next.js Image)

**Bundle Size:**
- CI workflow checks bundle size (non-blocking)
- Warning if exceeds 250KB threshold
- Use dynamic imports for large dependencies

### Build Performance

**Current:**
- Build time: ~2-5 minutes (typical)
- Vercel free tier limit: 45 minutes

**Optimization Tips:**
- Use `npm ci` (faster than `npm install`)
- Cache `node_modules` in CI (already done)
- Minimize dependencies
- Use Next.js Image instead of raw images

---

## 5. Domain & SSL

### Custom Domain (Optional)

**Setup:**
1. Vercel Dashboard → Project → Settings → Domains
2. Add custom domain (e.g., `floyo.app`)
3. Configure DNS records (Vercel provides instructions)
4. SSL certificate auto-provisioned (Let's Encrypt)

**Benefits:**
- ✅ Professional domain name
- ✅ Branded URLs
- ✅ SSL certificate included

**Cost:** Domain registration only (~$10-15/year)

### Default Domain

**Format:** `https://<project-name>.vercel.app`

**Status:** ✅ Works out of the box (no setup needed)

---

## 6. Monitoring & Analytics

### Vercel Analytics

**Built-in Analytics:**
- Web Vitals (LCP, FID, CLS)
- Page views
- Performance metrics

**Setup:**
- Automatic (no config needed)
- View in Vercel Dashboard → Analytics

### External Analytics

**PostHog:**
- Product analytics
- User behavior tracking
- Configured via `NEXT_PUBLIC_POSTHOG_KEY`

**Sentry:**
- Error tracking
- Performance monitoring
- Configured via `SENTRY_DSN`

---

## 7. Cost Analysis

### Vercel Pricing

**Free Tier (Hobby):**
- ✅ 100GB bandwidth/month
- ✅ Unlimited requests
- ✅ Automatic SSL
- ✅ Preview deployments
- ✅ Edge network
- **Cost:** $0/month

**Pro Tier:**
- ✅ Team features
- ✅ More bandwidth (1TB)
- ✅ Advanced analytics
- ✅ Password protection
- **Cost:** $20/month per user

**Enterprise Tier:**
- ✅ Custom SLA
- ✅ Dedicated support
- ✅ Advanced security
- **Cost:** Custom pricing

### Current Usage

**MVP Stage:**
- Free tier sufficient
- No immediate need for Pro tier

**Scaling Considerations:**
- Monitor bandwidth usage
- Upgrade to Pro when hitting limits
- Consider Enterprise for high-traffic apps

---

## 8. CI/CD Best Practices

### Concurrency Control

**Current Implementation:**
```yaml
concurrency:
  group: frontend-deploy-${{ github.ref }}
  cancel-in-progress: true
```

**Benefits:**
- Prevents overlapping deployments
- Cancels outdated builds
- Saves CI minutes

### Environment Variables in CI

**Secrets Management:**
- GitHub Secrets for sensitive values
- Vercel environment variables for hosting
- `.env.example` for documentation

**Mapping:**
- `VERCEL_TOKEN` → GitHub Secret
- `VERCEL_ORG_ID` → GitHub Secret
- `VERCEL_PROJECT_ID` → GitHub Secret
- `NEXT_PUBLIC_*` → Vercel Dashboard + GitHub Secrets

---

## 9. Rollback & Recovery

### Rollback Procedure

**Via Vercel Dashboard:**
1. Go to Deployments
2. Find previous deployment
3. Click "Promote to Production"

**Via Vercel CLI:**
```bash
vercel rollback
```

**Via GitHub:**
- Revert commit and push
- New deployment will be created

### Disaster Recovery

**Backup Strategy:**
- ✅ Git repository (source of truth)
- ✅ Vercel deployments (automatic backups)
- ✅ Database backups (Supabase handles)

**Recovery Steps:**
1. Identify last known good deployment
2. Rollback via Vercel Dashboard
3. Investigate issue
4. Fix and redeploy

---

## 10. Alternative Hosting Options

### If Vercel Doesn't Fit

**Netlify:**
- Similar features to Vercel
- Good Next.js support
- Free tier available
- **Migration:** Similar setup, different CLI

**Cloudflare Pages:**
- Excellent CDN performance
- Free tier generous
- Less optimal for Next.js API routes
- **Migration:** Requires Cloudflare Workers for API routes

**Self-Hosted (Docker/K8s):**
- Full control
- More ops overhead
- Requires infrastructure management
- **Migration:** Significant setup required

**Recommendation:** Stay on Vercel unless specific requirements force migration

---

## 11. Action Items

### Immediate
- [x] Document hosting strategy
- [x] Verify CI workflow is working
- [ ] Set up custom domain (if needed)
- [ ] Configure monitoring alerts

### Short-Term
- [ ] Optimize build performance
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (PostHog)
- [ ] Document rollback procedure

### Long-Term
- [ ] Monitor cost scaling
- [ ] Plan for multi-region (if needed)
- [ ] Consider CDN optimization

---

## 12. References

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/docs/cli)
- [GitHub Actions Workflow](./frontend-deploy.yml)

---

**Last Updated:** 2025-01-XX  
**Status:** ✅ Vercel is Canonical Hosting Platform
