import React from 'react';
import Dashboard from "./pages/Dashboard";
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import UserProfile from "./pages/UserProfile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;