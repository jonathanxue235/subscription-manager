import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import Fuse from 'fuse.js';
import EditSubscriptionModal from './EditSubscriptionModal';
import { formatDate } from '../utils/dateUtils';
import '../common.css';
import cancellationLinks from '../data/cancellationLinks';
import HighlightedText from './HighlightedText';
import SearchBar from "./SearchBar";
import { useSubscriptionSearch } from "../utils/useSubscriptionSearch";
import storage from '../utils/storage';
// Load all PNG icons from the `data` folder so we can select one by subscription name.
const icons = {};
function importAll(r) {
  r.keys().forEach((key) => {
    const name = key.replace('./', '').replace(/\.png$/, '');
    const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    icons[norm] = r(key);
  });
}
try {
  importAll(require.context('../data', false, /\.png$/));
} catch (e) {
  // require.context may not exist in some environments (tests). Safely ignore.
}


const SubscriptionList = ({ subscriptions, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editSubscription, setEditSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortDirection, setSortDirection] = useState(null); // null | 'asc' | 'desc'
  const [sortByDate, setSortByDate] = useState(null); // null | "asc" | "desc"


  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  const getStatusClass = (status) => {
    if (status === 'Active') return 'status-badge status-active';
    if (status === 'Expiring Soon') return 'status-badge status-warning';
    return 'status-badge';
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
      const token = storage.getToken();
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
  const parseCost = (cost) => {
    if (!cost) return 0;
    const num = parseFloat(String(cost).replace(/[^0-9.-]+/g, ""));
    return Number.isFinite(num) ? num : 0;
  };
  
  const parseDate = (str) => {
    const d = new Date(str);
    return isNaN(d) ? null : d;
  };
  
  const handleCancelDelete = () => {
    setConfirmDelete(null);
    setError(null);
  };

  const getMatches = (sub, key) => {
    return sub._matches?.find((m) => m.key === key)?.indices || [];
  };
    
  const toggleSortDirection = () => {
    setSortByDate(null); 
    setSortDirection((prev) =>
      prev === null ? "desc" : prev === "desc" ? "asc" : "desc"
    );
  };

  const toggleSortByDate = () => {
    setSortDirection(null); 
    setSortByDate((prev) =>
      prev === null ? "desc" : prev === "desc" ? "asc" : "desc"
    );
  };
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSubscriptions = useSubscriptionSearch(
    subscriptions,
    searchTerm,
    parseCost
  );

  const sortedSubscriptions = filteredSubscriptions.slice();
    if (sortByDate) {
      sortedSubscriptions.sort((a, b) => {
        const da = parseDate(a.renewalDate);
        const db = parseDate(b.renewalDate);

        if (!da || !db) return 0;

        return sortByDate === "asc" ? da - db : db - da;
      });
    }
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
      <SearchBar
        subscriptions={subscriptions}
        onSearch={(value) => setSearchTerm(value)}
      />
      <table className="sub-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Frequency</th>
            <th>Start Date</th>
            <th style={{ whiteSpace: "nowrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span>Renewal Date</span>
                <button
                  aria-label="Sort by renewal date"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSortByDate();
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    padding: "2px 6px",
                  }}
                >
                  {sortByDate === "asc"
                    ? "▲"
                    : sortByDate === "desc"
                    ? "▼"
                    : "⇅"}
                </button>
              </div>
            </th>
            <th style={{ whiteSpace: 'nowrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span>Cost</span>
                <button
                  aria-label="Sort by cost"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSortDirection();
                  }}
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
                  <div className="logo-circle">
                    {(() => {
                      const raw = sub && sub.name ? String(sub.name) : '';
                      const normalizedSub = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
                      let src = null;

                      if (normalizedSub) {
                        // Find any icon key that appears inside the subscription name
                        const candidates = Object.keys(icons || {}).filter((k) => {
                          if (!k) return false;
                          return normalizedSub.includes(k) || k.includes(normalizedSub);
                        });

                        if (candidates.length > 0) {
                          // Prefer the longest match (more specific)
                          candidates.sort((a, b) => b.length - a.length);
                          src = icons[candidates[0]];
                        }
                      }

                      if (src) {
                        return (
                          <img
                            src={src}
                            alt={`${sub.name} logo`}
                            style={{ width: 32, height: 32, borderRadius: '50%' }}
                          />
                        );
                      }

                      return sub.logo;
                    })()}
                  </div>
                  <span style={{ display: "inline-block" }}>
                    <HighlightedText
                      text={sub.name}
                      matches={getMatches(sub, "name")}
                    />
                  </span>
                </div>
              </td>
              <td>
                <span className={getStatusClass(sub.status)}>
                  <HighlightedText
                    text={sub.status}
                    matches={getMatches(sub, "status")}
                  />
                </span>
              </td>
              <td>
                <HighlightedText
                  text={sub.frequency}
                  matches={getMatches(sub, "frequency")}
                />
              </td>
              <td>{formatDate(sub.startDate)}</td>
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

            <p style={{ margin: 0, marginBottom: '12px', color: '#6B7280', fontSize: '14px' }}>
              Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This action cannot be undone.
            </p>

            {(() => {
              if (!confirmDelete || !confirmDelete.name) return null;
              const raw = String(confirmDelete.name);
              const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
              // find best match in cancellationLinks by substring, prefer longest match
              const keys = Object.keys(cancellationLinks || {});
              const matches = keys.filter((k) => {
                if (!k) return false;
                return normalized.includes(k) || k.includes(normalized);
              });
              if (matches.length === 0) return null;
              matches.sort((a, b) => b.length - a.length);
              const best = matches[0];
              const url = cancellationLinks[best];
              if (!url) return null;

              return (
                <p style={{ marginTop: 0, marginBottom: '12px', fontSize: '13px' }}>
                  You can cancel directly at{' '}
                  <a href={url} target="_blank" rel="noopener noreferrer">{new URL(url).hostname.replace('www.', '')}</a>
                  {'.'}
                </p>
              );
            })()}

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