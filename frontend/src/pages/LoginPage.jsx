import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../common.css';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmitCredentials(event) {
    event.preventDefault();
    setError(""); // Clear previous errors
    setIsLoading(true);

    try {
      // Send login request to your backend
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/login`, {
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
        setError(data.error || 'Login failed');
        console.error('Login error:', data);
      } else {
        console.log('Login successful:', data);

        // Store the JWT token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to dashboard after successful login
        navigate('/dashboard');
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