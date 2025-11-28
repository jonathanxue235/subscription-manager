// test utilities and helpers for creating test doubles

import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

//this is a test double for the real routing context

export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);

  return {
    ...render(ui, { wrapper: BrowserRouter }),
  };
}

//mock fetch response - test double for fetch API

export function createMockFetchResponse(data, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

//mock fetch function - stub for global fetch
export function mockFetch(mockImplementation) {
  global.fetch = jest.fn(mockImplementation);
  return global.fetch;
}

//reset all mocks after each test

export function resetAllMocks() {
  jest.clearAllMocks();
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear();
  }
}

//test double for browser storage
export const mockLocalStorage = (() => {
  let store = {};

  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
})();

//fake backend responses: test doubles for api
export const fakeBackendResponses = {
  successfulLogin: {
    message: 'Login successful',
    token: 'fake-jwt-token-12345',
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  },
  successfulSignup: {
    message: 'User created successfully',
    token: 'fake-jwt-token-67890',
    user: {
      id: 'user-456',
      email: 'newuser@example.com',
    },
  },
  loginError: {
    error: 'Invalid email or password',
  },
  signupError: {
    error: 'User already exists',
  },
  serverError: {
    error: 'Internal server error',
  },
};

//mock navigation
export const mockNavigate = jest.fn();

//wait for async operations
export const waitFor = (callback, { timeout = 3000 } = {}) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      try {
        callback();
        clearInterval(interval);
        resolve();
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          clearInterval(interval);
          reject(error);
        }
      }
    }, 50);
  });
};
