// frontend/src/pages/profile/ProfilePage.jsx
import { useEffect, useState } from 'react';
import { fetchCurrentUser, updateCurrentUser } from '../../api/usersApi';
import { useAuth } from '../../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user: authUser, refreshUser } = useAuth?.() || {};

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', birthday: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchCurrentUser(); // GET /users/me [attached_file:4]
        if (!mounted) return;

        setUser(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          birthday: data.birthday || '',
        });
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {};

      if (form.name !== user.name) payload.name = form.name;
      if (form.email !== user.email) payload.email = form.email;
      if (form.birthday !== (user.birthday || '')) {
        payload.birthday = form.birthday || null;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to save.');
        return;
      }

      const updated = await updateCurrentUser(payload); // PATCH /users/me [attached_file:4]
      setUser(updated);
      setSuccess('Profile updated.');

      if (refreshUser) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--loading">
          Loading profile…
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card profile-card--loading">
          {error || 'Profile not available.'}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <header className="profile-header">
          <h1 className="profile-title">My Profile</h1>
          <p className="profile-subtitle">
            Manage your account details and view your current status.
          </p>
        </header>

        {error && (
          <div className="profile-alert profile-alert--error">{error}</div>
        )}
        {success && (
          <div className="profile-alert profile-alert--success">{success}</div>
        )}

        <section className="profile-section">
          <h2 className="profile-section-title">Account Overview</h2>
          <dl className="profile-overview-list">
            <div className="profile-overview-item">
              <dt>UTORid</dt>
              <dd>{user.utorid}</dd>
            </div>
            <div className="profile-overview-item">
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div className="profile-overview-item">
              <dt>Points</dt>
              <dd>{user.points}</dd>
            </div>
            <div className="profile-overview-item">
              <dt>Status</dt>
              <dd>{user.verified ? 'Verified' : 'Not verified'}</dd>
            </div>
          </dl>
        </section>

        <section className="profile-section">
        <h2 className="profile-section-title">My QR Code</h2>
        <div className="profile-qr">
          <QRCodeSVG value={String(user.id)} size={160} />
          <p className="profile-qr-help">
            Cashiers can scan this code to start a purchase or transfer.
          </p>
        </div>
      </section>
      
        <section className="profile-section">
          <h2 className="profile-section-title">Profile Details</h2>
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="profile-field">
              <label htmlFor="birthday">Birthday (YYYY-MM-DD)</label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                value={form.birthday || ''}
                onChange={handleChange}
              />
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                className="profile-submit"
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
