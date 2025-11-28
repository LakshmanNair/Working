import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchase, createAdjustment } from '../../api/transactionsApi';
import { listPromotions } from '../../api/promotionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';

const CreateTransactionPage = () => {
  const [type, setType] = useState('purchase');
  const [utorid, setUtorid] = useState('');
  const [spent, setSpent] = useState('');
  const [amount, setAmount] = useState('');
  const [relatedId, setRelatedId] = useState('');
  const [promotionIds, setPromotionIds] = useState([]);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promotions, setPromotions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const data = await listPromotions();
      setPromotions(data.filter(p => {
        const now = new Date();
        return new Date(p.startTime) <= now && new Date(p.endTime) > now;
      }));
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'purchase') {
        await createPurchase({
          utorid,
          spent: parseFloat(spent),
          promotionIds: promotionIds.length > 0 ? promotionIds : null,
          remark,
        });
      } else {
        await createAdjustment({
          utorid,
          amount: parseInt(amount),
          relatedId: relatedId ? parseInt(relatedId) : null,
          remark,
        });
      }
      navigate('/cashier/transactions/new');
      alert('Transaction created successfully!');
      // Reset form
      setUtorid('');
      setSpent('');
      setAmount('');
      setRelatedId('');
      setPromotionIds([]);
      setRemark('');
    } catch (err) {
      setError(err.response?.data?.error || 'Transaction creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '2rem' }}>
      <h1>Create Transaction</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <label>
          Transaction Type:
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ padding: '0.5rem', marginLeft: '0.5rem' }}
          >
            <option value="purchase">Purchase</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </label>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Customer UTORid:
            <input
              type="text"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
            />
          </label>
        </div>

        {type === 'purchase' ? (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                Amount Spent ($):
                <input
                  type="number"
                  step="0.01"
                  value={spent}
                  onChange={(e) => setSpent(e.target.value)}
                  required
                  min="0.01"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </label>
            </div>

            {promotions.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <label>
                  Promotions (optional):
                  <div style={{ marginTop: '0.5rem' }}>
                    {promotions.map((promo) => (
                      <label key={promo.id} style={{ display: 'block', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={promotionIds.includes(promo.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPromotionIds([...promotionIds, promo.id]);
                            } else {
                              setPromotionIds(promotionIds.filter(id => id !== promo.id));
                            }
                          }}
                        />
                        {promo.name} ({promo.type})
                      </label>
                    ))}
                  </div>
                </label>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label>
                Adjustment Amount (points):
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </label>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label>
                Related Transaction ID (optional):
                <input
                  type="number"
                  value={relatedId}
                  onChange={(e) => setRelatedId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </label>
            </div>
          </>
        )}

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
          {loading ? 'Creating...' : 'Create Transaction'}
        </button>
      </form>
    </div>
  );
};

export default CreateTransactionPage;

