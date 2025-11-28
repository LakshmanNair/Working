import { useState, useEffect } from 'react';
import { listMyTransactions } from '../../api/transactionsApi';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const MyTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', minAmount: '', maxAmount: '' });

  useEffect(() => {
    fetchTransactions();
  }, [page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')),
      };
      const data = await listMyTransactions(params);
      if (page === 1) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
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

  if (loading && transactions.length === 0) return <Loader />;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>My Transactions</h1>
      
      {/* Filters */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          style={{ padding: '0.5rem' }}
        >
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="redemption">Redemption</option>
          <option value="transfer">Transfer</option>
          <option value="adjustment">Adjustment</option>
          <option value="event">Event</option>
        </select>
        
        <input
          type="number"
          placeholder="Min Amount"
          value={filters.minAmount}
          onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
          style={{ padding: '0.5rem' }}
        />
        
        <input
          type="number"
          placeholder="Max Amount"
          value={filters.maxAmount}
          onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
          style={{ padding: '0.5rem' }}
        />
        
        <button
          onClick={() => {
            setFilters({ type: '', minAmount: '', maxAmount: '' });
            setPage(1);
          }}
          style={{ padding: '0.5rem 1rem' }}
        >
          Clear
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#f9f9f9',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span
                  style={{
                    backgroundColor: getTypeColor(tx.type),
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    marginRight: '0.5rem',
                  }}
                >
                  {tx.type.toUpperCase()}
                </span>
                <strong>Amount: {tx.amount} points</strong>
                {tx.spent && <span style={{ marginLeft: '1rem' }}>Spent: ${tx.spent}</span>}
              </div>
              <div style={{ color: '#666', fontSize: '0.875rem' }}>
                {new Date(tx.createdAt).toLocaleString()}
              </div>
            </div>
            {tx.remark && (
              <div style={{ marginTop: '0.5rem', color: '#666' }}>{tx.remark}</div>
            )}
          </div>
        ))}
      </div>

      {transactions.length > 0 && (
        <button
          onClick={() => setPage(page + 1)}
          disabled={loading}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
};

export default MyTransactionsPage;

