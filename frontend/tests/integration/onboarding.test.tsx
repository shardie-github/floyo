/**
 * Onboarding Flow Integration Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '@/app/onboarding/page';
import { useOnboardingStore } from '@/lib/store';

jest.mock('@/lib/store');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Onboarding Flow', () => {
  const mockSetCurrentStep = jest.fn();
  const mockCompleteStep = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useOnboardingStore as jest.Mock).mockReturnValue({
      currentStep: 1,
      totalSteps: 3,
      completedSteps: [],
      isCompleted: false,
      setCurrentStep: mockSetCurrentStep,
      completeStep: mockCompleteStep,
    });
  });

  it('renders welcome step', () => {
    render(<OnboardingPage />);
    expect(screen.getByText(/welcome to floyo/i)).toBeInTheDocument();
  });

  it('shows progress bar', () => {
    render(<OnboardingPage />);
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
  });

  it('advances to next step when continue is clicked', async () => {
    render(<OnboardingPage />);
    const continueButton = screen.getByRole('button', { name: /get started/i });
    await userEvent.click(continueButton);
    
    await waitFor(() => {
      expect(mockCompleteStep).toHaveBeenCalledWith(1);
    });
  });
});
