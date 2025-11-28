import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTransactions } from '../../api/transactionsApi';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const TransactionsListPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', suspicious: '' });
  const navigate = useNavigate();

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
      const data = await listTransactions(params);
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

  if (loading && transactions.length === 0) return <Loader />;

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>All Transactions</h1>
      
      {/* Filters */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select
          value={filters.type}
          onChange={(e) => {
            setFilters({ ...filters, type: e.target.value });
            setPage(1);
          }}
          style={{ padding: '0.5rem' }}
        >
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="redemption">Redemption</option>
          <option value="transfer">Transfer</option>
          <option value="adjustment">Adjustment</option>
          <option value="event">Event</option>
        </select>
        
        <select
          value={filters.suspicious}
          onChange={(e) => {
            setFilters({ ...filters, suspicious: e.target.value });
            setPage(1);
          }}
          style={{ padding: '0.5rem' }}
        >
          <option value="">All</option>
          <option value="true">Suspicious</option>
          <option value="false">Not Suspicious</option>
        </select>
        
        <button
          onClick={() => {
            setFilters({ type: '', suspicious: '' });
            setPage(1);
          }}
          style={{ padding: '0.5rem 1rem' }}
        >
          Clear Filters
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>User</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Amount</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Date</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Suspicious</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{tx.id}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{tx.type}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{tx.user?.utorid || 'N/A'}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{tx.amount} pts</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  {new Date(tx.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  {tx.suspicious ? '⚠️ Yes' : 'No'}
                </td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <button
                    onClick={() => navigate(`/manager/transactions/${tx.id}`)}
                    style={{ padding: '0.25rem 0.5rem', cursor: 'pointer' }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default TransactionsListPage;

