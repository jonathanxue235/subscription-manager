/**
 * Authentication Service for all authentication logic
 * information hiding:
 *  - hides API calls (uses ApiService), storage operations (uses StorageService), validation rules, simple signup/login/logout interface
 */

import api from './api';
import storage from '../utils/storage';

class AuthService {
  async signup(email, password, additionalData = {}) {
    this._validateEmail(email);
    this._validatePassword(password);

    const data = await api.post('/api/register', {
      email,
      password,
      ...additionalData
    });

    storage.setToken(data.token);
    storage.setUser(data.user);

    return data.user;
  }

  async login(email, password) {
    this._validateEmail(email);
    this._validatePassword(password);

    const data = await api.post('/api/login', { email, password });

    storage.setToken(data.token);
    storage.setUser(data.user);

    return data.user;
  }

  logout() {
    storage.clearAuth();
  }

  getCurrentUser() {
    return storage.getUser();
  }

  isAuthenticated() {
    return storage.isAuthenticated();
  }

  _validateEmail(email) {
    if (!email) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  _validatePassword(password) {
    if (!password) {
      throw new Error('Password is required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
  }
}

const authService = new AuthService();

export default authService;
