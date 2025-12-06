/*
* AddSubscriptionModal.test.jsx
* Tests for AddSubscriptionModal component
*/

/*
* Prompt for Claude Code:
  You are an expert Software Engineer following all of the software construction
  principles. Given the following AddSubscriptionModal component, please write a very detailed
  and comprehensive test suite, testing its functionality and edge cases to ensure that 
  subscriptions are being correctly added and managed. If you have any questions before
  implementing, please ask. 
*/
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddSubscriptionModal from './AddSubscriptionModal';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

describe('AddSubscriptionModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockToken = 'test-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(mockToken);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Rendering', () => {
    test('renders modal when isOpen is true', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Add Subscription')).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Frequency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Cost/i)).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      const { container } = render(<AddSubscriptionModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(container.firstChild).toBeNull();
    });

    test('renders all frequency options', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const frequencySelect = screen.getByLabelText(/Frequency/i);
      expect(frequencySelect).toHaveTextContent('Weekly');
      expect(frequencySelect).toHaveTextContent('Bi-Weekly');
      expect(frequencySelect).toHaveTextContent('Monthly');
      expect(frequencySelect).toHaveTextContent('Quarterly');
      expect(frequencySelect).toHaveTextContent('Bi-Annual');
      expect(frequencySelect).toHaveTextContent('Annual');
      expect(frequencySelect).toHaveTextContent('Custom');
    });

    test('shows custom frequency input when Custom is selected', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Initially should not show custom frequency input
      expect(screen.queryByLabelText(/Custom Frequency/i)).not.toBeInTheDocument();

      // Select Custom frequency
      const frequencySelect = screen.getByLabelText(/Frequency/i);
      fireEvent.change(frequencySelect, { target: { value: 'Custom' } });

      // Now should show custom frequency input
      expect(screen.getByLabelText(/Custom Frequency/i)).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    test('submits form with valid data successfully', async () => {
      const mockResponse = {
        id: 'sub-123',
        name: 'Netflix',
        frequency: 'Monthly',
        start_date: '2024-01-01',
        cost: 15.99,
        status: 'Active'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Monthly' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/subscriptions'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${mockToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: 'Netflix',
              frequency: 'Monthly',
              start_date: '2024-01-01',
              cost: '15.99'
            })
          })
        );
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('submits form with Custom frequency and custom_frequency_days', async () => {
      const mockResponse = {
        id: 'sub-456',
        name: 'Custom Service',
        frequency: 'Custom',
        start_date: '2024-01-01',
        cost: 29.99,
        custom_frequency_days: 45,
        status: 'Active'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Custom Service' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Custom' } });
      fireEvent.change(screen.getByLabelText(/Custom Frequency/i), { target: { value: '45' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '29.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/subscriptions'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              name: 'Custom Service',
              frequency: 'Custom',
              start_date: '2024-01-01',
              cost: '29.99',
              custom_frequency_days: 45
            })
          })
        );
      });
    });

    test('displays loading state during submission', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ id: 'sub-123' })
        }), 100))
      );

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Monthly' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/Adding.../i)).toBeInTheDocument();
      });
    });
  });

  describe('Input Validation', () => {
    test('requires all mandatory fields', async () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit form without filling in any fields
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      // Check that fetch was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('requires custom_frequency_days when Custom frequency is selected', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Select Custom frequency
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Custom' } });

      // Custom frequency input should have 'required' attribute
      const customFrequencyInput = screen.getByLabelText(/Custom Frequency/i);
      expect(customFrequencyInput).toBeRequired();
    });

    test('enforces minimum value for custom frequency days', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Select Custom frequency
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Custom' } });

      const customFrequencyInput = screen.getByLabelText(/Custom Frequency/i);
      expect(customFrequencyInput).toHaveAttribute('min', '1');
    });

    test('enforces minimum value for cost', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const costInput = screen.getByLabelText(/Cost/i);
      expect(costInput).toHaveAttribute('min', '0');
      expect(costInput).toHaveAttribute('step', '0.01');
    });
  });

  describe('Error Handling', () => {
    test('displays error message when submission fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to add subscription' }),
      });

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Monthly' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to add subscription/i)).toBeInTheDocument();
      });

      // Should not close modal or call onSuccess
      expect(mockOnClose).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    test('displays error when user is not authenticated', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Monthly' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please log in to add subscriptions/i)).toBeInTheDocument();
      });

      // Should not call fetch
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('handles network errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Monthly' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('closes modal when close button is clicked', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('closes modal when Cancel button is clicked', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('updates form state when inputs change', () => {
      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const nameInput = screen.getByLabelText(/Name/i);
      fireEvent.change(nameInput, { target: { value: 'Netflix' } });
      expect(nameInput.value).toBe('Netflix');

      const costInput = screen.getByLabelText(/Cost/i);
      fireEvent.change(costInput, { target: { value: '15.99' } });
      expect(costInput.value).toBe('15.99');
    });

    test('disables buttons during submission', async () => {
      global.fetch.mockImplementationOnce(() =>
        new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ id: 'sub-123' })
        }), 100))
      );

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Monthly' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      // Check that buttons are disabled
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
      });
    });

    test('resets form after successful submission', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'sub-123' }),
      });

      render(<AddSubscriptionModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill in form
      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Netflix' } });
      fireEvent.change(screen.getByLabelText(/Frequency/i), { target: { value: 'Annual' } });
      fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2024-01-01' } });
      fireEvent.change(screen.getByLabelText(/Cost/i), { target: { value: '15.99' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /Add Subscription/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });
});
