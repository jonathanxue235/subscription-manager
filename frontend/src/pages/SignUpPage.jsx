import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../common.css';

/**
 * SignUp Page - Refactored with AuthContext
 *
 * Information Hiding:
 *   - No fetch calls (uses AuthContext)
 *   - No localStorage (AuthContext handles it)
 *   - No validation logic (AuthContext/AuthService handles it)
 *   - Just UI and user interaction
 */

function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmitCredentials(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    // Client-side validation for password match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    try {
      // Use AuthContext signup - all business logic hidden!
      await signup(email, password);

      console.log('Registration successful');

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      // AuthContext throws user-friendly error messages
      setError(err.message);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="auth-card">
        <h2 className="auth-title">Sign Up</h2>
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
          <input
            type="password"
            value={confirmPassword}
            placeholder="Confirm Password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={isLoading}
            className="input"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={isLoading} className="btn btn-primary btn-full">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="btn-link">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;