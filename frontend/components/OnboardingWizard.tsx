'use client';

import { useState, useEffect } from 'react';
import { X, Check, ArrowRight, ArrowLeft, Shield, BarChart, Workflow, Trophy, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  cta: string;
  skip?: boolean;
  icon?: React.ReactNode;
  interactive?: {
    type: 'workflow' | 'privacy' | 'demo';
    component?: React.ReactNode;
  };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Floyo! 🎉',
    description: 'Track your file usage patterns and discover integration opportunities. Let\'s get you started.',
    cta: 'Get Started',
    icon: <Zap className="w-8 h-8 text-blue-600" />,
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters 🛡️',
    description: 'You control what data is tracked. Enable privacy settings to customize your experience.',
    cta: 'Set Privacy',
    skip: true,
    icon: <Shield className="w-8 h-8 text-green-600" />,
    interactive: {
      type: 'privacy',
    },
  },
  {
    id: 'tracking',
    title: 'Start Tracking 📊',
    description: 'Floyo automatically learns your patterns. Just use your files normally and we\'ll do the rest.',
    cta: 'Start Tracking',
    icon: <BarChart className="w-8 h-8 text-purple-600" />,
  },
  {
    id: 'workflow',
    title: 'Create Your First Workflow 🔄',
    description: 'Build automated workflows to streamline your work. Drag and drop to create powerful automations.',
    cta: 'Create Workflow',
    icon: <Workflow className="w-8 h-8 text-orange-600" />,
    interactive: {
      type: 'workflow',
    },
  },
  {
    id: 'achievements',
    title: 'Earn Achievements 🏆',
    description: 'Level up, earn badges, and compete with others. Track more to unlock rewards!',
    cta: 'View Achievements',
    skip: true,
    icon: <Trophy className="w-8 h-8 text-yellow-600" />,
  },
];

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [privacyEnabled, setPrivacyEnabled] = useState(false);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = typeof window !== 'undefined' &&
    localStorage.getItem('onboarding_completed') === 'true';

  useEffect(() => {
    // Track onboarding start
    if (typeof window !== 'undefined' && !hasCompletedOnboarding) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'onboarding_started',
          properties: { step: currentStep },
        }),
      }).catch(() => {});
    }
  }, []);

  if (hasCompletedOnboarding || dismissed || completed) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      // Track step progress
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'onboarding_step_completed',
          properties: { step: currentStep, step_id: step.id },
        }),
      }).catch(() => {});
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (step.skip) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'onboarding_step_skipped',
          properties: { step: currentStep, step_id: step.id },
        }),
      }).catch(() => {});
      handleNext();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setCompleted(true);
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'onboarding_completed',
        properties: { total_steps: ONBOARDING_STEPS.length },
      }),
    }).catch(() => {});
    
    // Redirect to dashboard or workflow builder
    if (step.id === 'workflow') {
      router.push('/workflows/new');
    } else {
      router.push('/dashboard');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setDismissed(true);
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'onboarding_dismissed',
        properties: { step: currentStep },
      }),
    }).catch(() => {});
  };

  const handleWorkflowCreate = () => {
    router.push('/workflows/new');
    handleComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border-2 border-primary-200 dark:border-primary-800">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>Step {currentStep + 1} of {ONBOARDING_STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="text-center mb-6">
          {step.icon && (
            <div className="flex justify-center mb-4">
              {step.icon}
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {step.description}
          </p>
          
          {/* Interactive components */}
          {step.interactive?.type === 'privacy' && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacyEnabled}
                  onChange={(e) => setPrivacyEnabled(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable privacy controls
                </span>
              </label>
            </div>
          )}
          
          {step.interactive?.type === 'workflow' && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Ready to create your first workflow? Click below to open the workflow builder.
              </p>
              <button
                onClick={handleWorkflowCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Open Workflow Builder
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!isFirstStep && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {step.skip && (
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
          )}
          {step.interactive?.type !== 'workflow' && (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  Complete
                </>
              ) : (
                <>
                  {step.cta}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {ONBOARDING_STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx <= currentStep
                  ? 'bg-primary-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
