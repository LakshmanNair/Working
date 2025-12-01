import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransaction, processRedemption } from '../../api/transactionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loader from '../../components/common/Loader';

const ProcessRedemptionPage = () => {
  const [transactionId, setTransactionId] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setTransaction(null);
    
    if (!transactionId) {
      setError('Please enter a transaction ID');
      return;
    }

    setLoading(true);
    try {
      const data = await getTransaction(transactionId);
      
      if (data.type !== 'redemption') {
        setError('This transaction is not a redemption request');
        return;
      }
      
      if (data.processedBy) {
        setError('This redemption has already been processed');
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
    if (!window.confirm('Are you sure you want to process this redemption? This action cannot be undone.')) {
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      await processRedemption(transactionId);
      alert('Redemption processed successfully!');
      setTransaction(null);
      setTransactionId('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process redemption');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Process Redemption Request</h1>

      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <form onSubmit={handleLookup} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
              Transaction ID
            </label>
            <input
              type="number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter transaction ID"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: loading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Loading...' : 'Lookup'}
          </button>
        </form>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      {transaction && (
        <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#333' }}>Redemption Request Details</h2>
          
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong style={{ color: '#555' }}>Transaction ID:</strong>
              <span style={{ color: '#333' }}>#{transaction.id}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong style={{ color: '#555' }}>User:</strong>
              <span style={{ color: '#333' }}>{transaction.user?.utorid || transaction.utorid || 'N/A'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong style={{ color: '#555' }}>Amount:</strong>
              <span style={{ color: '#dc3545', fontSize: '1.25rem', fontWeight: 'bold' }}>
                {Math.abs(transaction.amount)} points
              </span>
            </div>
            
            {transaction.remark && (
              <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <strong style={{ color: '#555', display: 'block', marginBottom: '0.5rem' }}>Remark:</strong>
                <span style={{ color: '#333' }}>{transaction.remark}</span>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <strong style={{ color: '#555' }}>Created At:</strong>
              <span style={{ color: '#333' }}>
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setTransaction(null);
                setTransactionId('');
                setError('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              disabled={processing}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: processing ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: processing ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {processing ? 'Processing...' : 'Process Redemption'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessRedemptionPage;

