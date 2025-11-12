> Archived on 2025-11-12. Superseded by: (see docs/final index)

# Vercel Environment Variables Matrix

**Generated:** $(date)
**Project:** floyo-monorepo
**Root Directory:** frontend

## Environment Variable Naming Conventions

### Browser-Safe (Public) Variables
Must be prefixed with `NEXT_PUBLIC_` or `VITE_` (for Vite projects).

### Server-Only Variables
Never exposed to the browser. Must NOT have `NEXT_PUBLIC_` prefix.

---

## Required Environment Variables

### Production
| Variable Name | Type | Required | Present | Notes |
|--------------|------|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | Public | ✅ | ⚠️ Check | API endpoint URL |
| `ADMIN_BASIC_AUTH` | Server | ⚠️ Optional | ⚠️ Check | Format: `username:password` (for admin protection) |
| `VERCEL_ENV` | System | ✅ | ✅ Auto | Set by Vercel (production/preview/development) |
| `NEXT_PUBLIC_APP_VERSION` | Public | ⚠️ Optional | ⚠️ Check | App version string |

### Preview/Development
| Variable Name | Type | Required | Present | Notes |
|--------------|------|----------|---------|-------|
| `PREVIEW_BANNER` | Public | ⚠️ Optional | ⚠️ Check | Set to `true` to show preview banner |
| `ADMIN_BASIC_AUTH` | Server | ⚠️ Optional | ⚠️ Check | Required if `previewRequireAuth: true` |

---

## Security Checklist

- [ ] No secrets in `NEXT_PUBLIC_*` variables
- [ ] `ADMIN_BASIC_AUTH` stored as Vercel secret (not in code)
- [ ] All API keys are server-only
- [ ] Database URLs are server-only
- [ ] Third-party service tokens are server-only

---

## Verification Commands

```bash
# Pull environment variables (do not commit)
cd frontend && vercel env pull .env.vercel.local

# List all environment variables
vercel env ls

# Check for public variables that might contain secrets
grep -r "NEXT_PUBLIC_" .env.vercel.local | grep -i "secret\|key\|token\|password"
```

---

## Notes

- This matrix should be updated when new environment variables are added
- Run `vercel env pull` to sync local `.env.vercel.local` (gitignored)
- Never commit `.env.vercel.local` or actual secret values
