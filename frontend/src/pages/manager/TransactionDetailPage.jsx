import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTransaction, toggleSuspicious, createAdjustment } from '../../api/transactionsApi';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

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
    if (!window.confirm(`Are you sure you want to ${transaction.suspicious ? 'unmark' : 'mark'} this transaction as suspicious?`)) {
      return;
    }

    try {
      await toggleSuspicious(id, !transaction.suspicious);
      setTransaction(prev => ({ ...prev, suspicious: !prev.suspicious }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update suspicious flag');
    }
  };

  const handleCreateAdjustment = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await createAdjustment({
        utorid: transaction.user?.utorid || transaction.utorid,
        amount: parseInt(adjustmentAmount),
        relatedId: parseInt(id),
        remark: adjustmentRemark,
      });
      alert('Adjustment created successfully!');
      setShowAdjustmentForm(false);
      setAdjustmentAmount('');
      setAdjustmentRemark('');
      fetchTransaction(); // Refresh to see updated user points
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  };

  const getTypeColor = (type) => {
    const colors = {
      purchase: '#28a745',
      redemption: '#dc3545',
      transfer: '#007bff',
      adjustment: '#ffc107',
      event: '#6f42c1',
    };
    return colors[type] || '#6c757d';
  };

  if (loading) return <Loader />;
  if (error && !transaction) return <ErrorMessage message={error} />;
  if (!transaction) return null;

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#333' }}>Transaction Details</h1>
        <button
          onClick={() => navigate('/manager/transactions')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Back to List
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Transaction ID</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#333' }}>#{transaction.id}</div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Type</div>
            <span
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                backgroundColor: getTypeColor(transaction.type),
                color: 'white',
                borderRadius: '4px',
                fontSize: '0.875rem',
                fontWeight: '500',
              }}
            >
              {transaction.type.toUpperCase()}
            </span>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Amount</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: transaction.amount >= 0 ? '#28a745' : '#dc3545' }}>
              {transaction.amount >= 0 ? '+' : ''}{transaction.amount} points
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Status</div>
            <div>
              {transaction.suspicious ? (
                <span style={{ color: '#dc3545', fontWeight: '500' }}>⚠️ Suspicious</span>
              ) : (
                <span style={{ color: '#28a745', fontWeight: '500' }}>✓ Normal</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>Details</h3>
          
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <strong style={{ color: '#555' }}>User:</strong>{' '}
              <span style={{ color: '#333' }}>{transaction.user?.utorid || transaction.utorid || 'N/A'}</span>
            </div>
            
            {transaction.spent !== null && transaction.spent !== undefined && (
              <div>
                <strong style={{ color: '#555' }}>Amount Spent:</strong>{' '}
                <span style={{ color: '#333' }}>${transaction.spent.toFixed(2)}</span>
              </div>
            )}

            {transaction.createdBy && (
              <div>
                <strong style={{ color: '#555' }}>Created By:</strong>{' '}
                <span style={{ color: '#333' }}>{transaction.createdBy.utorid || transaction.createdBy}</span>
              </div>
            )}

            {transaction.processedBy && (
              <div>
                <strong style={{ color: '#555' }}>Processed By:</strong>{' '}
                <span style={{ color: '#333' }}>{transaction.processedBy.utorid || transaction.processedBy}</span>
              </div>
            )}

            {transaction.relatedId && (
              <div>
                <strong style={{ color: '#555' }}>Related Transaction:</strong>{' '}
                <button
                  onClick={() => navigate(`/manager/transactions/${transaction.relatedId}`)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  #{transaction.relatedId}
                </button>
              </div>
            )}

            {transaction.promotionIds && transaction.promotionIds.length > 0 && (
              <div>
                <strong style={{ color: '#555' }}>Promotions:</strong>{' '}
                <span style={{ color: '#333' }}>
                  {transaction.promotionIds.map((pid, idx) => (
                    <span key={pid}>
                      #{pid}
                      {idx < transaction.promotionIds.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {transaction.remark && (
              <div>
                <strong style={{ color: '#555' }}>Remark:</strong>{' '}
                <span style={{ color: '#333' }}>{transaction.remark}</span>
              </div>
            )}

            <div>
              <strong style={{ color: '#555' }}>Created At:</strong>{' '}
              <span style={{ color: '#333' }}>
                {new Date(transaction.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>Actions</h3>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleToggleSuspicious}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: transaction.suspicious ? '#28a745' : '#ffc107',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {transaction.suspicious ? 'Unmark as Suspicious' : 'Mark as Suspicious'}
          </button>

          <button
            onClick={() => setShowAdjustmentForm(!showAdjustmentForm)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {showAdjustmentForm ? 'Cancel Adjustment' : 'Create Adjustment'}
          </button>
        </div>

        {showAdjustmentForm && (
          <form onSubmit={handleCreateAdjustment} style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Create Adjustment</h4>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Adjustment Amount (points)
              </label>
              <input
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
              <small style={{ color: '#666' }}>Positive for credit, negative for debit</small>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Remark
              </label>
              <textarea
                value={adjustmentRemark}
                onChange={(e) => setAdjustmentRemark(e.target.value)}
                rows="3"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: saving ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Creating...' : 'Create Adjustment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TransactionDetailPage;

