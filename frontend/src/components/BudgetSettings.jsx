import React, { useState, useEffect } from 'react';
import { DollarSign, Save, AlertCircle } from 'lucide-react';
import budgetService from '../services/budgetService';

const BudgetSettings = () => {
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const data = await budgetService.getBudget();
      setBudget(data.monthlyBudget > 0 ? data.monthlyBudget : '');
      setError('');
    } catch (err) {
      console.error('Error fetching budget:', err);
      setError('Failed to load budget');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const budgetValue = parseFloat(budget);

    if (budget === '' || budgetValue === 0) {
      // Allow clearing budget
      try {
        setSaving(true);
        await budgetService.updateBudget(0);
        setSuccess('Budget removed successfully!');
        setError('');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error updating budget:', err);
        setError('Failed to update budget');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (isNaN(budgetValue) || budgetValue < 0) {
      setError('Please enter a valid positive number');
      return;
    }

    try {
      setSaving(true);
      await budgetService.updateBudget(budgetValue);
      setSuccess('Budget updated successfully!');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating budget:', err);
      setError('Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="budget-settings">
        <div className="loading">Loading budget...</div>
      </div>
    );
  }

  return (
    <div className="budget-settings">
      <div className="budget-header">
        <DollarSign className="budget-icon" />
        <h2>Monthly Budget</h2>
      </div>

      <p className="budget-description">
        Set a monthly budget to track your subscription spending. You'll receive a warning when adding new subscriptions would exceed your budget.
      </p>

      <form onSubmit={handleSave} className="budget-form">
        <div className="form-group">
          <label htmlFor="budget">Monthly Budget ($)</label>
          <input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount (leave empty for no budget)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="budget-input"
          />
          <small className="form-hint">
            Set to 0 or leave empty to disable budget tracking
          </small>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn-save"
          disabled={saving}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Budget'}
        </button>
      </form>
    </div>
  );
};

export default BudgetSettings;
