// frontend/src/pages/manager/UsersListPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchUsers } from '../../api/usersApi';
import './UsersListPage.css';

const ROLES = ['', 'regular', 'cashier', 'manager', 'superuser'];

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [verified, setVerified] = useState(''); // '', 'true', 'false'
  const [activated, setActivated] = useState(''); // '', 'true', 'false'
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(count / limit));

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchUsers({
        name,
        role,
        verified,
        activated,
        page,
        limit,
      }); // GET /users [attached_file:4]
      setUsers(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleClearFilters = () => {
    setName('');
    setRole('');
    setVerified('');
    setActivated('');
    setPage(1);
    loadUsers();
  };

  return (
    <div className="users-page">
      <div className="users-card">
        <header className="users-header">
          <h1 className="users-title">All Users (Manager)</h1>
          <p className="users-subtitle">
            Manager view of all accounts with filters and pagination.
          </p>
        </header>

        {error && (
          <div className="users-alert users-alert--error">{error}</div>
        )}

        <section className="users-section">
          <h2 className="users-section-title">Filters</h2>
          <form className="users-filters" onSubmit={handleFilterSubmit}>
            <div className="users-filter-field users-filter-field--wide">
              <label htmlFor="users-name">Name / UTORid / Email</label>
              <input
                id="users-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Search by name, UTORid, or email"
              />
            </div>

            <div className="users-filter-field">
              <label htmlFor="users-role">Role</label>
              <select
                id="users-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Any</option>
                {ROLES.filter((r) => r).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="users-filter-field">
              <label htmlFor="users-verified">Verified</label>
              <select
                id="users-verified"
                value={verified}
                onChange={(e) => setVerified(e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="users-filter-field">
              <label htmlFor="users-activated">Activated</label>
              <select
                id="users-activated"
                value={activated}
                onChange={(e) => setActivated(e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div className="users-filter-actions">
              <button
                type="submit"
                className="users-button users-button--primary"
                disabled={loading}
              >
                Apply
              </button>
              <button
                type="button"
                className="users-button users-button--ghost"
                onClick={handleClearFilters}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="users-section">
          <h2 className="users-section-title">Results</h2>

          {loading ? (
            <div className="users-empty">Loading users…</div>
          ) : users.length === 0 ? (
            <div className="users-empty">No users found.</div>
          ) : (
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>UTORid</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Activated</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.utorid}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>{u.verified ? 'Yes' : 'No'}</td>
                      <td>{u.lastLogin ? 'Yes' : 'No'}</td>
                      <td>{u.points}</td>
                      <td>
                        <Link
                          to={`/manager/users/${u.id}`}
                          className="users-link"
                        >
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="users-pagination">
            <span className="users-pagination-text">
              Page {page} of {totalPages} ({count} users)
            </span>
            <div className="users-pagination-buttons">
              <button
                type="button"
                className="users-button users-button--ghost"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="users-button users-button--ghost"
                disabled={page === totalPages || loading}
                onClick={() =>
                  setPage((p) => (p < totalPages ? p + 1 : p))
                }
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
