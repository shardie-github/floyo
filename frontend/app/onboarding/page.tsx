'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/LoadingState';
import { analytics } from '@/lib/analytics/analytics';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 3;

  useEffect(() => {
    // Track onboarding started
    analytics.trackActivationEvent('onboarding_started', {
      step: currentStep,
    });
  }, []);

  const handleStepComplete = async (stepNumber: number) => {
    // Track step completion
    analytics.trackActivationEvent('onboarding_step_completed', {
      step: stepNumber,
      step_name: getStepName(stepNumber),
    });

    if (stepNumber < totalSteps) {
      setCurrentStep(stepNumber + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // Track onboarding completion
      analytics.trackActivationEvent('onboarding_completion', {
        completion_time_seconds: Date.now() / 1000, // Approximate
        steps_completed: [1, 2, 3],
      });

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStepName = (step: number): string => {
    const steps = ['welcome', 'privacy_consent', 'first_setup'];
    return steps[step - 1] || 'unknown';
  };

  if (loading) {
    return <LoadingState message="Completing onboarding..." fullScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle>Welcome to Floyo</CardTitle>
              <CardDescription>
                Let's get you started (Step {currentStep} of {totalSteps})
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentStep}/{totalSteps}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent>
          {currentStep === 1 && (
            <Step1Welcome onComplete={() => handleStepComplete(1)} />
          )}
          {currentStep === 2 && (
            <Step2Privacy onComplete={() => handleStepComplete(2)} />
          )}
          {currentStep === 3 && (
            <Step3Setup onComplete={() => handleStepComplete(3)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Step1Welcome({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Welcome to Floyo!</h2>
      <p className="text-muted-foreground">
        Floyo helps you understand your workflow patterns and suggests tools that fit your needs.
      </p>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-primary">✓</span>
          <span>Track your file usage automatically</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-primary">✓</span>
          <span>Discover patterns in your workflow</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-primary">✓</span>
          <span>Get AI-powered integration suggestions</span>
        </div>
      </div>
      <button
        onClick={onComplete}
        className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Get Started
      </button>
    </div>
  );
}

function Step2Privacy({ onComplete }: { onComplete: () => void }) {
  const [consentGiven, setConsentGiven] = useState(false);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Privacy First</h2>
      <p className="text-muted-foreground">
        Your privacy is important to us. We only track file paths and usage patterns, never file content.
      </p>
      <div className="space-y-3 p-4 bg-muted rounded">
        <div className="flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm">We track file paths and timestamps</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-green-500">✓</span>
          <span className="text-sm">We track which tools you use</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-red-500">✗</span>
          <span className="text-sm">We never track file content</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-red-500">✗</span>
          <span className="text-sm">We never access your code</span>
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(e) => setConsentGiven(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm">
          I understand and consent to privacy-first tracking
        </span>
      </label>
      <button
        onClick={onComplete}
        disabled={!consentGiven}
        className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
}

function Step3Setup({ onComplete }: { onComplete: () => void }) {
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Enable Tracking</h2>
      <p className="text-muted-foreground">
        Enable file tracking to start generating insights. You can change this anytime in settings.
      </p>
      <div className="p-4 border rounded">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="font-medium">Enable File Tracking</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={trackingEnabled}
              onChange={(e) => setTrackingEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </label>
        <p className="text-sm text-muted-foreground mt-2">
          Track file usage to generate personalized insights and recommendations.
        </p>
      </div>
      <button
        onClick={onComplete}
        className="w-full mt-6 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Complete Setup
      </button>
    </div>
  );
}
