import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchEventById,
  addGuestToEvent,
  removeGuestFromEvent,
  awardPointsToGuest,
  awardPointsToAllGuests,
} from '../../api/eventsApi';
import './EventAwardPointsPage.css';

export default function EventAwardPointsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [newGuestUtorid, setNewGuestUtorid] = useState('');
  const [awardSingle, setAwardSingle] = useState({ utorid: '', amount: '' });
  const [awardAll, setAwardAll] = useState({ amount: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchEventById(eventId); // includes organizers + guests [attached_file:13][attached_file:89]
      setEvent(data);
      setGuests(data.guests || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuestUtorid.trim()) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const data = await addGuestToEvent(eventId, newGuestUtorid.trim()); // POST /events/:id/guests [attached_file:13][attached_file:89]
      const added = data.guestAdded;
      if (added) {
        setGuests((prev) => [...prev, added]);
      }
      setNewGuestUtorid('');
      setSuccess('Guest added.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add guest.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveGuest = async (userId) => {
    if (!window.confirm('Remove this guest from the event?')) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await removeGuestFromEvent(eventId, userId); // DELETE /events/:id/guests/:userId [attached_file:13][attached_file:89]
      setGuests((prev) => prev.filter((g) => g.id !== userId));
      setSuccess('Guest removed.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to remove guest.');
    } finally {
      setSaving(false);
    }
  };

  const handleAwardSingle = async (e) => {
    e.preventDefault();
    const { utorid, amount } = awardSingle;
    const amtNum = Number(amount);
    if (!utorid.trim() || !amtNum || amtNum <= 0) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await awardPointsToGuest(eventId, {
        utorid: utorid.trim(),
        amount: amtNum,
        remark: '',
      }); // POST /events/:id/transactions single guest [attached_file:13][attached_file:89]

      setAwardSingle({ utorid: '', amount: '' });
      setSuccess('Points awarded to guest.');
      await loadEvent();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 'Failed to award points to guest.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAwardAll = async (e) => {
    e.preventDefault();
    const amtNum = Number(awardAll.amount);
    if (!amtNum || amtNum <= 0) return;

    if (
      !window.confirm(
        'Award points to all guests? This will use event pool points.',
      )
    )
      return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await awardPointsToAllGuests(eventId, {
        amount: amtNum,
        remark: '',
      }); // POST /events/:id/transactions all guests [attached_file:13][attached_file:89]

      setAwardAll({ amount: '' });
      setSuccess('Points awarded to all guests.');
      await loadEvent();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 'Failed to award points to all guests.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="award-page">
        <div className="award-card award-card--loading">
          Loading event…
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="award-page">
        <div className="award-card award-card--loading">
          {error || 'Event not found.'}
        </div>
      </div>
    );
  }

  const hasPoints =
    event.pointsRemain != null && event.pointsAwarded != null;
  const totalPoints = hasPoints
    ? event.pointsRemain + event.pointsAwarded
    : null;
    
  return (
    <div className="award-page">
      <div className="award-card">
        <button
          type="button"
          className="award-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <header className="award-header">
          <h1 className="award-title">Award Points</h1>
          <p className="award-subtitle">
            {event.name}
          </p>
        </header>

        {error && (
          <div className="award-alert award-alert--error">{error}</div>
        )}
        {success && (
          <div className="award-alert award-alert--success">{success}</div>
        )}

        <section className="award-section award-section--info">
          <p className="award-field">
            <span className="award-label">Location:</span>{' '}
            <span>{event.location}</span>
          </p>
          <p className="award-field">
            <span className="award-label">Time:</span>{' '}
            <span>
              {new Date(event.startTime).toLocaleString()} –{' '}
              {new Date(event.endTime).toLocaleString()}
            </span>
          </p>
          <p className="award-field">
            <span className="award-label">Guests:</span>{' '}
            <span>{guests.length}</span>
          </p>
          <p className="award-field">
            <span className="award-label">Points:</span>{' '}
            <span>
              {totalPoints != null
                ? `${event.pointsRemain} / ${totalPoints}`
                : 'N/A'}
            </span>
          </p>
          <p className="award-help">
            Points remaining in pool: {event.pointsRemain} (total{' '}
            {totalPoints != null ? totalPoints : 'N/A'})
          </p>
        </section>

        <section className="award-section">
          <h2 className="award-section-title">Guests</h2>

          {guests.length === 0 ? (
            <p className="award-empty">No guests have RSVPed yet.</p>
          ) : (
            <ul className="award-list">
              {guests.map((g) => (
                <li key={g.id} className="award-list-item">
                  <span>
                    {g.name || g.utorid} ({g.utorid})
                  </span>
                  <button
                    type="button"
                    className="award-button award-button--ghost"
                    onClick={() => handleRemoveGuest(g.id)}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="award-inline-form" onSubmit={handleAddGuest}>
            <input
              type="text"
              placeholder="Add guest by UTORid"
              value={newGuestUtorid}
              onChange={(e) => setNewGuestUtorid(e.target.value)}
            />
            <button
              type="submit"
              className="award-button award-button--secondary"
              disabled={saving}
            >
              Add Guest
            </button>
          </form>
        </section>

        <section className="award-section">
          <h2 className="award-section-title">Award Points</h2>

          <div className="award-award-group">
            <h3 className="award-subheading">To single guest</h3>
            <form className="award-inline-form" onSubmit={handleAwardSingle}>
              <input
                type="text"
                placeholder="Guest UTORid"
                value={awardSingle.utorid}
                onChange={(e) =>
                  setAwardSingle((prev) => ({
                    ...prev,
                    utorid: e.target.value,
                  }))
                }
              />
              <input
                type="number"
                placeholder="Amount"
                value={awardSingle.amount}
                onChange={(e) =>
                  setAwardSingle((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
              />
              <button
                type="submit"
                className="award-button award-button--primary"
                disabled={saving}
              >
                Award to Guest
              </button>
            </form>
          </div>

          <div className="award-award-group">
            <h3 className="award-subheading">To all guests</h3>
            <form className="award-inline-form" onSubmit={handleAwardAll}>
              <input
                type="number"
                placeholder="Amount per guest"
                value={awardAll.amount}
                onChange={(e) =>
                  setAwardAll({ amount: e.target.value })
                }
              />
              <button
                type="submit"
                className="award-button award-button--primary"
                disabled={saving}
              >
                Award to All Guests
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
