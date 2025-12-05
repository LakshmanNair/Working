// frontend/src/pages/manager/TransactionDetailPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  getTransaction,
  toggleSuspicious,
  createAdjustment,
} from '../../api/transactionsApi';
import { useAuth } from '../../hooks/useAuth';

import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

import './TransactionDetailPage.css';

const TransactionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentRemark, setAdjustmentRemark] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTransaction = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getTransaction(id);
      setTransaction(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSuspicious = async () => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          transaction.suspicious ? 'unmark' : 'mark'
        } this transaction as suspicious?`,
      )
    ) {
      return;
    }

    try {
      await toggleSuspicious(id, !transaction.suspicious);
      setTransaction((prev) => ({ ...prev, suspicious: !prev.suspicious }));
    } catch (err) {
      alert(
        err.response?.data?.error || 'Failed to update suspicious flag',
      );
    }
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await createAdjustment({
        utorid: transaction.user?.utorid || transaction.utorid,
        amount: parseInt(adjustmentAmount, 10),
        relatedId: parseInt(id, 10),
        remark: adjustmentRemark,
      });

      alert('Adjustment created successfully!');
      setShowAdjustmentForm(false);
      setAdjustmentAmount('');
      setAdjustmentRemark('');
      fetchTransaction(); // refresh points / related info
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="transaction-detail-page">
        <div className="transaction-detail-card transaction-detail-card--loading">
          <Loader />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="transaction-detail-page">
        <div className="transaction-detail-card transaction-detail-card--loading">
          <ErrorMessage message={error || 'Transaction not found.'} />
        </div>
      </div>
    );
  }

  const amountNumber = Number(transaction.amount) || 0;
  const amountClassName = `transaction-detail-amount ${
    amountNumber >= 0
      ? 'transaction-detail-amount--positive'
      : 'transaction-detail-amount--negative'
  }`;

  const type = transaction.type || 'default';
  const typeBadgeClassName = `transaction-detail-type-badge transaction-detail-type-badge--${type}`;

  const statusTextClassName = `transaction-detail-status-text ${
    transaction.suspicious
      ? 'transaction-detail-status-text--suspicious'
      : 'transaction-detail-status-text--normal'
  }`;

  return (
    <div className="transaction-detail-page">
      <div className="transaction-detail-card">
        <div className="transaction-detail-header">
          <h1 className="transaction-detail-title">Transaction Details</h1>

          <button
            type="button"
            className="transaction-detail-back"
            onClick={() => navigate('/manager/transactions')}
          >
            Back to List
          </button>
        </div>

        {error && (
          <div className="transaction-detail-alert transaction-detail-alert--error">
            <ErrorMessage message={error} />
          </div>
        )}

        <div className="transaction-detail-overview">
          <div className="transaction-detail-overview-block">
            <span className="transaction-detail-label">Transaction ID</span>
            <span className="transaction-detail-value">
              #{transaction.id}
            </span>
          </div>

          <div className="transaction-detail-overview-block">
            <span className="transaction-detail-label">Type</span>
            <span className={typeBadgeClassName}>
              {transaction.type ? transaction.type.toUpperCase() : 'UNKNOWN'}
            </span>
          </div>

          <div className="transaction-detail-overview-block">
            <span className="transaction-detail-label">Amount</span>
            <span className={amountClassName}>
              {amountNumber >= 0
                ? `+${amountNumber} points`
                : `${amountNumber} points`}
            </span>
          </div>

          <div className="transaction-detail-overview-block">
            <span className="transaction-detail-label">Status</span>
            <div className="transaction-detail-status">
              <span className="transaction-detail-status-icon">
                {transaction.suspicious ? '⚠' : '✓'}
              </span>
              <span className={statusTextClassName}>
                {transaction.suspicious ? 'Suspicious' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        <section className="transaction-detail-section">
          <h2 className="transaction-detail-section-title">Details</h2>

          <div className="transaction-detail-section transaction-detail-section--info">
            <p className="transaction-detail-field">
              <span className="transaction-detail-label">User: </span>
              {transaction.user?.utorid || transaction.utorid || 'N/A'}
            </p>

            <p className="transaction-detail-field">
              <span className="transaction-detail-label">Created By: </span>
              {transaction.createdBy || 'N/A'}
            </p>

            <p className="transaction-detail-field">
              <span className="transaction-detail-label">Remark: </span>
              {transaction.remark || 'N/A'}
            </p>

            <p className="transaction-detail-field">
              <span className="transaction-detail-label">Created At: </span>
              {formatDate(transaction.createdAt)}
            </p>
          </div>
        </section>

        <section className="transaction-detail-section">
          <div className="transaction-detail-actions-card">
            <h2 className="transaction-detail-actions-header">Actions</h2>

            <div className="transaction-detail-actions-row">
              <button
                type="button"
                className={`transaction-detail-button ${
                  transaction.suspicious
                    ? 'transaction-detail-button--neutral'
                    : 'transaction-detail-button--warning'
                }`}
                onClick={handleToggleSuspicious}
                disabled={saving}
              >
                {transaction.suspicious
                  ? 'Unmark Suspicious'
                  : 'Mark as Suspicious'}
              </button>

              {/* Keep adjustment creation restricted if needed */}
              {user && (
                <button
                  type="button"
                  className="transaction-detail-button transaction-detail-button--primary"
                  onClick={() => setShowAdjustmentForm((v) => !v)}
                  disabled={saving}
                >
                  {showAdjustmentForm
                    ? 'Hide Adjustment Form'
                    : 'Create Adjustment'}
                </button>
              )}
            </div>

            {showAdjustmentForm && (
              <form
                className="transaction-detail-form"
                onSubmit={handleCreateAdjustment}
              >
                <div className="transaction-detail-form-field">
                  <label htmlFor="adjustmentAmount">
                    Adjustment Amount (points)
                  </label>
                  <input
                    id="adjustmentAmount"
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="transaction-detail-form-field">
                  <label htmlFor="adjustmentRemark">Remark</label>
                  <textarea
                    id="adjustmentRemark"
                    value={adjustmentRemark}
                    onChange={(e) => setAdjustmentRemark(e.target.value)}
                    required
                  />
                </div>

                <div className="transaction-detail-form-actions">
                  <button
                    type="submit"
                    className="transaction-detail-button transaction-detail-button--primary"
                    disabled={saving}
                  >
                    Save Adjustment
                  </button>
                  <button
                    type="button"
                    className="transaction-detail-button transaction-detail-button--neutral"
                    onClick={() => setShowAdjustmentForm(false)}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TransactionDetailPage;


