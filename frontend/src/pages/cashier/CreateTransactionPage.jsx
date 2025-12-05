import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPurchase } from '../../api/transactionsApi';
import { listPromotions } from '../../api/promotionsApi';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../App.css'; 

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
    <div className="page-container">
      <div className="page-header">
        <h1>New Purchase</h1>
        <p style={{ color: '#6c757d', marginTop: '0.5rem' }}>
          Record a customer purchase to award points.
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
      
      {success && (
        <div className="info-box" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb' }}>
          <div className="info-box-title" style={{ color: '#155724' }}>Success</div>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Customer UTORid <span className="required">*</span></label>
              <input
                type="text"
                value={utorid}
                onChange={(e) => setUtorid(e.target.value)}
                required
                className="input-field"
                placeholder="e.g. smithj"
              />
            </div>

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
        </div>

        <div className="form-section">
          <label className="field-label">Apply Promotions</label>
          <div className="field-help" style={{ marginBottom: '1rem' }}>
            Select any active promotions that apply to this purchase.
          </div>
          
          {promoLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Loading promotions...</div>
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
                      onChange={() => {}} 
                      style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: '3px' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#333' }}>{promo.name}</span>
                      {promo.minSpending && (
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>
                          Min Spend: ${promo.minSpending}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="info-box">No active promotions available at this time.</div>
          )}
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="field-label">Remarks (Optional)</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="textarea-field"
              placeholder="Add internal notes..."
              rows="2"
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ minWidth: '200px' }}
          >
            {loading ? 'Processing...' : 'Complete Purchase'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateTransactionPage;