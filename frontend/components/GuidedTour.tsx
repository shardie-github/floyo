'use client';

import { useState, useEffect } from 'react';

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete?: () => void;
}

export default function GuidedTour({ steps, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if user has completed tour
    const completed = localStorage.getItem('guided_tour_completed');
    if (!completed) {
      setShow(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setShow(false);
    localStorage.setItem('guided_tour_completed', 'true');
    onComplete?.();
  };

  if (!show || steps.length === 0) {
    return null;
  }

  const step = steps[currentStep];
  const targetElement = document.querySelector(step.target);

  if (!targetElement) {
    return null;
  }

  const rect = targetElement.getBoundingClientRect();
  const position = step.position || 'bottom';

  const getPositionStyle = () => {
    switch (position) {
      case 'top':
        return {
          top: `${rect.top - 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 10}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 10}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 10}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {};
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      
      {/* Highlight */}
      <div
        className="fixed z-40 border-2 border-blue-500 rounded-lg pointer-events-none"
        style={{
          top: `${rect.top - 4}px`,
          left: `${rect.left - 4}px`,
          width: `${rect.width + 8}px`,
          height: `${rect.height + 8}px`,
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-lg p-4 max-w-sm"
        style={getPositionStyle()}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{step.title}</h3>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Skip tour"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{step.content}</p>
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </div>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1 text-sm text-gray-600 rounded hover:bg-gray-100"
              >
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Complete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
