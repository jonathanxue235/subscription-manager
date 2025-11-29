import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubscriptionList from './SubscriptionList';

// Mock EditSubscriptionModal component
jest.mock('./EditSubscriptionModal', () => {
  return function MockEditSubscriptionModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-modal">
        <button onClick={onClose}>Close Edit Modal</button>
      </div>
    );
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Trash2: () => <span data-testid="trash-icon">Trash Icon</span>,
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe('SubscriptionList Component', () => {
  const mockOnDelete = jest.fn();
  const mockToken = 'test-token-123';

  const mockSubscriptions = [
    {
      id: 'sub-1',
      name: 'Netflix',
      logo: 'N',
      status: 'Active',
      frequency: 'Monthly',
      startDate: '2024-01-01',
      renewalDate: '2024-12-01',
      cost: '$15.99',
    },
    {
      id: 'sub-2',
      name: 'Spotify',
      logo: 'S',
      status: 'Expiring Soon',
      frequency: 'Annual',
      startDate: '2023-06-15',
      renewalDate: '2024-12-05',
      cost: '$99.99',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(mockToken);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    test('renders table with all subscriptions', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Spotify')).toBeInTheDocument();
      expect(screen.getByText('Monthly')).toBeInTheDocument();
      expect(screen.getByText('Annual')).toBeInTheDocument();
    });

    test('renders table headers correctly', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Renewal Date')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(screen.getByText('Remove Subscription')).toBeInTheDocument();
    });

    test('renders subscription logo', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const logos = screen.getAllByText(/^[NS]$/);
      expect(logos).toHaveLength(2);
    });

    test('renders status badges with correct styling', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const activeStatus = screen.getByText('Active');
      const expiringStatus = screen.getByText('Expiring Soon');

      expect(activeStatus).toHaveClass('status-badge', 'status-active');
      expect(expiringStatus).toHaveClass('status-badge', 'status-warning');
    });

    test('renders Remove button for each subscription', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('calculateDuration Function', () => {
    test('calculates duration in days for recent subscriptions', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: yesterday.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('1 day')).toBeInTheDocument();
    });

    test('calculates duration in days (plural) for subscriptions within a month', () => {
      const today = new Date();
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(today.getDate() - 5);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: fiveDaysAgo.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    test('displays "Today" for subscriptions starting today', () => {
      const today = new Date();
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: today.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    test('calculates duration in months for subscriptions less than a year old', () => {
      const today = new Date();
      const twoMonthsAgo = new Date(today);
      twoMonthsAgo.setMonth(today.getMonth() - 2);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: twoMonthsAgo.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('2 months')).toBeInTheDocument();
    });

    test('calculates duration in years for subscriptions over a year old', () => {
      const today = new Date();
      const twoYearsAgo = new Date(today);
      twoYearsAgo.setFullYear(today.getFullYear() - 2);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: twoYearsAgo.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('2 years')).toBeInTheDocument();
    });

    test('calculates duration in years and months for subscriptions with both', () => {
      const today = new Date();
      const oneYearThreeMonthsAgo = new Date(today);
      oneYearThreeMonthsAgo.setFullYear(today.getFullYear() - 1);
      oneYearThreeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: oneYearThreeMonthsAgo.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('1 year 3 months')).toBeInTheDocument();
    });

    test('handles singular year correctly', () => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: oneYearAgo.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('1 year')).toBeInTheDocument();
    });

    test('handles singular month correctly', () => {
      const today = new Date();
      const oneMonthAgo = new Date(today);
      oneMonthAgo.setMonth(today.getMonth() - 1);
      
      const subscription = {
        ...mockSubscriptions[0],
        startDate: oneMonthAgo.toISOString().split('T')[0],
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('1 month')).toBeInTheDocument();
    });

    test('displays N/A when startDate is missing', () => {
      const subscription = {
        ...mockSubscriptions[0],
        startDate: null,
      };

      render(<SubscriptionList subscriptions={[subscription]} onDelete={mockOnDelete} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('handleRemove Functionality', () => {
    test('opens confirmation modal when Remove button is clicked', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText(/Netflix/i)).toBeInTheDocument();
    });

    test('prevents row click when Remove button is clicked', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      // Should show delete confirmation modal, not edit modal
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });

    test('closes confirmation modal when Cancel is clicked', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
    });

    test('successfully deletes subscription and calls onDelete', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Subscription deleted successfully' }),
      });

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining(`/api/subscriptions/${mockSubscriptions[0].id}`),
          expect.objectContaining({
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${mockToken}`,
              'Content-Type': 'application/json'
            }
          })
        );
      });

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalled();
        expect(screen.queryByText('Confirm Deletion')).not.toBeInTheDocument();
      });
    });

    test('displays loading state during deletion', async () => {
      global.fetch.mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Deleted' })
        }), 100))
      );

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /^Delete$/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
      });
    });

    test('displays error message when deletion fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete subscription' }),
      });

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete subscription/i)).toBeInTheDocument();
      });

      // Should not close modal or call onDelete
      expect(screen.getByText('Confirm Deletion')).toBeInTheDocument();
      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    test('displays error when user is not authenticated', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Please log in to delete subscriptions/i)).toBeInTheDocument();
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    test('disables buttons during deletion', async () => {
      global.fetch.mockImplementationOnce(() => 
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ message: 'Deleted' })
        }), 100))
      );

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /^Delete$/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
      });
    });

    test('clears error when canceling after failed deletion', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to delete subscription' }),
      });

      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
      fireEvent.click(removeButtons[0]);

      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete subscription/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText(/Failed to delete subscription/i)).not.toBeInTheDocument();
    });
  });

  describe('Edit Functionality', () => {
    test('opens edit modal when row is clicked', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const rows = screen.getAllByRole('row');
      // Click on first subscription row (skip header row)
      fireEvent.click(rows[1]);

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    test('closes edit modal when close is called', () => {
      render(<SubscriptionList subscriptions={mockSubscriptions} onDelete={mockOnDelete} />);

      const rows = screen.getAllByRole('row');
      fireEvent.click(rows[1]);

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /Close Edit Modal/i });
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    test('renders empty table when no subscriptions', () => {
      render(<SubscriptionList subscriptions={[]} onDelete={mockOnDelete} />);

      // Table headers should still be present
      expect(screen.getByText('Name')).toBeInTheDocument();
      
      // But no subscription data
      expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
    });
  });
});
