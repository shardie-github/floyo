'use client';

import { useEffect, useState } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useOnboardingTracking } from '@/hooks/useAnalytics';

interface ProductTourProps {
  steps: Step[];
  run?: boolean;
  onComplete?: () => void;
}

export function ProductTour({ steps, run: runTour = false, onComplete }: ProductTourProps) {
  const [run, setRun] = useState(runTour);
  const { trackTutorialStep } = useOnboardingTracking();

  useEffect(() => {
    // Check if user has completed tour
    const hasCompletedTour = localStorage.getItem('has_completed_product_tour');
    if (!hasCompletedTour && runTour) {
      setRun(true);
    }
  }, [runTour]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, type } = data;

    // Track step completion
    if (type === 'step:after' && index !== undefined) {
      trackTutorialStep(index + 1, steps[index]?.target as string || 'unknown');
    }

    // Handle completion
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem('has_completed_product_tour', 'true');
      setRun(false);
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#2563eb',
          zIndex: 10000,
        },
      }}
    />
  );
}

// Predefined tour steps for Floyo
export const defaultTourSteps: Step[] = [
  {
    target: 'body',
    content: 'Welcome to Floyo! Let\'s take a quick tour to get you started.',
    placement: 'center',
  },
  {
    target: '[data-tour="dashboard"]',
    content: 'This is your dashboard. Here you can see your events, patterns, and suggestions.',
  },
  {
    target: '[data-tour="workflows"]',
    content: 'Create workflows to automate your file operations and integrations.',
  },
  {
    target: '[data-tour="suggestions"]',
    content: 'Floyo analyzes your file patterns and suggests integrations you might find useful.',
  },
  {
    target: '[data-tour="events"]',
    content: 'View all your file events and track your usage patterns here.',
  },
];
