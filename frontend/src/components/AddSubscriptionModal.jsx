import { useState } from 'react';
import '../common.css';
import budgetService from '../services/budgetService';
import storage from '../utils/storage';

const AddSubscriptionModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'Monthly',
    custom_frequency_days: '',
    start_date: '',
    cost: '',
    card_issuer: '',
    custom_card_issuer: ''
    });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showBudgetConfirm, setShowBudgetConfirm] = useState(false);
  const [budgetOverage, setBudgetOverage] = useState(0);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

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
      const token = storage.getToken();
      if (!token) {
        setError('Please log in to add subscriptions');
        setLoading(false);
        return;
      }

      // check budget before creating subscription
      try {
        const budgetCheck = await budgetService.checkBudget(
          formData.cost,
          formData.frequency,
          formData.custom_frequency_days || null
        );

        // if budget is exceeded, show confirmation dialog
        if (budgetCheck.exceedsBudget) {
          setBudgetOverage(budgetCheck.overageAmount);
          setShowBudgetConfirm(true);
          setLoading(false);
          return;
        }
      } catch (budgetErr) {
        console.error('Error checking budget:', budgetErr);
        // don't block subscription creation if budget check fails
      }

      // proceed with creating the subscription
      await createSubscription(token);
    } catch (err) {
      console.error('Error adding subscription:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const createSubscription = async (token) => {
    try {
      // prepare submission data
      const submissionData = {
        name: formData.name,
        frequency: formData.frequency,
        start_date: formData.start_date,
        cost: formData.cost
      };
      let cardIssuer = null;
      if (formData.card_issuer === '__custom') {
        cardIssuer = formData.custom_card_issuer?.trim() || null;
      } else if (formData.card_issuer) {
        cardIssuer = formData.card_issuer;
      }
      
      if (cardIssuer) {
        submissionData.card_issuer = cardIssuer;
      }
      // Add custom frequency days if Custom is selected
      if (formData.frequency === 'Custom' && formData.custom_frequency_days) {
        submissionData.custom_frequency_days = parseInt(formData.custom_frequency_days);
      }

      const response = await fetch(`${BACKEND_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add subscription');
      }

      // Reset form
      setFormData({
        name: '',
        frequency: 'Monthly',
        custom_frequency_days: '',
        start_date: '',
        cost: '',
        card_issuer: '',
        custom_card_issuer: ''
      });

      // Call success callback to refresh dashboard
      if (onSuccess) onSuccess();

      // Close modal
      onClose();
      setShowBudgetConfirm(false);
      setBudgetOverage(0);
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetConfirm = async () => {
    setShowBudgetConfirm(false);
    setLoading(true);
    const token = storage.getToken();
    await createSubscription(token);
  };

  const handleBudgetCancel = () => {
    setShowBudgetConfirm(false);
    setBudgetOverage(0);
  };

  if (!isOpen) return null;

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
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Add Subscription</h2>
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
          <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}
          >
            Payment Card (Issuer)
          </label>
          <select
            name="card_issuer"
            value={formData.card_issuer}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="">Select card or leave blank</option>
            <option value="Chase">Chase</option>
            <option value="Bank of America">Bank of America</option>
            <option value="Capital One">Capital One</option>
            <option value="Citi">Citi</option>
            <option value="Paypal">Paypal</option>
            <option value="__custom">Other (Custom)</option>
          </select>
        </div>

        {formData.card_issuer === '__custom' && (
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              Custom Card Issuer
            </label>
            <input
              type="text"
              name="custom_card_issuer"
              value={formData.custom_card_issuer}
              onChange={handleChange}
              placeholder="e.g., Chase Sapphire Preferred"
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
              {loading ? 'Adding...' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>

      {/* budget confirmation dialog */}
      {showBudgetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ⚠️
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827'
              }}>
                Budget Exceeded
              </h3>
            </div>

            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              color: '#6B7280',
              lineHeight: '1.5'
            }}>
              You're over your budget by{' '}
              <span style={{
                fontWeight: '600',
                color: '#DC2626'
              }}>
                ${budgetOverage.toFixed(2)}
              </span>
              . Do you want to proceed with adding this subscription?
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleBudgetCancel}
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
                onClick={handleBudgetConfirm}
                disabled={loading}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Adding...' : 'Yes, Add Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddSubscriptionModal;
