'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  cta: string;
  skip?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Floyo! 🎉',
    description: 'Track your file usage patterns and discover integration opportunities. Let\'s get you started.',
    cta: 'Get Started',
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters 🛡️',
    description: 'You control what data is tracked. Enable privacy settings to customize your experience.',
    cta: 'Set Privacy',
    skip: true,
  },
  {
    id: 'tracking',
    title: 'Start Tracking 📊',
    description: 'Floyo automatically learns your patterns. Just use your files normally and we\'ll do the rest.',
    cta: 'Start Tracking',
  },
  {
    id: 'achievements',
    title: 'Earn Achievements 🏆',
    description: 'Level up, earn badges, and compete with others. Track more to unlock rewards!',
    cta: 'View Achievements',
    skip: true,
  },
];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if user has completed onboarding
  const hasCompletedOnboarding = typeof window !== 'undefined' &&
    localStorage.getItem('onboarding_completed') === 'true';

  if (hasCompletedOnboarding || dismissed || completed) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    if (step.skip) {
      handleNext();
    }
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setCompleted(true);
  };

  const handleDismiss = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setDismissed(true);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {step.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {step.skip && (
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            {currentStep === ONBOARDING_STEPS.length - 1 ? (
              <>
                <Check className="w-4 h-4" />
                Complete
              </>
            ) : (
              step.cta
            )}
          </button>
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
