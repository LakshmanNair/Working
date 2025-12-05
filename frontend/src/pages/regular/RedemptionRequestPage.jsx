// frontend/src/pages/manager/RedemptionRequestPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRedemption } from '../../api/transactionsApi';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';

import './RedemptionRequestPage.css';

const RedemptionRequestPage = () => {
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const points = parseInt(amount, 10);

    if (Number.isNaN(points) || points <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (user && points > (user.points || 0)) {
      setError('Insufficient points');
      return;
    }

    setLoading(true);

    try {
      const result = await createRedemption({
        type: 'redemption', 
        amount: Math.abs(points),
        remark,
      });

      setTransactionId(result.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Redemption request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnother = () => {
    setTransactionId(null);
    setAmount('');
    setRemark('');
    setError('');
  };

  if (transactionId) {
    return (
      <div className="redemption-page">
        <div className="redemption-card">
          <h1 className="redemption-title">Redemption Request Created</h1>
          <p className="redemption-success-text">
            Your redemption request has been created successfully!
          </p>
          <p className="redemption-success-balance">
            Your current balance:{' '}
            <strong>{user?.points || 0} points</strong>
          </p>

          <div className="redemption-actions">
            <button
              type="button"
              className="redemption-submit-button"
              onClick={() => navigate('/manager/transactions')}
            >
              View Transactions
            </button>
            <button
              type="button"
              className="redemption-secondary-button"
              onClick={handleCreateAnother}
            >
              Create Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="redemption-page">
      <div className="redemption-card">
        <h1 className="redemption-title">Create Redemption Request</h1>
        <p className="redemption-subtitle">
          Your current balance:{' '}
          <span className="redemption-balance-strong">
            {user?.points || 0} points
          </span>
        </p>

        {error && (
          <div className="redemption-alert redemption-alert--error">
            <ErrorMessage message={error} />
          </div>
        )}

        <form className="redemption-form" onSubmit={handleSubmit}>
          <div className="redemption-form-field">
            <label htmlFor="amount">Amount (points)</label>
            <input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="redemption-form-field">
            <label htmlFor="remark">Remark (optional)</label>
            <textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="redemption-actions">
            <button
              type="submit"
              className="redemption-submit-button"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Redemption Request'}
            </button>
            <button
              type="button"
              className="redemption-secondary-button"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RedemptionRequestPage;

