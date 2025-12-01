import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../common.css";

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const userEmail = user?.email || "";

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    // Use AuthContext logout (handles clearing localStorage)
    logout();

    // Redirect to login page
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const getInitial = () => {
    if (!userEmail) return "U";
    return userEmail.charAt(0).toUpperCase();
  };

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <div
        className="profile-avatar-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={userEmail || "User Profile"}
      >
        {getInitial()}
      </div>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="dropdown-item dropdown-email">{userEmail}</div>
          <button className="dropdown-item dropdown-edit-profile" onClick={() => goToProfile()}>
            Edit Profile
          </button>
          <div className="dropdown-divider"></div>
          <button
            className="dropdown-item dropdown-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
