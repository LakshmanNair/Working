import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchase } from '../../api/transactionsApi';
import { listPromotions } from '../../api/promotionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';
import './CreateTransactionPage.css';

const CreateTransactionPage = () => {
  // Cashiers only create purchases
  const [utorid, setUtorid] = useState('');
  const [spent, setSpent] = useState('');
  const [promotionIds, setPromotionIds] = useState([]);
  const [remark, setRemark] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [promotions, setPromotions] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setPromoLoading(true);
    try {
      const response = await listPromotions();
      const allPromotions = Array.isArray(response) ? response : (response?.results || []);
      
      // Filter for active promotions only
      const now = new Date();
      setPromotions(allPromotions.filter(p => {
        const start = p.startTime ? new Date(p.startTime) : null;
        const end = new Date(p.endTime);
        return (!start || start <= now) && end > now;
      }));
    } catch (err) {
      console.error('Failed to fetch promotions:', err);
    } finally {
      setPromoLoading(false);
    }
  };

  const togglePromotion = (id) => {
    setPromotionIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const spentFloat = parseFloat(spent);
      if (isNaN(spentFloat) || spentFloat <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }

      await createPurchase({
        utorid: utorid.trim(),
        spent: spentFloat,
        promotionIds: promotionIds.length > 0 ? promotionIds : null,
        remark: remark.trim(),
      });
      
      setSuccess('Transaction created successfully!');
      
      // Reset form
      setUtorid('');
      setSpent('');
      setPromotionIds([]);
      setRemark('');
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Transaction creation failed');
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="create-transaction-page">
    <div className="create-transaction-card">
      <h1 className="create-transaction-title">Create Transaction</h1>
      <p className="create-transaction-subtitle">
        Record a customer purchase to award points.
      </p>

      {error && (
        <div className="create-transaction-alert create-transaction-alert--error">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}

      {success && (
        <div className="create-transaction-alert create-transaction-alert--success">
          {success}
        </div>
      )}

      <form className="create-transaction-form" onSubmit={handleSubmit}>
        <div className="create-transaction-field">
          <label htmlFor="utorid">Customer UTORid</label>
          <input
            id="utorid"
            type="text"
            value={utorid}
            onChange={(e) => setUtorid(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="create-transaction-field">
          <label htmlFor="spent">Amount spent ($)</label>
          <input
            id="spent"
            type="number"
            min="0.01"
            step="0.01"
            value={spent}
            onChange={(e) => setSpent(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="create-transaction-field">
          <label>Apply promotions (optional)</label>
          {promoLoading ? (
            <span>Loading promotions…</span>
          ) : promotions.length === 0 ? (
            <span>No active promotions available.</span>
          ) : (
            <div className="create-transaction-promotions">
              {promotions.map((promo) => (
                <label
                  key={promo.id}
                  className="create-transaction-promotion-item"
                >
                  <input
                    type="checkbox"
                    checked={promotionIds.includes(promo.id)}
                    onChange={() => togglePromotion(promo.id)}
                    disabled={loading}
                  />
                  <span>
                    <strong>{promo.name}</strong> –{' '}
                    {promo.points
                      ? `${promo.points} points`
                      : `${promo.rate}% back`}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="create-transaction-field">
          <label htmlFor="remark">Remark (optional)</label>
          <textarea
            id="remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="create-transaction-actions">
          <button
            type="submit"
            className="create-transaction-submit-button"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create Transaction'}
          </button>
          <button
            type="button"
            className="create-transaction-secondary-button"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export default CreateTransactionPage;