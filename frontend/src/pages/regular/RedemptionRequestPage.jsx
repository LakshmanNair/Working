import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRedemption } from '../../api/transactionsApi';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';

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
    
    const points = parseInt(amount);
    if (points <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    if (user && points > user.points) {
      setError('Insufficient points');
      return;
    }

    setLoading(true);
    try {
      const result = await createRedemption({
        type: 'redemption', 
        amount: -Math.abs(points),
        remark,
      });
      setTransactionId(result.id);    } catch (err) {
      setError(err.response?.data?.error || 'Redemption request failed');
    } finally {
      setLoading(false);
    }
  };

  if (transactionId) {
    return (
      <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem', textAlign: 'center' }}>
        <h1>Redemption Request Created</h1>
        <p>Your redemption request has been created successfully!</p>
        <button
          onClick={() => navigate(`/me/redemption/${transactionId}/qr`)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem',
          }}
        >
          View QR Code
        </button>
        <button
          onClick={() => navigate('/me/transactions')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem',
            marginLeft: '1rem',
          }}
        >
          Back to Transactions
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Create Redemption Request</h1>
      <p>Your current balance: <strong>{user?.points || 0} points</strong></p>
      
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Amount (points):
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              max={user?.points || 0}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Remark (optional):
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', minHeight: '80px' }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating...' : 'Create Redemption Request'}
        </button>
      </form>
    </div>
  );
};

export default RedemptionRequestPage;

