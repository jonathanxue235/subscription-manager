/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { formatDateTime } from "../utils/dateUtils";
import api from "../services/api";
import storage from "../utils/storage";
import "../common.css";

/*
I implemented the functionalities and then told Claude Code:
Standardize the UI with the other pages
*/

function UserProfilePage() {
  const navigate = useNavigate();
  const { user, logout, loading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBudget, setEditedBudget] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedPrimaryCurr, setEditedPrimaryCurr] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Refresh user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          await refreshUser();
        } catch (error) {
          console.error("Failed to refresh user data:", error);
        }
      }
    };
    loadUserData();
  }, []);

  const handleEdit = () => {
    if (!isEditing) {
      setEditedUsername(user?.username || "");
      setEditedBudget(user?.monthly_budget || "");
      setEditedLocation(user?.location || "");
      setEditedPrimaryCurr(user?.primary_curr || "USD");
    }
    setIsEditing(!isEditing);
    setSaveMessage("");
    setError("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const token = storage.getToken();

      const updates = {
        username: editedUsername,
        monthly_budget: editedBudget ? parseFloat(editedBudget) : null,
        location: editedLocation.trim() || null,
        primary_curr: editedPrimaryCurr
      };

      await api.put('/api/user', updates, token);

      // Refresh user data to get the latest from the server
      await refreshUser();

      setSaveMessage("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUsername(user?.username || "");
    setEditedBudget(user?.monthly_budget || "");
    setEditedLocation(user?.location || "");
    setEditedPrimaryCurr(user?.primary_curr || "USD");
    setSaveMessage("");
    setError("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitial = () => {
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="card card-md">
          <p className="error-message">
            No user data available. Please log in.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card card-lg profile-container">
        {/* Back Button */}
        <button
          className="btn btn-secondary mb-3"
          onClick={() => navigate("/dashboard")}
          style={{ alignSelf: "flex-start" }}
        >
          ← Back to Dashboard
        </button>

        {/* Header Section */}
        <div className="profile-header">
          <h1 className="page-title">My Profile</h1>
        </div>

        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="avatar avatar-lg">{getInitial()}</div>
        </div>

        {/* Success Message */}
        {saveMessage && <div className="success-message">{saveMessage}</div>}

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* User Info Section */}
        <div className="profile-info-section">
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{user?.email || "N/A"}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Username</span>
            {isEditing ? (
              <input
                type="text"
                className="input"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                disabled={isSaving}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.username || "N/A"}</span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Monthly Budget</span>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                className="input"
                value={editedBudget}
                onChange={(e) => setEditedBudget(e.target.value)}
                disabled={isSaving}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">
                {user?.monthly_budget != null
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: user?.primary_curr || 'USD'
                    }).format(user.monthly_budget)
                  : "Not set"}
              </span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Location</span>
            {isEditing ? (
              <input
                type="text"
                className="input"
                value={editedLocation}
                onChange={(e) => setEditedLocation(e.target.value)}
                disabled={isSaving}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.location || "N/A"}</span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Primary Currency</span>
            {isEditing ? (
              <select
                className="input"
                value={editedPrimaryCurr}
                onChange={(e) => setEditedPrimaryCurr(e.target.value)}
                disabled={isSaving}
                style={{ maxWidth: "300px" }}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            ) : (
              <span className="info-value">{user?.primary_curr || "N/A"}</span>
            )}
          </div>

          {user?.created_at && (
            <div className="info-row">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {formatDateTime(user.created_at, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="btn-group">
          {isEditing ? (
            <>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" onClick={handleEdit}>
                Edit Profile
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;
