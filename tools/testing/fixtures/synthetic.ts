/**
 * Synthetic Users & Fixtures
 * 
 * Pre-defined test data for wiring verification:
 * - Users A & B (for RLS testing)
 * - Partner sandbox data
 * - Sample catalog SKUs
 * - Referral codes, coupons
 * - Paywall variants
 */

export interface SyntheticUser {
  email: string;
  password: string;
  username: string;
  fullName: string;
  ageGroup: 'adult' | 'minor';
  consentState: 'declined' | 'adult-accepted' | 'minor';
  isPremium: boolean;
}

export interface PartnerSandbox {
  partnerId: string;
  name: string;
  hmacKey: string;
  redirectUrl: string;
}

export interface PaywallVariant {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
}

export const SyntheticUsers: SyntheticUser[] = [
  {
    email: 'user-a@wiring-test.local',
    password: 'TestPass123!',
    username: 'user-a',
    fullName: 'User A',
    ageGroup: 'adult',
    consentState: 'adult-accepted',
    isPremium: false,
  },
  {
    email: 'user-b@wiring-test.local',
    password: 'TestPass123!',
    username: 'user-b',
    fullName: 'User B',
    ageGroup: 'adult',
    consentState: 'adult-accepted',
    isPremium: true,
  },
  {
    email: 'minor-user@wiring-test.local',
    password: 'TestPass123!',
    username: 'minor-user',
    fullName: 'Minor User',
    ageGroup: 'minor',
    consentState: 'minor',
    isPremium: false,
  },
];

export const PartnerSandboxes: PartnerSandbox[] = [
  {
    partnerId: 'partner-test-001',
    name: 'Test Partner',
    hmacKey: process.env.PARTNER_HMAC_KEY || 'test-hmac-key-change-in-production',
    redirectUrl: 'https://example.com/partner/redirect',
  },
];

export const PaywallVariants: PaywallVariant[] = [
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    price: 99.99,
    currency: 'USD',
    interval: 'year',
  },
];

export const SampleCatalogSKUs = [
  { sku: 'SKU-001', name: 'Basic Plan', price: 0 },
  { sku: 'SKU-002', name: 'Pro Plan', price: 9.99 },
  { sku: 'SKU-003', name: 'Enterprise Plan', price: 29.99 },
];

export const ReferralCodes = [
  { code: 'REF-001', discount: 0.1, maxUses: 100 },
  { code: 'REF-002', discount: 0.2, maxUses: 50 },
];

export const Coupons = [
  { code: 'SAVE20', discount: 0.2, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  { code: 'LAUNCH50', discount: 0.5, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
];
