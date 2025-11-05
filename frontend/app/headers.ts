// [CRUX+HARDEN:BEGIN:csp]
import type { Headers } from "next/dist/server/web/spec-extension/adapters/headers";

export function headers(): Headers {
  const h = new Headers();
  h.set("X-Frame-Options", "DENY");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Minimal CSP; set flags.crux.csp_headers=true to enable stricter policy in prod
  h.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;"
  );
  return h;
}
// [CRUX+HARDEN:END:csp]
