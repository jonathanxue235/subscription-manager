
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignupPage from './SignUpPage';
import {
  renderWithRouter,
  createMockFetchResponse,
  mockFetch,
  resetAllMocks,
  mockLocalStorage,
  fakeBackendResponses,
} from '../utils/testUtils';

// mock useNavigate hook: test double
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SignUpPage - Unit Tests with Test Doubles', () => {
  beforeEach(() => {
    resetAllMocks();
    mockNavigate.mockClear();
    // replace real localStorage with our test double
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders signup form with all inputs', () => {
    renderWithRouter(<SignupPage />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  test('displays error when passwords do not match', async () => {
    renderWithRouter(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'different' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });

    // verify fetch was not called (validation failed before api call)
    expect(global.fetch).toBeUndefined();
  });

  test('displays error when password is too short', async () => {
    renderWithRouter(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: '12345' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  test('successful signup calls API and redirects to dashboard', async () => {
    // stub: mock successful api response
    const fetchMock = mockFetch(() =>
      Promise.resolve(createMockFetchResponse(fakeBackendResponses.successfulSignup))
    );

    renderWithRouter(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // verify api was called with correct data (mock verification)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'newuser@example.com',
            password: 'password123',
          }),
        })
      );
    });

    //verify localstorage was called (spy on localstorage)
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'token',
        fakeBackendResponses.successfulSignup.token
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(fakeBackendResponses.successfulSignup.user)
      );
    });

    // verify navigation was called (mock verification)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays error message when signup fails', async () => {
    // stub: mock failed api response
    mockFetch(() =>
      Promise.resolve(
        createMockFetchResponse(fakeBackendResponses.signupError, false, 400)
      )
    );

    renderWithRouter(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'existing@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/user already exists/i)).toBeInTheDocument();
    });

    // verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('displays error when server is unreachable', async () => {
    // stub: mock network error
    mockFetch(() => Promise.reject(new Error('Network error')));

    renderWithRouter(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  test('navigates to login page when clicking login link', () => {
    renderWithRouter(<SignupPage />);

    const loginLink = screen.getByText(/login here/i);
    fireEvent.click(loginLink);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('disables form during submission', async () => {
    // stub: slow api response
    mockFetch(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(createMockFetchResponse(fakeBackendResponses.successfulSignup)),
            100
          )
        )
    );

    renderWithRouter(<SignupPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(submitButton);

    // button should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/creating account/i)).toBeInTheDocument();

    // wait for completion
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
