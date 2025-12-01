import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';
import storage from '../utils/storage';

/**
 * AuthContext - Centralized authentication state management
 *
 * Provides:
 * - user: Current user object with id, email, etc. (id is used as FK in other tables)
 * - isAuthenticated: Boolean auth status
 * - login(email, password): Login function
 * - signup(email, password): Signup function
 * - logout(): Logout function
 * - loading: Initial auth check loading state
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        if (storage.isAuthenticated()) {
          const savedUser = storage.getUser();
          setUser(savedUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        storage.clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const userData = await authService.login(email, password);
    setUser(userData);
    return userData;
  };

  const signup = async (email, password) => {
    const userData = await authService.signup(email, password);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
