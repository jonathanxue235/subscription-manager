import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../common.css";

function UserProfilePage() {
  const navigate = useNavigate();
  const { user, logout, loading, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [editedUsername, setEditedUsername] = useState("");
  const [editedBudget, setEditedBudget] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedPrimaryCurr, setEditedPrimaryCurr] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  // Refresh user data when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Failed to refresh user data:', error);
        }
      }
    };
    loadUserData();
  }, []);

  const handleEdit = () => {
    if (!isEditing) {
      setEditedEmail(user?.email || "");
      setEditedUsername(user?.username || "");
      setEditedBudget(user?.budget || "");
      setEditedLocation(user?.location || "");
      setEditedPrimaryCurr(user?.primary_curr || "");
    }
    setIsEditing(!isEditing);
    setSaveMessage("");
  };

  const handleSave = () => {
    // TODO: Implement save functionality with your backend API
    setSaveMessage("Profile updated successfully!");
    setIsEditing(false);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedEmail(user?.email || "");
    setEditedUsername(user?.username || "");
    setEditedBudget(user?.budget || "");
    setEditedLocation(user?.location || "");
    setEditedPrimaryCurr(user?.primary_curr || "");
    setSaveMessage("");
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

        {/* User Info Section */}
        <div className="profile-info-section">
          <div className="info-row">
            <span className="info-label">Email</span>
            {isEditing ? (
              <input
                type="email"
                className="input"
                value={editedEmail}
                onChange={(e) => setEditedEmail(e.target.value)}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.email || "N/A"}</span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Username</span>
            {isEditing ? (
              <input
                type="text"
                className="input"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.username || "N/A"}</span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Budget</span>
            {isEditing ? (
              <input
                type="number"
                className="input"
                value={editedBudget}
                onChange={(e) => setEditedBudget(e.target.value)}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.budget || "N/A"}</span>
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
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.location || "N/A"}</span>
            )}
          </div>

          <div className="info-row">
            <span className="info-label">Primary Currency</span>
            {isEditing ? (
              <input
                type="text"
                className="input"
                value={editedPrimaryCurr}
                onChange={(e) => setEditedPrimaryCurr(e.target.value)}
                style={{ maxWidth: "300px" }}
              />
            ) : (
              <span className="info-value">{user?.primary_curr || "N/A"}</span>
            )}
          </div>

          {user?.created_at && (
            <div className="info-row">
              <span className="info-label">Member Since</span>
              <span className="info-value">
                {new Date(user.created_at).toLocaleDateString("en-US", {
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
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
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
