// [CRUX+HARDEN:BEGIN:csp]
import type { Headers } from "next/dist/server/web/spec-extension/adapters/headers";
import { randomBytes } from 'crypto';

interface CSPConfig {
  enabled: boolean;
  nonce?: string;
  allowlist?: {
    scripts?: string[];
    styles?: string[];
    images?: string[];
    fonts?: string[];
    connects?: string[];
    frames?: string[];
  };
}

function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

function buildCSP(config: CSPConfig): string {
  if (!config.enabled) {
    return "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;";
  }

  const nonce = config.nonce || generateNonce();
  const allowlist = config.allowlist || {};

  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' ${allowlist.scripts?.join(' ') || ''}`,
    `style-src 'self' 'unsafe-inline' ${allowlist.styles?.join(' ') || ''}`,
    `img-src 'self' data: blob: https: ${allowlist.images?.join(' ') || ''}`,
    `font-src 'self' data: ${allowlist.fonts?.join(' ') || ''}`,
    `connect-src 'self' https: ${allowlist.connects?.join(' ') || ''}`,
    `frame-src 'self' ${allowlist.frames?.join(' ') || ''}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ];

  return directives.filter(Boolean).join('; ');
}

export function headers(): Headers {
  const h = new Headers();
  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Load CSP config from flags or env
  const cspEnabled = process.env.NEXT_PUBLIC_CSP_ENABLED === 'true' || false;
  const cspAllowlist = process.env.NEXT_PUBLIC_CSP_ALLOWLIST 
    ? JSON.parse(process.env.NEXT_PUBLIC_CSP_ALLOWLIST)
    : undefined;

  const csp = buildCSP({
    enabled: cspEnabled,
    allowlist: cspAllowlist,
  });

  h.set("Content-Security-Policy", csp);
  
  // Store nonce for use in pages/components
  if (cspEnabled) {
    h.set("X-CSP-Nonce", generateNonce());
  }

  return h;
}
// [CRUX+HARDEN:END:csp]
