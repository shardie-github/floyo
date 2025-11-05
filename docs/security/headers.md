# Security Headers Guide

## Overview

Security headers protect your application from common attacks like XSS, clickjacking, and MIME-type sniffing. The CRUX+HARDEN upgrade includes comprehensive security headers with configurable CSP policies.

## Headers Included

### X-Frame-Options
**Value:** `DENY`  
**Purpose:** Prevents clickjacking attacks  
**Impact:** Blocks all framing (no iframes)

### X-Content-Type-Options
**Value:** `nosniff`  
**Purpose:** Prevents MIME-type sniffing  
**Impact:** Forces browsers to respect declared content types

### Referrer-Policy
**Value:** `strict-origin-when-cross-origin`  
**Purpose:** Controls referrer information  
**Impact:** Limits referrer data sent to external sites

### Content-Security-Policy (CSP)
**Value:** Configurable  
**Purpose:** Prevents XSS and injection attacks  
**Impact:** Controls which resources can be loaded

## CSP Configuration

### Basic Setup

CSP is disabled by default to prevent breaking third-party embeds. Enable it:

```typescript
// In your environment or flags
process.env.NEXT_PUBLIC_CSP_ENABLED = 'true'
```

### Customizing CSP

Configure allowlist via environment variable:

```bash
NEXT_PUBLIC_CSP_ALLOWLIST='{
  "scripts": ["https://cdn.example.com"],
  "styles": ["https://fonts.googleapis.com"],
  "images": ["https://cdn.example.com"],
  "connects": ["https://api.example.com"]
}'
```

### Nonce-Based CSP

When CSP is enabled, nonces are generated automatically:

```typescript
// In your component
import { headers } from 'next/headers';

export async function Component() {
  const headersList = await headers();
  const nonce = headersList.get('X-CSP-Nonce');
  
  return (
    <script nonce={nonce}>
      // Your inline script
    </script>
  );
}
```

## Testing CSP

### Enable CSP in Development

```bash
NEXT_PUBLIC_CSP_ENABLED=true npm run dev
```

### Check CSP Violations

1. Open browser DevTools
2. Go to Console tab
3. Look for CSP violation reports
4. Adjust allowlist as needed

### Common CSP Violations

| Violation | Solution |
|-----------|----------|
| Inline scripts blocked | Use nonces or move to external files |
| External styles blocked | Add to `styles` allowlist |
| API calls blocked | Add domain to `connects` allowlist |
| Images blocked | Add domain to `images` allowlist |

## CSP Directives

### Default Directives

- `default-src 'self'` - Only same-origin by default
- `script-src 'self' 'nonce-{nonce}'` - Scripts with nonce
- `style-src 'self' 'unsafe-inline'` - Styles (inline allowed)
- `img-src 'self' data: blob: https:` - Images from anywhere
- `connect-src 'self' https:` - API calls to HTTPS
- `object-src 'none'` - No plugins
- `frame-ancestors 'none'` - Cannot be embedded

### Customizing Directives

Modify `frontend/app/headers.ts` to customize CSP:

```typescript
const directives = [
  `default-src 'self'`,
  `script-src 'self' 'nonce-${nonce}' https://cdn.example.com`,
  // Add more directives
];
```

## Third-Party Embeds

### Allowing Embeds

Common services and their CSP requirements:

#### YouTube
```json
{
  "frames": ["https://www.youtube.com"],
  "connects": ["https://www.youtube.com"]
}
```

#### Google Maps
```json
{
  "frames": ["https://maps.google.com"],
  "connects": ["https://maps.googleapis.com"]
}
```

#### Stripe
```json
{
  "connects": ["https://api.stripe.com"],
  "frames": ["https://js.stripe.com"]
}
```

### Testing Embeds

1. Enable CSP
2. Test each embed
3. Check console for violations
4. Add required domains to allowlist
5. Re-test

## Troubleshooting

### CSP Breaks UI

1. **Check console**: Look for CSP violation reports
2. **Disable CSP temporarily**: Set `NEXT_PUBLIC_CSP_ENABLED=false`
3. **Add domains**: Add offending domains to allowlist
4. **Use nonces**: For inline scripts/styles

### Headers Not Applied

1. Check `frontend/app/headers.ts` exists
2. Verify Next.js 14+ app router
3. Check middleware isn't overriding headers
4. Verify headers export function

### Nonce Not Working

1. Ensure CSP is enabled
2. Check nonce is retrieved from headers
3. Verify nonce matches CSP header
4. Check for nonce regeneration issues

## Best Practices

1. **Start with minimal CSP**: Enable gradually
2. **Test thoroughly**: Check all pages and features
3. **Monitor violations**: Set up CSP reporting
4. **Use nonces**: Prefer nonces over `unsafe-inline`
5. **Document allowlist**: Keep track of why domains are allowed

## CSP Reporting

### Set Up Reporting Endpoint

```typescript
// app/api/csp-report/route.ts
export async function POST(req: Request) {
  const report = await req.json();
  console.log('CSP Violation:', report);
  // Log to monitoring service
  return new Response('OK');
}
```

### Configure Reporting

Add to CSP header:
```typescript
`report-uri /api/csp-report`
```

## Feature Flag

Control CSP via feature flag:

```json
{
  "csp_headers": false  // Set to true to enable
}
```

## Migration Checklist

- [ ] Enable CSP in development
- [ ] Test all pages
- [ ] Document all third-party embeds
- [ ] Add domains to allowlist
- [ ] Test in staging
- [ ] Enable in production
- [ ] Monitor for violations
