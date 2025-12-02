import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import EditSubscriptionModal from './EditSubscriptionModal';
import '../common.css';

const SubscriptionList = ({ subscriptions, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editSubscription, setEditSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState(null); // null | 'asc' | 'desc'

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  const getStatusClass = (status) => {
    if (status === 'Active') return 'status-badge status-active';
    if (status === 'Expiring Soon') return 'status-badge status-warning';
    return 'status-badge';
  };

  const formatStartDate = (startDate) => {
    if (!startDate) return 'N/A';

    const date = new Date(startDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRowClick = (subscription) => {
    setEditSubscription(subscription);
  };

  const handleRemove = (e, subscription) => {
    e.stopPropagation();
    setConfirmDelete(subscription);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to delete subscriptions');
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/subscriptions/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subscription');
      }

      // Close modal and refresh dashboard
      setConfirmDelete(null);
      if (onDelete) onDelete();
    } catch (err) {
      console.error('Error deleting subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
    setError(null);
  };

  const toggleSortDirection = () => setSortDirection((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null));

  const normalizedQuery = (searchTerm || '').trim().toLowerCase();
  const filteredSubscriptions = (subscriptions || []).filter((sub) => {
    if (!normalizedQuery) return true;
    const hay = [sub.name, sub.status, sub.frequency, sub.renewalDate, sub.cost]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(normalizedQuery);
  });

  const parseCost = (cost) => {
    if (cost === null || cost === undefined) return 0;
    if (typeof cost === 'number') return cost;
    const num = parseFloat(String(cost).replace(/[^0-9.-]+/g, ''));
    return Number.isFinite(num) ? num : 0;
  };

  const sortedSubscriptions = filteredSubscriptions.slice();
  if (sortDirection) {
    sortedSubscriptions.sort((a, b) => {
      const ca = parseCost(a.cost);
      const cb = parseCost(b.cost);
      if (ca === cb) return 0;
      return sortDirection === 'asc' ? ca - cb : cb - ca;
    });
  }

  return (
    <div className="table-container">
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
        <input
          aria-label="Search subscriptions"
          type="search"
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #D1D5DB',
            width: '100%',
            maxWidth: '320px'
          }}
        />
      </div>
      <table className="sub-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Frequency</th>
            <th>Start Date</th>
            <th>Renewal Date</th>
            <th style={{ whiteSpace: 'nowrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Cost</span>
                <button
                  aria-label="Sort by cost"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSortDirection();
                  }}
                  title={sortDirection ? `Sort ${sortDirection === 'asc' ? 'descending' : 'clear'}` : 'Sort ascending'}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '2px 6px'
                  }}
                >
                  {sortDirection === 'asc' ? '▲' : sortDirection === 'desc' ? '▼' : '⇅'}
                </button>
              </div>
            </th>
            <th>Remove Subscription</th>
          </tr>
        </thead>
        <tbody>
          {sortedSubscriptions.map((sub) => (
            <tr key={sub.id} onClick={() => handleRowClick(sub)} style={{ cursor: 'pointer' }}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="logo-circle">{sub.logo}</div>
                  {sub.name}
                </div>
              </td>
              <td><span className={getStatusClass(sub.status)}>{sub.status}</span></td>
              <td>{sub.frequency}</td>
              <td>{formatStartDate(sub.startDate)}</td>
              <td>{sub.renewalDate}</td>
              <td>{sub.cost}</td>
              <td>
                <button
                  className="btn-remove"
                  onClick={(e) => handleRemove(e, sub)}
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

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: 0, marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
              Confirm Deletion
            </h3>

            {error && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <p style={{ margin: 0, marginBottom: '20px', color: '#6B7280', fontSize: '14px' }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancelDelete}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: 'white',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <EditSubscriptionModal
        isOpen={!!editSubscription}
        onClose={() => setEditSubscription(null)}
        onSuccess={onDelete}
        subscription={editSubscription}
      />
    </div>
  );
};

export default SubscriptionList;