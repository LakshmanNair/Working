import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferPoints } from '../../api/transactionsApi';
import { searchUsersByUtorid } from '../../api/usersApi';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loader from '../../components/common/Loader';

const TransferPointsPage = () => {
  const [recipientUtorid, setRecipientUtorid] = useState('');
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLookup = async () => {
    if (!recipientUtorid) {
      setError('Please enter a UTORid');
      return;
    }

    setLookingUp(true);
    setError('');
    setRecipientInfo(null);

    try {
      // Try to find user by UTORid (this requires manager access, so may fail for regular users)
      // For regular users, we'll need to use a different approach
      const response = await searchUsersByUtorid(recipientUtorid);
      const users = response.results || response; // Handle both response formats
      if (users && Array.isArray(users) && users.length > 0) {
        // Find exact match by UTORid
        const exactMatch = users.find(u => u.utorid === recipientUtorid);
        if (exactMatch) {
          setRecipientInfo(exactMatch);
        } else {
          setError('User not found. Please check the UTORid.');
        }
      } else {
        setError('User not found. Please check the UTORid or contact support.');
      }
    } catch (err) {
      // If user lookup fails (e.g., not manager), show a message
      if (err.response?.status === 403) {
        setError('User lookup requires manager access. Please contact a manager to verify the recipient UTORid, or ensure you have the correct user ID.');
      } else {
        setError(err.response?.data?.error || 'Unable to verify recipient. Please ensure the UTORid is correct.');
      }
    } finally {
      setLookingUp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!recipientInfo) {
      setError('Please lookup the recipient first');
      return;
    }
    
    const points = parseInt(amount);
    if (points <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    
    if (user && points > user.points) {
      setError('Insufficient points');
      return;
    }

    if (!user?.verified) {
      setError('You must be verified to transfer points');
      return;
    }

    setLoading(true);
    try {
      await transferPoints(recipientInfo.id, points, remark);
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
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#555' }}>
            Recipient UTORid:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={recipientUtorid}
              onChange={(e) => {
                setRecipientUtorid(e.target.value);
                setRecipientInfo(null);
              }}
              required
              style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
            <button
              type="button"
              onClick={handleLookup}
              disabled={lookingUp || !recipientUtorid}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: lookingUp || !recipientUtorid ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: lookingUp || !recipientUtorid ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {lookingUp ? 'Looking up...' : 'Lookup'}
            </button>
          </div>
          {recipientInfo && (
            <div style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontSize: '0.875rem' }}>
              ✓ Found: {recipientInfo.name} ({recipientInfo.utorid}) - {recipientInfo.points} points
            </div>
          )}
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

