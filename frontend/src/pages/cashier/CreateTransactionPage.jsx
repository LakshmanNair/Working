import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchase, createAdjustment } from '../../api/transactionsApi';
import { listPromotions } from '../../api/promotionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../App.css'; // Ensure CSS is imported

const CreateTransactionPage = () => {
  const [type, setType] = useState('purchase');
  const [utorid, setUtorid] = useState('');
  const [spent, setSpent] = useState('');
  const [amount, setAmount] = useState('');
  const [relatedId, setRelatedId] = useState('');
  const [promotionIds, setPromotionIds] = useState([]);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState('');
  const [promotions, setPromotions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (type === 'purchase') {
      fetchPromotions();
    }
  }, [type]);

  const fetchPromotions = async () => {
    setPromoLoading(true);
    try {
      const response = await listPromotions();
      const allPromotions = Array.isArray(response) ? response : (response?.results || []);
      
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
      
      // Navigate immediately, don't use alert in modern apps
      navigate('/cashier/transactions/new', { replace: true });
      // Ideally, show a Toast notification here via a context
    } catch (err) {
      setError(err.response?.data?.error || 'Transaction creation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Process Transaction</h1>
      </div>
      
      {/* Modern Toggle Switch for Type */}
      <div className="type-selector">
        <div 
          className={`type-option ${type === 'purchase' ? 'active' : ''}`}
          onClick={() => setType('purchase')}
        >
          Purchase
        </div>
        <div 
          className={`type-option ${type === 'adjustment' ? 'active' : ''}`}
          onClick={() => setType('adjustment')}
        >
          Adjustment / Refund
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-row">
          <div className="form-group">
            <label className="field-label">Customer UTORid <span className="required">*</span></label>
            <input
              type="text"
              value={utorid}
              onChange={(e) => setUtorid(e.target.value)}
              required
              className="input-field"
              placeholder="e.g., smithj"
            />
          </div>
        </div>

        {type === 'purchase' ? (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="field-label">Amount Spent ($) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={spent}
                  onChange={(e) => setSpent(e.target.value)}
                  required
                  min="0.01"
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="form-section">
              <label className="field-label">Active Promotions</label>
              {promoLoading ? (
                <div className="field-help">Loading promotions...</div>
              ) : promotions.length > 0 ? (
                <div className="promotions-grid">
                  {promotions.map((promo) => {
                    const isSelected = promotionIds.includes(promo.id);
                    return (
                      <div 
                        key={promo.id} 
                        className={`promo-checkbox-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => togglePromotion(promo.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by div click
                          style={{ cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.9rem' }}>{promo.name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="field-help">No active promotions available at this time.</div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="form-row">
              <div className="form-group">
                <label className="field-label">Points Adjustment <span className="required">*</span></label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="input-field"
                  placeholder="e.g., -500 for refund, 100 for credit"
                />
                <div className="field-help">Negative values deduct points, positive values add points.</div>
              </div>

              <div className="form-group">
                <label className="field-label">Related Transaction ID</label>
                <input
                  type="number"
                  value={relatedId}
                  onChange={(e) => setRelatedId(e.target.value)}
                  className="input-field"
                  placeholder="Optional"
                />
              </div>
            </div>
          </>
        )}

        <div className="form-row full-width">
          <div className="form-group">
            <label className="field-label">Remarks</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="textarea-field"
              placeholder="Add any internal notes about this transaction..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%' }} // Full width for this page looks better
          >
            {loading ? 'Processing...' : type === 'purchase' ? 'Complete Purchase' : 'Process Adjustment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTransactionPage;