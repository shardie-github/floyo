/**
 * Privacy Onboarding Page
 * Entry point for consent wizard
 */

'use client';

import { PrivacyConsentWizard } from '@/components/PrivacyConsentWizard';
import { useRouter } from 'next/navigation';

export default function PrivacyOnboardingPage() {
  const router = useRouter();

  const handleComplete = () => {
    router.push('/settings/privacy');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <PrivacyConsentWizard onComplete={handleComplete} onCancel={handleCancel} />
    </div>
  );
}
