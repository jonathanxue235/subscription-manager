import React, { useState, useEffect } from 'react';
import '../common.css';

const EditSubscriptionModal = ({ isOpen, onClose, onSuccess, subscription }) => {
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'Monthly',
    custom_frequency_days: '',
    start_date: '',
    cost: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

  // Populate form when subscription changes
  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name || '',
        frequency: subscription.frequency || 'Monthly',
        custom_frequency_days: subscription.custom_frequency_days || '',
        start_date: subscription.startDate || '',
        cost: subscription.cost.replace('$', '') || ''
      });
    }
  }, [subscription]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to edit subscriptions');
        setLoading(false);
        return;
      }

      // Prepare submission data
      const submissionData = {
        name: formData.name,
        frequency: formData.frequency,
        start_date: formData.start_date,
        cost: formData.cost
      };

      // Add custom frequency days if Custom is selected
      if (formData.frequency === 'Custom' && formData.custom_frequency_days) {
        submissionData.custom_frequency_days = parseInt(formData.custom_frequency_days);
      }

      const response = await fetch(`${BACKEND_URL}/api/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update subscription');
      }

      // Call success callback to refresh dashboard
      if (onSuccess) onSuccess();

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !subscription) return null;

  return (
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
        maxWidth: '500px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Edit Subscription</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            ×
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Netflix"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Frequency *
            </label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="Weekly">Weekly</option>
              <option value="Bi-Weekly">Bi-Weekly (Every 2 weeks)</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly (Every 3 months)</option>
              <option value="Bi-Annual">Bi-Annual (Every 6 months)</option>
              <option value="Annual">Annual</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {formData.frequency === 'Custom' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Custom Frequency (days) *
              </label>
              <input
                type="number"
                name="custom_frequency_days"
                value={formData.custom_frequency_days}
                onChange={handleChange}
                required
                min="1"
                placeholder="e.g., 90"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              Cost (USD) *
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSubscriptionModal;
