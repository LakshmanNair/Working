import { useState, useEffect } from 'react';
import { listPromotions } from '../../api/promotionsApi';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, upcoming

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listPromotions();
      // Backend returns { count, results: [...] }
      const promotionsArray = Array.isArray(response) ? response : (response?.results || []);
      setPromotions(promotionsArray);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch promotions');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPromotions = () => {
    const now = new Date();
    switch (filter) {
      case 'active':
        return promotions.filter(p => {
          const start = p.startTime ? new Date(p.startTime) : null;
          const end = new Date(p.endTime);
          return (!start || start <= now) && end > now;
        });
      case 'upcoming':
        return promotions.filter(p => {
          const start = p.startTime ? new Date(p.startTime) : null;
          return start && start > now;
        });
      default:
        return promotions;
    }
  };

  if (loading) return <Loader />;

  const filteredPromotions = getFilteredPromotions();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Available Promotions</h1>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #eee' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: filter === 'all' ? '#007bff' : 'transparent',
            color: filter === 'all' ? 'white' : '#666',
            border: 'none',
            borderBottom: filter === 'all' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: filter === 'all' ? '600' : '400',
            marginBottom: '-2px',
          }}
        >
          All Promotions
        </button>
        <button
          onClick={() => setFilter('active')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: filter === 'active' ? '#007bff' : 'transparent',
            color: filter === 'active' ? 'white' : '#666',
            border: 'none',
            borderBottom: filter === 'active' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: filter === 'active' ? '600' : '400',
            marginBottom: '-2px',
          }}
        >
          Active Now
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: filter === 'upcoming' ? '#007bff' : 'transparent',
            color: filter === 'upcoming' ? 'white' : '#666',
            border: 'none',
            borderBottom: filter === 'upcoming' ? '2px solid #007bff' : '2px solid transparent',
            cursor: 'pointer',
            fontWeight: filter === 'upcoming' ? '600' : '400',
            marginBottom: '-2px',
          }}
        >
          Upcoming
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      {filteredPromotions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          <p style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No promotions found</p>
          <p>Check back later for new promotions!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredPromotions.map((promo) => {
            const now = new Date();
            const start = new Date(promo.startTime);
            const end = new Date(promo.endTime);
            const isActive = start <= now && end > now;
            const isUpcoming = start > now;
            
            return (
              <div
                key={promo.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backgroundColor: '#fff',
                  boxShadow: isActive ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isActive ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, color: '#333', fontSize: '1.25rem' }}>{promo.name}</h3>
                  <span
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: isActive ? '#28a745' : isUpcoming ? '#ffc107' : '#6c757d',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Expired'}
                  </span>
                </div>
                
                <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {promo.description}
                </p>
                
                <div style={{ 
                  padding: '1rem', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}>
                  <div style={{ fontSize: '0.875rem', color: '#555', marginBottom: '0.75rem', fontWeight: '600' }}>
                    Promotion Benefits:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {promo.minSpending && (
                      <div style={{ fontSize: '0.875rem', color: '#333' }}>
                        💰 Minimum spending: <strong>${promo.minSpending.toFixed(2)}</strong>
                      </div>
                    )}
                    {promo.rate && (
                      <div style={{ fontSize: '0.875rem', color: '#333' }}>
                        📈 Rate bonus: <strong>{(promo.rate * 100).toFixed(0)}%</strong>
                      </div>
                    )}
                    {promo.points && (
                      <div style={{ fontSize: '0.875rem', color: '#333' }}>
                        ⭐ Fixed bonus: <strong>{promo.points} points</strong>
                      </div>
                    )}
                    <div style={{ fontSize: '0.875rem', color: '#333' }}>
                      🎫 Type: <strong>{promo.type === 'automatic' ? 'Automatic' : 'One-Time'}</strong>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  paddingTop: '1rem', 
                  borderTop: '1px solid #eee',
                  fontSize: '0.875rem',
                  color: '#666',
                }}>
                  <div style={{ marginBottom: '0.25rem' }}>
                    <strong>Starts:</strong> {new Date(promo.startTime).toLocaleString()}
                  </div>
                  <div>
                    <strong>Ends:</strong> {new Date(promo.endTime).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;

