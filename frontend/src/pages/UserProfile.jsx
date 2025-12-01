import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../common.css";

function UserProfilePage() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const handleEdit = () => {
    if (!isEditing) {
      setEditedEmail(user?.email || "");
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
    setSaveMessage("");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitial = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
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
