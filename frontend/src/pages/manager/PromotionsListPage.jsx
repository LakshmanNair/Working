import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPromotions, deletePromotion } from '../../api/promotionsApi';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const PromotionsListPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listPromotions();
      // FIX: Access data.results because the API returns { count, results }
      setPromotions(data.results || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) return;
    
    try {
      await deletePromotion(id);
      setPromotions(promotions.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete promotion');
    }
  };

  if (loading) return <Loader />;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Promotions</h1>
        <button
          onClick={() => navigate('/manager/promotions/new')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Create Promotion
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {promotions.map((promo) => {
          const now = new Date();
          const start = new Date(promo.startTime);
          const end = new Date(promo.endTime);
          const isActive = start <= now && end > now;
          
          return (
            <div
              key={promo.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1.5rem',
                backgroundColor: isActive ? '#f0f9ff' : '#f9f9f9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{promo.name}</h3>
                <span
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: isActive ? '#28a745' : '#6c757d',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                  }}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <p style={{ color: '#666', marginBottom: '1rem' }}>{promo.description}</p>
              
              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <div><strong>Type:</strong> {promo.type}</div>
                {promo.minSpending && <div><strong>Min Spending:</strong> ${promo.minSpending}</div>}
                {promo.rate && <div><strong>Rate Bonus:</strong> {promo.rate * 100}%</div>}
                {promo.points && <div><strong>Bonus Points:</strong> {promo.points}</div>}
                <div><strong>Start:</strong> {new Date(promo.startTime).toLocaleString()}</div>
                <div><strong>End:</strong> {new Date(promo.endTime).toLocaleString()}</div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => navigate(`/manager/promotions/${promo.id}/edit`)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PromotionsListPage;