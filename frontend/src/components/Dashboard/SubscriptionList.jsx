import React from 'react';
import { Trash2 } from 'lucide-react';
import './Dashboard.css';

const SubscriptionList = ({ subscriptions }) => {

  const getStatusClass = (status) => {
    if (status === 'Active') return 'status-badge status-active';
    if (status === 'Expiring Soon') return 'status-badge status-warning';
    return 'status-badge';
  };

  const handleRowClick = (subName) => {
    alert(`Page to: ${subName}`);
  };

  const handleRemove = (e, subName) => {
    e.stopPropagation();
    alert(`Remove ${subName}?`);
  };

  return (
    <div className="table-container">
      <table className="sub-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Frequency</th>
            <th>Renewal Date</th>
            <th>Cost</th>
            <th>Remove Subscription</th> {/* Renamed Header */}
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((sub) => (
            <tr key={sub.id} onClick={() => handleRowClick(sub.name)}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="logo-circle">{sub.logo}</div>
                  {sub.name}
                </div>
              </td>
              <td><span className={getStatusClass(sub.status)}>{sub.status}</span></td>
              <td>{sub.frequency}</td>
              <td>{sub.renewalDate}</td>
              <td>{sub.cost}</td>
              <td>
                <button
                  className="btn-remove"
                  onClick={(e) => handleRemove(e, sub.name)}
                  title="Remove Subscription"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionList;