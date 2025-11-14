import React, { useState, useEffect } from 'react';
import LoginPage from "./LoginPage";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/data') // Adjust URL if backend port differs
      .then(response => response.json())
      .then(data => setMessage(data.message))
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          {isLoggedIn ? (
            <h1>Welcome to Subscription Manager!</h1>
          ) : (
            <LoginPage onLogin={handleLogin} />
          )}
        </div>
      </header>
    </div>

  );
}

export default App;