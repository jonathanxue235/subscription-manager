import React, { useState } from 'react';
import '../common.css';

function SignupPage({ onSignup, onSwitchToLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmitCredentials(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Send registration request to backend
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        console.error('Registration error:', data);
      } else {
        console.log('Registration successful:', data);

        // Store the JWT token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Call the parent component's signup handler
        onSignup(data.user);
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
      console.error('Unexpected error:', err);
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
          <button onClick={onSwitchToLogin} className="btn-link">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;