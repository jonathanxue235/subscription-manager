import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../common.css';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user email from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserEmail(user.email || '');
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Redirect to login page
    navigate('/login');
  };

  const getInitial = () => {
    if (!userEmail) return 'U';
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <div
        className="profile-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={userEmail || 'User Profile'}
      >
        {getInitial()}
      </div>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-item dropdown-email">
            {userEmail}
          </div>
          <div className="dropdown-divider"></div>
          <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
