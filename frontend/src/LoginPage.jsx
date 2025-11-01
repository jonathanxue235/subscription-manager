import React, { useState } from 'react';
import "./LoginPage.css";



function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState("");

  function handleSubmitCredentials(event) {
    event.preventDefault();
    console.log('Email:', email);
    console.log('Password:', password);
  }

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmitCredentials}>
        <input
          type="email"
          value={email}
          placeholder="Email"
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          value={password}
          placeholder="Password"
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}


export default LoginPage;