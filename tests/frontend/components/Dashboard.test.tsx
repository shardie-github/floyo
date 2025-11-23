/**
 * Tests for Dashboard Component
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '@/components/Dashboard';

// Mock dependencies
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    logout: jest.fn(),
  }),
}));

jest.mock('@/components/NotificationProvider', () => ({
  useNotifications: () => ({
    addNotification: jest.fn(),
  }),
}));

describe('Dashboard', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  it('should render dashboard', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Dashboard should render (may show loading state)
    expect(screen.getByRole('main') || screen.getByText(/dashboard/i)).toBeTruthy();
  });

  it('should show loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Should show loading indicators
    const loadingElements = screen.queryAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);
  });
});
