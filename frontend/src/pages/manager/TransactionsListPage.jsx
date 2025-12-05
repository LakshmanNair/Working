// frontend/src/pages/manager/TransactionsListPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { listTransactions } from '../../api/transactionsApi';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

import './TransactionsListPage.css';

const TRANSACTION_TYPES = ['', 'adjustment', 'transfer'];

const TransactionsListPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', suspicious: '' });

  const navigate = useNavigate();

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '')
        ),
      };

      const data = await listTransactions(params);
      const results = data.results || [];

      if (page === 1) {
        setTransactions(results);
      } else {
        setTransactions((prev) => [...prev, ...results]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field) => (e) => {
    const value = e.target.value;
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters({ type: '', suspicious: '' });
  };

  const handleView = (id) => {
    navigate(`/manager/transactions/${id}`);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return Number.isNaN(d.getTime()) ? 'Invalid Date' : d.toLocaleString();
  };

  return (
    <div className="transactions-page">
      <div className="transactions-card">
        <header className="transactions-header">
          <h1 className="transactions-title">All Transactions (Manager)</h1>
          <p className="transactions-subtitle">
            Manager view of all point transactions with filters and pagination.
          </p>

          {/* New Filters label */}
          <p className="transactions-filters-title">Filters</p>

          <div className="transactions-filters">
            <div className="transactions-filter-field">
              <label htmlFor="typeFilter">Type</label>
              <select
                id="typeFilter"
                value={filters.type}
                onChange={handleFilterChange('type')}
              >
                <option value="">All Types</option>
                {TRANSACTION_TYPES.filter(Boolean).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="transactions-filter-field">
              <label htmlFor="suspiciousFilter">Suspicious</label>
              <select
                id="suspiciousFilter"
                value={filters.suspicious}
                onChange={handleFilterChange('suspicious')}
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="transactions-filter-actions">
              <button
                type="button"
                className="transactions-button transactions-button--ghost"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </header>


        {error && (
          <div className="transactions-alert transactions-alert--error">
            <ErrorMessage message={error} />
          </div>
        )}

        <section className="transactions-section">
          <h2 className="transactions-section-title">Results</h2>

          {loading && transactions.length === 0 ? (
            <Loader />
          ) : transactions.length === 0 ? (
            <div className="transactions-empty">No transactions found.</div>
          ) : (
            <div className="transactions-table-wrapper">
              <table className="transactions-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Suspicious</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.id}</td>
                      <td>{tx.type}</td>
                      <td>{tx.utorid || tx.user?.utorid || 'N/A'}</td>
                      <td>{tx.amount} pts</td>
                      <td>{formatDate(tx.createdAt)}</td>
                      <td>{tx.suspicious ? 'Yes' : 'No'}</td>
                      <td>
                        <button
                          type="button"
                          className="transactions-link"
                          onClick={() => handleView(tx.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="transactions-footer">
          <span className="transactions-footer-left">
            Showing {transactions.length} transaction
            {transactions.length !== 1 && 's'}
          </span>
          <div className="transactions-footer-buttons">
            <button
              type="button"
              className="transactions-button transactions-button--ghost"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={loading}
            >
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsListPage;
