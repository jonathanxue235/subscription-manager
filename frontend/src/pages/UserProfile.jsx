import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../common.css";

function UserProfilePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("users").select("*").single();

      if (error) {
        setUserData(null);
        setError(error.message);
      } else {
        setUserData(data);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="card card-md">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="card card-md profile-container">
        {/* Header Section */}
        <div className="profile-header">
          <h1 className="page-title">User Profile</h1>
        </div>

        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="avatar">
            {userData?.username?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>

        {/* User Info Section */}
        <div className="profile-info-section">
          <div className="info-row">
            <span className="info-label">Username</span>
            <span className="info-value">{userData?.username || "N/A"}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{userData?.email || "N/A"}</span>
          </div>

          <div className="info-row">
            <span className="info-label">User ID</span>
            <span className="info-value">{userData?.id || "N/A"}</span>
          </div>

          <div className="info-row">
            <span className="info-label">Member Since</span>
            <span className="info-value">
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="btn-group">
          <button className="btn btn-primary">Edit Profile</button>
          <button className="btn btn-danger">Logout</button>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;

