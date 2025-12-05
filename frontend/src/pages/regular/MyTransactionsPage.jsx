// frontend/src/pages/me/MyTransactionsPage.jsx
import { useState, useEffect } from 'react';
import { listMyTransactions } from '../../api/transactionsApi';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

import './MyTransactionsPage.css';

const MyTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: '',
    minAmount: '',
    maxAmount: '',
  });

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.type, filters.minAmount, filters.maxAmount]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: 20,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== ''),
        ),
      };

      const response = await listMyTransactions(params);

      const transactionsArray = Array.isArray(response)
        ? response
        : Array.isArray(response?.results)
        ? response.results
        : [];

      if (response && typeof response.count === 'number') {
        setTotalCount(response.count);
      } else if (page === 1) {
        setTotalCount(transactionsArray.length);
      }

      if (page === 1) {
        setTransactions(transactionsArray);
      } else {
        setTransactions((prev) => [...prev, ...transactionsArray]);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching transactions:', err);
      setError(err.response?.data?.error || 'Failed to fetch transactions');

      if (page === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClearFilters = () => {
    setPage(1);
    setFilters({
      type: '',
      minAmount: '',
      maxAmount: '',
    });
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Invalid date';
    return d.toLocaleString();
  };

  const getTypeModifier = (type) => {
    if (!type) return 'default';
    return type.toLowerCase();
  };

  if (loading && page === 1 && transactions.length === 0) {
    return (
      <div className="my-transactions-page">
        <div className="my-transactions-card">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="my-transactions-page">
      <div className="my-transactions-card">
        <header className="my-transactions-header">
          <h1 className="my-transactions-title">My Transactions</h1>
          <p className="my-transactions-subtitle">
            View your recent purchases, transfers, redemptions, and more.
          </p>
        </header>

        {error && (
          <div className="my-transactions-alert my-transactions-alert--error">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* Filters */}
        <h2 className="transaction-section-title">Filters</h2>
        <section className="my-transactions-filters">
          <div className="my-transactions-filter-field">
            <label htmlFor="filterType">Type</label>
            <select
              id="filterType"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="purchase">Purchase</option>
              <option value="redemption">Redemption</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="event">Event</option>
            </select>
          </div>

          <div className="my-transactions-filter-field">
            <label htmlFor="filterMinAmount">Min Amount</label>
            <input
              id="filterMinAmount"
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
            />
          </div>

          <div className="my-transactions-filter-field">
            <label htmlFor="filterMaxAmount">Max Amount</label>
            <input
              id="filterMaxAmount"
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
            />
          </div>

          <div className="my-transactions-filter-actions">
            <button
              type="button"
              className="my-transactions-button my-transactions-button--ghost"
              onClick={handleClearFilters}
            >
              Clear
            </button>
          </div>
        </section>

        {/* Transactions list */}
        {transactions.length === 0 && !loading ? (
          <div className="my-transactions-empty">No transactions found.</div>
        ) : (
          <div className="my-transactions-list">
            {transactions.map((tx) => {
              const amountNumber = Number(tx.amount) || 0;
              const amountClass =
                'my-transactions-amount ' +
                (amountNumber >= 0
                  ? 'my-transactions-amount--positive'
                  : 'my-transactions-amount--negative');

              const typeModifier = getTypeModifier(tx.type);
              const typeBadgeClass = `my-transactions-type-badge my-transactions-type-badge--${typeModifier}`;

              return (
                <article key={tx.id} className="my-transactions-item">
                  <div className="my-transactions-item-main">
                    <div className="my-transactions-item-header">
                      <span className={typeBadgeClass}>
                        {tx.type ? tx.type.toUpperCase() : 'UNKNOWN'}
                      </span>
                      <span className={amountClass}>
                        Amount:{' '}
                        {amountNumber >= 0
                          ? `+${amountNumber} points`
                          : `${amountNumber} points`}
                      </span>
                    </div>
                    <p className="my-transactions-remark">
                      {tx.remark || 'No description provided'}
                    </p>
                  </div>
                  <div className="my-transactions-item-meta">
                    <div>{formatDate(tx.createdAt)}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Footer with count and Load More */}
        <footer className="my-transactions-footer">
          <span>
            Showing {transactions.length} of {totalCount} transaction
            {totalCount === 1 ? '' : 's'}
          </span>

          {transactions.length < totalCount && (
            <button
              type="button"
              className="my-transactions-button my-transactions-button--primary"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Load More'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default MyTransactionsPage;
