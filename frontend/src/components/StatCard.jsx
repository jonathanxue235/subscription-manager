import React from 'react';
import '../common.css';

const StatCard = ({ label, value, subtext }) => {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {subtext && <span className="stat-subtext">{subtext}</span>}
    </div>
  );
};

export default StatCard;