'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingTracking } from '@/hooks/useAnalytics';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  component?: React.ReactNode;
  action?: () => void;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Floyo! 🎉',
    description: 'Track your file usage patterns and discover integration opportunities. Let\'s get you started with a quick tour.',
    icon: '👋',
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters 🛡️',
    description: 'You control what data is tracked. Enable privacy settings to customize your experience. All data is encrypted and stored securely.',
    icon: '🔒',
  },
  {
    id: 'tracking',
    title: 'Start Tracking 📊',
    description: 'Floyo automatically learns your patterns. Just use your files normally and we\'ll do the rest. No manual setup required!',
    icon: '📈',
  },
  {
    id: 'workflows',
    title: 'Create Your First Workflow 🔄',
    description: 'Build automation workflows based on your patterns. Our AI will suggest workflows that save you time.',
    icon: '⚡',
    action: () => {
      // Navigate to workflow builder
      if (typeof window !== 'undefined') {
        window.location.href = '/workflows/new';
      }
    },
  },
  {
    id: 'integrations',
    title: 'Connect Your Tools 🔌',
    description: 'Integrate with Zapier, MindStudio, and more. Connect your favorite tools to automate your workflow.',
    icon: '🔗',
    action: () => {
      // Navigate to integrations
      if (typeof window !== 'undefined') {
        window.location.href = '/integrations';
      }
    },
  },
];

interface OnboardingFlowProps {
  steps?: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoShow?: boolean;
}

export function OnboardingFlow({ 
  steps = DEFAULT_STEPS, 
  onComplete, 
  onSkip,
  autoShow = true,
}: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { trackOnboardingStart, trackOnboardingComplete, trackTutorialStep } = useOnboardingTracking();

  useEffect(() => {
    if (autoShow) {
      // Check if user has seen onboarding
      const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
      if (!hasSeenOnboarding) {
        setIsVisible(true);
        trackOnboardingStart();
      }
    }
  }, [autoShow, trackOnboardingStart]);

  const handleNext = () => {
    const step = steps[currentStep];
    
    // Execute step action if present
    if (step.action) {
      step.action();
    }

    if (currentStep < steps.length - 1) {
      trackTutorialStep(currentStep + 1, steps[currentStep].id);
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    trackOnboardingComplete();
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem('has_seen_onboarding', 'true');
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="mb-8 text-center">
            {step.icon && (
              <div className="text-6xl mb-4">{step.icon}</div>
            )}
            <h2 className="text-3xl font-bold mb-4">{step.title}</h2>
            <p className="text-gray-600 text-lg mb-6">{step.description}</p>
            {step.component && <div className="mt-6">{step.component}</div>}
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx <= currentStep
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Skip Tour
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg"
              >
                {currentStep === steps.length - 1 ? 'Get Started →' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
