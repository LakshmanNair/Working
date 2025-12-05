// frontend/src/pages/me/TransferPointsPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { transferPoints } from '../../api/transactionsApi';
import { searchUsersByUtorid } from '../../api/usersApi';
import { useAuth } from '../../hooks/useAuth';
import ErrorMessage from '../../components/common/ErrorMessage';
import Loader from '../../components/common/Loader';

import './TransferPointsPage.css';

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
      const response = await searchUsersByUtorid(recipientUtorid);
      const users = response.results || response;

      if (users && Array.isArray(users) && users.length > 0) {
        const exactMatch = users.find((u) => u.utorid === recipientUtorid);
        if (exactMatch) {
          setRecipientInfo(exactMatch);
        } else {
          setError('User not found. Please check the UTORid.');
        }
      } else {
        setError('User not found. Please check the UTORid or contact support.');
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError(
          'User lookup requires manager access. Please contact a manager to verify the recipient UTORid, or ensure you have the correct user ID.',
        );
      } else {
        setError(
          err.response?.data?.error ||
            'Unable to verify recipient. Please ensure the UTORid is correct.',
        );
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

    const points = parseInt(amount, 10);

    if (Number.isNaN(points) || points <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (user && points > (user.points || 0)) {
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
      setAmount('');
      setRemark('');
      // Keep recipient so user sees confirmation for that person
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
    <div className="transfer-page">
      <div className="transfer-card">
        <h1 className="transfer-title">Transfer Points</h1>
        <p className="transfer-subtitle">
          Your current balance:{' '}
          <span className="transfer-balance-strong">
            {user?.points || 0} points
          </span>
        </p>

        {error && (
          <div className="transfer-alert transfer-alert--error">
            <ErrorMessage message={error} />
          </div>
        )}

        {success && (
          <div className="transfer-alert transfer-alert--success">
            Points transferred successfully! Redirecting to your transactions…
          </div>
        )}

        <form className="transfer-form" onSubmit={handleSubmit}>
          <div className="transfer-form-field">
            <label htmlFor="recipientUtorid">Recipient UTORid</label>
            <div className="transfer-lookup-row">
              <input
                id="recipientUtorid"
                type="text"
                value={recipientUtorid}
                onChange={(e) => setRecipientUtorid(e.target.value)}
                disabled={loading || lookingUp}
                required
              />
              <button
                type="button"
                className="transfer-button transfer-button--secondary"
                onClick={handleLookup}
                disabled={loading || lookingUp}
              >
                {lookingUp ? 'Looking up…' : 'Lookup'}
              </button>
            </div>
            {lookingUp && <Loader />}
            {recipientInfo && (
              <p className="transfer-recipient-info">
                Sending to{' '}
                <strong>{recipientInfo.utorid}</strong>
                {recipientInfo.email ? ` (${recipientInfo.email})` : ''}
              </p>
            )}
          </div>

          <div className="transfer-form-field">
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

          <div className="transfer-form-field">
            <label htmlFor="remark">Remark (optional)</label>
            <textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="transfer-actions">
            <button
              type="submit"
              className="transfer-button transfer-button--primary"
              disabled={loading || lookingUp}
            >
              {loading ? 'Transferring…' : 'Transfer Points'}
            </button>
            <button
              type="button"
              className="transfer-button transfer-button--secondary"
              onClick={() => navigate(-1)}
              disabled={loading || lookingUp}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferPointsPage;


