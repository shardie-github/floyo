# Admin Dashboard Access Control

## Overview
The `/admin/*` routes are protected and should only be accessible to authorized personnel.

## Vercel Access Controls (Recommended)

### Setup
1. Go to Vercel Dashboard → Your Project → Settings → Access Controls
2. Enable Access Controls for `/admin/*` paths
3. Configure allowed IPs, email domains, or SSO
4. Save configuration

### Benefits
- No code changes needed
- Integrated with Vercel's security
- Supports SSO and team management
- IP allowlisting available

## Basic Auth (Alternative)

If not using Vercel or need additional protection:

### Setup
1. Set environment variable `ADMIN_BASIC_AUTH` in Vercel dashboard
2. Format: `username:password` (plain text, will be base64 encoded)
3. Example: `admin:secure-password-123`

### Usage
When accessing `/admin/*` routes, browser will prompt for credentials.

### Security Notes
- Basic Auth is transmitted over HTTPS (secure)
- Consider rotating password regularly
- Use strong passwords
- Prefer Vercel Access Controls for production

## Development
In development mode, if `ADMIN_BASIC_AUTH` is not set, access is allowed (for local development).

## Related Files
- Admin Layout: `frontend/app/admin/layout.tsx`
- Admin Dashboard: `admin/metrics.jsx`
- Ops Config: `ops.config.json`

---
*Last updated: {{DATE}}*
