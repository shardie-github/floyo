/**
 * Onboarding Store (Zustand)
 * 
 * Manages onboarding flow state and progress.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type OnboardingStep = 'welcome' | 'privacy_consent' | 'first_setup' | 'complete';

interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
  isCompleted: boolean;
  setCurrentStep: (step: number) => void;
  completeStep: (step: number) => void;
  reset: () => void;
  markCompleted: () => void;
}

const initialState = {
  currentStep: 1,
  totalSteps: 3,
  completedSteps: [] as number[],
  isCompleted: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        setCurrentStep: (step) => {
          if (step >= 1 && step <= get().totalSteps) {
            set({ currentStep: step });
          }
        },
        
        completeStep: (step) => {
          const { completedSteps, totalSteps } = get();
          if (!completedSteps.includes(step)) {
            const newCompleted = [...completedSteps, step];
            set({
              completedSteps: newCompleted,
              currentStep: step < totalSteps ? step + 1 : step,
            });
          }
        },
        
        markCompleted: () => {
          set({ isCompleted: true, currentStep: get().totalSteps });
        },
        
        reset: () => set(initialState),
      }),
      {
        name: 'floyo-onboarding-store',
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          isCompleted: state.isCompleted,
        }),
      }
    ),
    { name: 'OnboardingStore' }
  )
);
