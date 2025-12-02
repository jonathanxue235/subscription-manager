import { AlertTriangle, X } from 'lucide-react';

const BudgetWarning = ({ overageAmount, onDismiss }) => {
  if (!overageAmount || overageAmount <= 0) return null;

  return (
    <div className="budget-warning-banner">
      <AlertTriangle className="budget-warning-icon" />
      <div className="budget-warning-content">
        <h3 className="budget-warning-title">Budget Exceeded</h3>
        <p className="budget-warning-message">
          You're over your budget by{' '}
          <span className="budget-warning-amount">${overageAmount.toFixed(2)}</span>.
          Your subscription will still be created.
        </p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#f59e0b'
          }}
          aria-label="Dismiss warning"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
};

export default BudgetWarning;
