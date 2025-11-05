# Zero-Manual CI/CD — Hardonia

## What you do once
Add GitHub Secrets (Repo → Settings → Secrets → Actions):
- SUPABASE_ACCESS_TOKEN
- SUPABASE_PROJECT_REF (e.g., ghqyxhbyyirveptgwoqm)
- SUPABASE_DB_PASSWORD (db password for prod)
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- VERCEL_PROJECT_DOMAIN (prod domain, e.g., hardonia.vercel.app)

Optional:
- SENTRY_DSN, etc.

## What happens automatically
- **PR**: Build + Lighthouse (mobile) + Pa11y (axe) + Vercel Preview URL
- **main**: Supabase migrations applied (prod) → Vercel Production deploy

## Commands behind the scenes
- Supabase: `supabase login/link`, `supabase db push`
- Vercel: `vercel pull`, `vercel build`, `vercel deploy`

## Notes
- DB migrations are sourced from `supabase/migrations/*.sql`.
- Keep client envs in `.env.ci.example`; secrets live in GitHub only.
