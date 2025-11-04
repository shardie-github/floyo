'use client';

import { useState, useEffect } from 'react';
import { useOnboardingTracking } from '@/hooks/useAnalytics';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: () => void;
  onSkip?: () => void;
}

export function OnboardingFlow({ steps, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { trackOnboardingStart, trackOnboardingComplete, trackTutorialStep } = useOnboardingTracking();

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('has_seen_onboarding');
    if (!hasSeenOnboarding) {
      setIsVisible(true);
      trackOnboardingStart();
    }
  }, [trackOnboardingStart]);

  const handleNext = () => {
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
    onComplete();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-gray-600 mb-4">{step.description}</p>
            <div>{step.component}</div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
