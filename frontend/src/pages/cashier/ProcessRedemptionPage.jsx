import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTransaction,
  processRedemption,
} from '../../api/transactionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';
import './ProcessRedemptionPage.css'; // new import

const ProcessRedemptionPage = () => {
  const [transactionId, setTransactionId] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setTransaction(null);

    if (!transactionId) {
      setError('Please enter a transaction ID');
      return;
    }

    setLoading(true);
    try {
      const data = await getTransaction(transactionId);

      if (data.type !== 'redemption') {
        setError('This transaction is NOT a redemption request.');
        return;
      }

      if (data.processedBy) {
        setError(
          `This request was already processed by a different User ID: ${data.processedBy}.`,
        );
        return;
      }

      setTransaction(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Transaction not found');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (
      !window.confirm(
        'Confirm redemption? This will deduct points from the user.',
      )
    ) {
      return;
    }

    setProcessing(true);
    setError('');
    try {
      await processRedemption(transactionId);
      setSuccess('Redemption processed successfully!');
      setTransaction(null);
      setTransactionId('');
    } catch (err) {
      setError(
        err.response?.data?.error || 'Failed to process redemption',
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="process-redemption-page">
      <div className="process-redemption-card">
        <h1 className="process-redemption-title">
          Process Redemption Request
        </h1>
        <p className="process-redemption-subtitle">
          Scan or enter a Transaction ID to fulfill a redemption request.
        </p>

        {error && (
          <div className="process-redemption-alert process-redemption-alert--error">
            <ErrorMessage message={error} onDismiss={() => setError('')} />
          </div>
        )}

        {success && (
          <div className="process-redemption-alert process-redemption-alert--success">
            {success}
          </div>
        )}

        <form
          className="process-redemption-form"
          onSubmit={handleLookup}
        >
          <div className="process-redemption-field">
            <label htmlFor="transactionId">Transaction ID</label>
            <input
              id="transactionId"
              type="number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              disabled={loading || processing}
              required
            />
          </div>

          <div className="process-redemption-actions">
            <button
              type="submit"
              className="process-redemption-button-primary"
              disabled={loading || processing}
            >
              {loading ? 'Looking up…' : 'Lookup'}
            </button>
            <button
              type="button"
              className="process-redemption-button-secondary"
              onClick={() => navigate(-1)}
              disabled={loading || processing}
            >
              Back
            </button>
          </div>

          {loading && (
            <div className="process-redemption-loading">
              Loading transaction…
            </div>
          )}
        </form>

        {transaction && (
          <div className="process-redemption-details">
            <h2 className="process-redemption-details-title">
              Redemption details
            </h2>
            <p className="process-redemption-detail-row">
              <span className="process-redemption-detail-label">
                User:
              </span>{' '}
              {transaction.userName || transaction.utorid}
            </p>
            <p className="process-redemption-detail-row">
              <span className="process-redemption-detail-label">
                Amount:
              </span>{' '}
              {transaction.amount} points
            </p>
            {transaction.remark && (
              <p className="process-redemption-detail-row">
                <span className="process-redemption-detail-label">
                  Remark:
                </span>{' '}
                {transaction.remark}
              </p>
            )}
            <p className="process-redemption-detail-row">
              <span className="process-redemption-detail-label">
                Created at:
              </span>{' '}
              {new Date(transaction.createdAt).toLocaleString()}
            </p>

            <div className="process-redemption-actions" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="process-redemption-button-primary"
                onClick={handleProcess}
                disabled={processing}
              >
                {processing ? 'Processing…' : 'Confirm Redemption'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessRedemptionPage;
