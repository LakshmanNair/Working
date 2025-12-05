import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransaction, processRedemption } from '../../api/transactionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../App.css';

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
        setError(`This request was already processed by a different User ID: ${data.processedBy}.`);
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
    if (!window.confirm('Confirm redemption? This will deduct points from the user.')) {
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
      setError(err.response?.data?.error || 'Failed to process redemption');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Process Redemption</h1>
        <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>
          Scan or enter a Transaction ID to fulfill a redemption request.
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      
      {success && (
        <div className="info-box" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb' }}>
          <div className="info-box-title" style={{ color: '#155724' }}>Success</div>
          {success}
        </div>
      )}

      {/* Lookup Section */}
      <div className="form-card">
        <form onSubmit={handleLookup} className="form-row" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="field-label">Transaction ID</label>
            <input
              type="number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 45"
              required
              className="input-field"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ marginBottom: '2px' }}
          >
            {loading ? 'Searching...' : 'Lookup Request'}
          </button>
        </form>
      </div>

      {/* Result Section */}
      {transaction && (
        <div className="form-card" style={{ borderLeft: '4px solid #28a745' }}>
          <div className="form-section">
            <h3 style={{ marginTop: 0, color: '#28a745' }}>Request Validated</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>
              <div>
                <label className="field-label">User</label>
                <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>
                  {transaction.user?.utorid || transaction.utorid || 'Unknown'}
                </div>
              </div>
              <div>
                <label className="field-label">Redemption Amount</label>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc3545' }}>
                  {Math.abs(transaction.amount)} Points
                </div>
              </div>
              <div>
                <label className="field-label">Request Date</label>
                <div>{new Date(transaction.createdAt).toLocaleString()}</div>
              </div>
              {transaction.remark && (
                <div>
                  <label className="field-label">User Remark</label>
                  <div style={{ fontStyle: 'italic', color: '#666' }}>"{transaction.remark}"</div>
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={() => {
                setTransaction(null);
                setTransactionId('');
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={processing}
              className="btn btn-success" // Using success color for the final action
            >
              {processing ? 'Processing...' : 'Approve & Deduct Points'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessRedemptionPage;