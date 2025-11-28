import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferPoints } from '../../api/transactionsApi';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';

const TransferPointsPage = () => {
  const [recipientUtorid, setRecipientUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
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
      // First, we need to get the user ID from UTORid
      // For now, assuming the API accepts UTORid or we need to look it up
      // This is a simplified version - you may need to adjust based on your API
      await transferPoints(recipientUtorid, points, remark);
      setSuccess(true);
      setTimeout(() => {
        navigate('/me/transactions');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Transfer Points</h1>
      <p>Your current balance: <strong>{user?.points || 0} points</strong></p>
      
      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      {success && (
        <div style={{ padding: '1rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', marginBottom: '1rem' }}>
          Transfer successful! Redirecting...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Recipient UTORid:
            <input
              type="text"
              value={recipientUtorid}
              onChange={(e) => setRecipientUtorid(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </label>
        </div>

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
          disabled={loading || success}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || success ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Transferring...' : success ? 'Success!' : 'Transfer Points'}
        </button>
      </form>
    </div>
  );
};

export default TransferPointsPage;

