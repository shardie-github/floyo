'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingState } from '@/components/ui/LoadingState';
import { useOnboardingStore } from '@/lib/store';
import { useConsent } from '@/hooks/useConsent';
import { useAppStore } from '@/lib/store';
import { analytics } from '@/lib/analytics/analytics';

// Lazy load Joyride for interactive tutorial
const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { currentStep, totalSteps, completedSteps, setCurrentStep, completeStep, markCompleted } = useOnboardingStore();
  const { setConsent } = useConsent();
  const { setTrackingEnabled } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [runTutorial, setRunTutorial] = useState(false);

  useEffect(() => {
    // Track onboarding started
    analytics.trackActivationEvent('onboarding_started', {
      step: currentStep,
    });
    
    // Start interactive tutorial after a brief delay
    const timer = setTimeout(() => {
      setRunTutorial(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleStepComplete = async (stepNumber: number) => {
    // Track step completion
    analytics.trackActivationEvent('onboarding_step_completed', {
      step: stepNumber,
      step_name: getStepName(stepNumber),
    });

    completeStep(stepNumber);

    if (stepNumber < totalSteps) {
      setCurrentStep(stepNumber + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      markCompleted();
      
      // Track onboarding completion
      analytics.trackActivationEvent('onboarding_completion', {
        completion_time_seconds: Date.now() / 1000,
        steps_completed: completedSteps,
      });

      // Small delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));

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
      <Card className="w-full max-w-2xl onboarding-card">
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
          <Progress value={(currentStep / totalSteps) * 100} className="h-2 progress-bar" />
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`flex-1 h-1 mx-1 rounded ${
                  index + 1 <= currentStep
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
                aria-label={`Step ${index + 1} ${index + 1 <= currentStep ? 'completed' : 'pending'}`}
              />
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="step-content">
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
      
      {/* Interactive Tutorial */}
      {runTutorial && (
        <Joyride
          steps={[
            {
              target: '.onboarding-card',
              content: 'Welcome! This is your onboarding flow. Follow the steps to get started.',
              placement: 'center',
            },
            {
              target: '.progress-bar',
              content: 'Track your progress here. You can see how many steps you\'ve completed.',
            },
            {
              target: '.step-content',
              content: 'Each step will guide you through setting up Floyo.',
            },
          ]}
          run={runTutorial}
          continuous
          showProgress
          showSkipButton
          styles={{
            options: {
              primaryColor: '#2563eb',
            },
          }}
          callback={(data) => {
            if (data.status === 'finished' || data.status === 'skipped') {
              setRunTutorial(false);
            }
          }}
        />
      )}
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
      <Button
        onClick={onComplete}
        className="w-full mt-6"
        size="lg"
      >
        Get Started
      </Button>
    </div>
  );
}

function Step2Privacy({ onComplete }: { onComplete: () => void }) {
  const [consentGiven, setConsentGiven] = useState(false);
  const { setConsent } = useConsent();

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
      <Button
        onClick={() => {
          if (consentGiven) {
            setConsent({
              analytics: true,
              marketing: false,
              functional: true,
            });
            onComplete();
          }
        }}
        disabled={!consentGiven}
        className="w-full mt-6"
        size="lg"
      >
        Continue
      </Button>
    </div>
  );
}

function Step3Setup({ onComplete }: { onComplete: () => void }) {
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const { setTrackingEnabled: setAppTracking } = useAppStore();

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
      <Button
        onClick={() => {
          setAppTracking(trackingEnabled);
          onComplete();
        }}
        className="w-full mt-6"
        size="lg"
      >
        Complete Setup
      </Button>
    </div>
  );
}
