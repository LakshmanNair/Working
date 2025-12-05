// frontend/src/pages/manager/ManagerEventDetailPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchEventById,
  updateEvent,
  addOrganizer,
  removeOrganizer,
  addGuestToEvent,
  removeGuestFromEvent,
  awardPointsToGuest,
  awardPointsToAllGuests,
} from '../../api/eventsApi';
import './ManagerEventDetailPage.css';

export default function ManagerEventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    points: '',
    published: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [organizers, setOrganizers] = useState([]);
  const [guests, setGuests] = useState([]);

  const [newOrganizerUtorid, setNewOrganizerUtorid] = useState('');
  const [newGuestUtorid, setNewGuestUtorid] = useState('');

  const [awardSingle, setAwardSingle] = useState({ utorid: '', amount: '' });
  const [awardAll, setAwardAll] = useState({ amount: '' });

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchEventById(eventId); // manager/organizer GET /events/:eventId [attached_file:79][attached_file:86]

      setEvent(data);
      setOrganizers(data.organizers || []);
      setGuests(data.guests || []);

      setForm({
        name: data.name || '',
        description: data.description || '',
        location: data.location || '',
        startTime: data.startTime ? data.startTime.slice(0, 16) : '',
        endTime: data.endTime ? data.endTime.slice(0, 16) : '',
        capacity: data.capacity ?? '',
        points:
          data.pointsRemain != null && data.pointsAwarded != null
            ? data.pointsRemain + data.pointsAwarded
            : '',
        published: Boolean(data.published),
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {};

      if (form.name !== event.name) payload.name = form.name;
      if (form.description !== event.description)
        payload.description = form.description;
      if (form.location !== event.location) payload.location = form.location;

      // convert back to ISO for backend
      const startIso = form.startTime
        ? new Date(form.startTime).toISOString()
        : null;
      const endIso = form.endTime
        ? new Date(form.endTime).toISOString()
        : null;

      if (startIso && startIso !== event.startTime) payload.startTime = startIso;
      if (endIso && endIso !== event.endTime) payload.endTime = endIso;

      // capacity: empty string -> null
      const capVal = form.capacity === '' ? null : Number(form.capacity);
      if (capVal !== event.capacity) payload.capacity = capVal;

      // points: send only if changed and numeric
      const pointsNum = form.points === '' ? null : Number(form.points);
      if (
        pointsNum != null &&
        !Number.isNaN(pointsNum) &&
        event.pointsRemain != null &&
        event.pointsAwarded != null
      ) {
        const currentTotal = event.pointsRemain + event.pointsAwarded;
        if (pointsNum !== currentTotal) {
          payload.points = pointsNum;
        }
      }

      // published: backend only allows setting to true [attached_file:79]
      if (!event.published && form.published) {
        payload.published = true;
      }

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to save.');
        return;
      }

      const updated = await updateEvent(eventId, payload); // PATCH /events/:eventId [attached_file:79][attached_file:86]
      setSuccess('Event updated.');

      setEvent((prev) => ({
        ...prev,
        ...updated,
      }));

      await loadEvent();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    if (!newOrganizerUtorid.trim()) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data = await addOrganizer(eventId, newOrganizerUtorid.trim()); // POST /events/:eventId/organizers [attached_file:79][attached_file:86]
      setOrganizers(data.organizers || []);
      setNewOrganizerUtorid('');
      setSuccess('Organizer added.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add organizer.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOrganizer = async (userId) => {
    if (!window.confirm('Remove this organizer from the event?')) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await removeOrganizer(eventId, userId); // DELETE /events/:eventId/organizers/:userId [attached_file:79][attached_file:86]
      setOrganizers((prev) => prev.filter((o) => o.id !== userId));
      setSuccess('Organizer removed.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to remove organizer.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuestUtorid.trim()) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data = await addGuestToEvent(eventId, newGuestUtorid.trim()); // POST /events/:eventId/guests [attached_file:79][attached_file:86]
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

      await removeGuestFromEvent(eventId, userId); // DELETE /events/:eventId/guests/:userId 
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
      }); // POST /events/:eventId/transactions (event award) 
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
      }); // POST /events/:eventId/transactions (award to all) 

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
      <div className="manager-event-detail-page">
        <div className="manager-event-detail-card manager-event-detail-card--loading">
          Loading event…
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="manager-event-detail-page">
        <div className="manager-event-detail-card manager-event-detail-card--loading">
          {error || 'Event not found.'}
        </div>
      </div>
    );
  }

  const totalPoints =
    event.pointsRemain != null && event.pointsAwarded != null
      ? event.pointsRemain + event.pointsAwarded
      : null;

  return (
    <div className="manager-event-detail-page">
      <div className="manager-event-detail-card">
        <button
          type="button"
          className="manager-event-detail-back"
          onClick={() => navigate('/manager/events')}
        >
          ← Back to Events
        </button>

        <header className="manager-event-detail-header">
          <h1 className="manager-event-detail-title">{event.name}</h1>
          <p className="manager-event-detail-subtitle">
            Event ID {event.id} • {event.published ? 'Published' : 'Unpublished'}
          </p>
        </header>

        {error && (
          <div className="manager-event-detail-alert manager-event-detail-alert--error">
            {error}
          </div>
        )}
        {success && (
          <div className="manager-event-detail-alert manager-event-detail-alert--success">
            {success}
          </div>
        )}

        <section className="manager-event-detail-section manager-event-detail-section--info">
          <h2 className="manager-event-detail-section-title">Overview</h2>
          <p className="manager-event-detail-field">
            <span className="manager-event-detail-label">Guests:</span>{' '}
            <span>{guests.length}</span>
          </p>
          <p className="manager-event-detail-field">
            <span className="manager-event-detail-label">Points:</span>{' '}
            <span>
              {totalPoints != null
                ? `${event.pointsRemain} / ${totalPoints}`
                : 'N/A'}
            </span>
          </p>
        </section>

        <section className="manager-event-detail-section">
          <h2 className="manager-event-detail-section-title">Edit Event</h2>
          <form
            className="manager-event-detail-form"
            onSubmit={handleSubmit}
          >
            <div className="manager-event-detail-field manager-event-detail-field--form">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="manager-event-detail-field manager-event-detail-field--form">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="manager-event-detail-field manager-event-detail-field--form">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="manager-event-detail-form-row">
              <div className="manager-event-detail-field manager-event-detail-field--form">
                <label htmlFor="startTime">Start Time</label>
                <input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={handleChange}
                />
              </div>

              <div className="manager-event-detail-field manager-event-detail-field--form">
                <label htmlFor="endTime">End Time</label>
                <input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="manager-event-detail-form-row">
              <div className="manager-event-detail-field manager-event-detail-field--form">
                <label htmlFor="capacity">Capacity</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="0"
                  value={form.capacity}
                  onChange={handleChange}
                />
              </div>

              <div className="manager-event-detail-field manager-event-detail-field--form">
                <label htmlFor="points">Total Points</label>
                <input
                  id="points"
                  name="points"
                  type="number"
                  min="0"
                  value={form.points}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="manager-event-detail-field manager-event-detail-field--inline">
              <label>
                <input
                  type="checkbox"
                  name="published"
                  checked={form.published}
                  onChange={handleChange}
                  disabled={event.published}
                />{' '}
                Published (can only be set to true)
              </label>
            </div>

            <div className="manager-event-detail-actions">
              <button
                type="submit"
                className="manager-event-detail-button manager-event-detail-button--primary"
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>

        <section className="manager-event-detail-section">
          <h2 className="manager-event-detail-section-title">Organizers</h2>
          {organizers.length === 0 ? (
            <p className="manager-event-detail-empty">
              No organizers assigned yet.
            </p>
          ) : (
            <ul className="manager-event-detail-list">
              {organizers.map((o) => (
                <li key={o.id} className="manager-event-detail-list-item">
                  <span>
                    {o.name || o.utorid} ({o.utorid})
                  </span>
                  <button
                    type="button"
                    className="manager-event-detail-button manager-event-detail-button--ghost"
                    onClick={() => handleRemoveOrganizer(o.id)}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="manager-event-detail-inline-form"
            onSubmit={handleAddOrganizer}
          >
            <input
              type="text"
              placeholder="UTORid"
              value={newOrganizerUtorid}
              onChange={(e) => setNewOrganizerUtorid(e.target.value)}
            />
            <button
              type="submit"
              className="manager-event-detail-button manager-event-detail-button--secondary"
              disabled={saving}
            >
              Add Organizer
            </button>
          </form>
        </section>

        <section className="manager-event-detail-section">
          <h2 className="manager-event-detail-section-title">Guests</h2>
          {guests.length === 0 ? (
            <p className="manager-event-detail-empty">
              No guests have RSVPed yet.
            </p>
          ) : (
            <ul className="manager-event-detail-list">
              {guests.map((g) => (
                <li key={g.id} className="manager-event-detail-list-item">
                  <span>
                    {g.name || g.utorid} ({g.utorid})
                  </span>
                  <button
                    type="button"
                    className="manager-event-detail-button manager-event-detail-button--ghost"
                    onClick={() => handleRemoveGuest(g.id)}
                    disabled={saving}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="manager-event-detail-inline-form"
            onSubmit={handleAddGuest}
          >
            <input
              type="text"
              placeholder="Add guest by UTORid"
              value={newGuestUtorid}
              onChange={(e) => setNewGuestUtorid(e.target.value)}
            />
            <button
              type="submit"
              className="manager-event-detail-button manager-event-detail-button--secondary"
              disabled={saving}
            >
              Add Guest
            </button>
          </form>
        </section>

        <section className="manager-event-detail-section">
          <h2 className="manager-event-detail-section-title">Award Points</h2>
          <p className="manager-event-detail-help">
            Points remaining in pool: {event.pointsRemain} (total{' '}
            {totalPoints != null ? totalPoints : 'N/A'})
          </p>

          <div className="manager-event-detail-award-group">
            <h3 className="manager-event-detail-subheading">To single guest</h3>
            <form
              className="manager-event-detail-inline-form"
              onSubmit={handleAwardSingle}
            >
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
                className="manager-event-detail-button manager-event-detail-button--primary"
                disabled={saving}
              >
                Award to Guest
              </button>
            </form>
          </div>

          <div className="manager-event-detail-award-group">
            <h3 className="manager-event-detail-subheading">To all guests</h3>
            <form
              className="manager-event-detail-inline-form"
              onSubmit={handleAwardAll}
            >
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
                className="manager-event-detail-button manager-event-detail-button--primary"
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
