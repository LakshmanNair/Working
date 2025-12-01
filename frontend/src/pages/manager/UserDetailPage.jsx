// frontend/src/pages/manager/UserDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchUserById, updateUserById } from '../../api/usersApi';
import { useAuth } from '../../context/AuthContext';
import './UserDetailPage.css';

const ROLE_OPTIONS = ['regular', 'cashier', 'manager', 'superuser'];

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [verified, setVerified] = useState(false);
  const [suspicious, setSuspicious] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Managers can only set regular/cashier; superusers can set any role [attached_file:4]
  const allowedRoles =
    currentUser?.role === 'manager'
      ? ROLE_OPTIONS.filter((r) => r === 'regular' || r === 'cashier')
      : ROLE_OPTIONS;

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchUserById(userId); // GET /users/:userId [attached_file:4]
        if (!mounted) return;

        setUser(data);
        setEmail(data.email || '');
        setRole(data.role || 'regular');
        setVerified(Boolean(data.verified));
        setSuspicious(Boolean(data.suspicious));
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.response?.data?.error || 'Failed to load user.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {};

      if (email !== user.email) payload.email = email;

      // Backend only allows verified to be set to true, not false [attached_file:4]
      if (!user.verified && verified) {
        payload.verified = true;
      }

      if (suspicious !== Boolean(user.suspicious)) {
        payload.suspicious = suspicious;
      }

      if (role !== user.role) {
        payload.role = role;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to save.');
        return;
      }

      const updated = await updateUserById(userId, payload); // PATCH /users/:userId [attached_file:4]

      setUser((prev) => ({
        ...prev,
        ...updated,
      }));
      setSuccess('User updated.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-card user-detail-card--loading">
          Loading user…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-detail-page">
        <div className="user-detail-card user-detail-card--loading">
          {error || 'User not found.'}
        </div>
      </div>
    );
  }

  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleString()
    : 'N/A';
  const lastLogin = user.lastLogin
    ? new Date(user.lastLogin).toLocaleString()
    : 'Never';

  return (
    <div className="user-detail-page">
      <div className="user-detail-card">
        <button
          type="button"
          className="user-detail-back"
          onClick={() => navigate('/manager/users')}
        >
          ← Back to Users
        </button>

        <header className="user-detail-header">
          <h1 className="user-detail-title">
            User: {user.name} ({user.utorid})
          </h1>
        </header>

        {error && (
          <div className="user-detail-alert user-detail-alert--error">
            {error}
          </div>
        )}
        {success && (
          <div className="user-detail-alert user-detail-alert--success">
            {success}
          </div>
        )}

        <section className="user-detail-section user-detail-section--info">
          <h2 className="user-detail-section-title">Account Overview</h2>

          <p className="user-detail-field">
            <span className="user-detail-label">Email:</span>{' '}
            <span>{user.email}</span>
          </p>
          <p className="user-detail-field">
            <span className="user-detail-label">Role:</span>{' '}
            <span>{user.role}</span>
          </p>
          <p className="user-detail-field">
            <span className="user-detail-label">Points:</span>{' '}
            <span>{user.points}</span>
          </p>
          <p className="user-detail-field">
            <span className="user-detail-label">Verified:</span>{' '}
            <span>{user.verified ? 'Yes' : 'No'}</span>
          </p>
          <p className="user-detail-field">
            <span className="user-detail-label">Suspicious:</span>{' '}
            <span>{user.suspicious ? 'Yes' : 'No'}</span>
          </p>
          <p className="user-detail-field">
            <span className="user-detail-label">Created At:</span>{' '}
            <span>{createdAt}</span>
          </p>
          <p className="user-detail-field">
            <span className="user-detail-label">Last Login:</span>{' '}
            <span>{lastLogin}</span>
          </p>
        </section>

        <section className="user-detail-section">
          <h2 className="user-detail-section-title">Manage User</h2>

          <form className="user-detail-form" onSubmit={handleSave}>
            <div className="user-detail-field user-detail-field--form">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="user-detail-help">
                Must be a valid @mail.utoronto.ca email as enforced by the
                backend.
              </p>
            </div>

            <div className="user-detail-field user-detail-field--form">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="user-detail-field user-detail-field--inline">
              <label>
                <input
                  type="checkbox"
                  checked={suspicious}
                  onChange={(e) => setSuspicious(e.target.checked)}
                />{' '}
                Suspicious
              </label>
            </div>

            <div className="user-detail-field user-detail-field--inline">
              <label>
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  disabled={user.verified}
                />{' '}
                Verified
              </label>
              {user.verified && (
                <p className="user-detail-help">
                  User is already verified; cannot set back to unverified.
                </p>
              )}
            </div>

            <div className="user-detail-actions">
              <button
                type="submit"
                className="user-detail-button user-detail-button--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
