import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import '../common.css';

/**
 * Login Page - Refactored with Service Layer
 *
 * Information Hiding:
 *   - No fetch calls (uses AuthService)
 *   - No localStorage (AuthService handles it)
 *   - No validation logic (AuthService handles it)
 *   - Just UI and user interaction
 */

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmitCredentials(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Use AuthService - all business logic hidden!
      await authService.login(email, password);

      console.log('Login successful');

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // AuthService throws user-friendly error messages
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="auth-card">
        <h2 className="auth-title">Login</h2>
        <form className="form" onSubmit={handleSubmitCredentials}>
          <input
            type="email"
            value={email}
            placeholder="Email"
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isLoading}
            className="input"
          />
          <input
            type="password"
            value={password}
            placeholder="Password"
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isLoading}
            className="input"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={isLoading} className="btn btn-primary btn-full">
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="auth-footer">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="btn-link">
            Sign up here
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;