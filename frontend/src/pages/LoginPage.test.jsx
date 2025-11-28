// unit tests for login page using test doubles

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from './LoginPage';
import {
  renderWithRouter,
  createMockFetchResponse,
  mockFetch,
  resetAllMocks,
  mockLocalStorage,
  fakeBackendResponses,
} from '../utils/testUtils';

// mock useNavigate hook - test double
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('LoginPage - Unit Tests with Test Doubles', () => {
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

  test('renders login form with all inputs', () => {
    renderWithRouter(<LoginPage />);

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('successful login calls API and redirects to dashboard', async () => {
    // stub: mock successful API response
    const fetchMock = mockFetch(() =>
      Promise.resolve(createMockFetchResponse(fakeBackendResponses.successfulLogin))
    );

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // verify API was called with correct data (mock verification)
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
    });

    // verify localStorage was called (spy on localStorage)
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'token',
        fakeBackendResponses.successfulLogin.token
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'user',
        JSON.stringify(fakeBackendResponses.successfulLogin.user)
      );
    });

    // verify navigation was called (mock verification)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('displays error message when login fails', async () => {
    // stub: mock failed API response
    mockFetch(() =>
      Promise.resolve(
        createMockFetchResponse(fakeBackendResponses.loginError, false, 401)
      )
    );

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // verify navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
    // verify localStorage was not updated
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
  });

  test('displays error when server is unreachable', async () => {
    // stub: mock network error
    mockFetch(() => Promise.reject(new Error('Network error')));

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/unable to connect to server/i)).toBeInTheDocument();
    });
  });

  test('navigates to signup page when clicking signup link', () => {
    renderWithRouter(<LoginPage />);

    const signupLink = screen.getByText(/sign up here/i);
    fireEvent.click(signupLink);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  test('disables form during submission', async () => {
    // stub: mock slow API response
    mockFetch(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve(createMockFetchResponse(fakeBackendResponses.successfulLogin)),
            100
          )
        )
    );

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' },
    });

    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);

    // button should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();

    // wait for completion
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('clears error message when user starts typing', async () => {
    // stub: mock failed login first
    mockFetch(() =>
      Promise.resolve(
        createMockFetchResponse(fakeBackendResponses.loginError, false, 401)
      )
    );

    renderWithRouter(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // now submit again - error should be cleared during submission
    mockFetch(() =>
      Promise.resolve(createMockFetchResponse(fakeBackendResponses.successfulLogin))
    );

    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    // error should be gone (form resubmitting)
    await waitFor(() => {
      expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
    });
  });
});
