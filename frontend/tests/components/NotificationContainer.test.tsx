/**
 * NotificationContainer Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import { NotificationContainer } from '@/components/NotificationContainer';
import { useNotificationStore } from '@/lib/store';

// Mock the store
jest.mock('@/lib/store', () => ({
  useNotificationStore: jest.fn(),
}));

describe('NotificationContainer', () => {
  const mockRemoveNotification = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useNotificationStore as jest.Mock).mockReturnValue({
      notifications: [],
      removeNotification: mockRemoveNotification,
    });
  });

  it('renders without notifications', () => {
    render(<NotificationContainer />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders notifications', () => {
    (useNotificationStore as jest.Mock).mockReturnValue({
      notifications: [
        {
          id: '1',
          type: 'success',
          message: 'Test notification',
          timestamp: new Date(),
        },
      ],
      removeNotification: mockRemoveNotification,
    });

    render(<NotificationContainer />);
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  it('calls removeNotification when close button is clicked', async () => {
    (useNotificationStore as jest.Mock).mockReturnValue({
      notifications: [
        {
          id: '1',
          type: 'success',
          message: 'Test notification',
          timestamp: new Date(),
        },
      ],
      removeNotification: mockRemoveNotification,
    });

    render(<NotificationContainer />);
    const closeButton = screen.getByLabelText('Close');
    closeButton.click();

    await waitFor(() => {
      expect(mockRemoveNotification).toHaveBeenCalledWith('1');
    });
  });
});
