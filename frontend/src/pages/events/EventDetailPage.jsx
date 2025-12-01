// frontend/src/pages/events/EventDetailPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchEventById, joinEvent, leaveEvent } from '../../api/eventsApi';
import './EventDetailPage.css';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [numGuests, setNumGuests] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchEventById(eventId); // GET /events/:eventId [attached_file:13]
      setEvent(data);
      setNumGuests(data.numGuests ?? 0);
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

  const handleJoin = async () => {
    try {
      setUpdating(true);
      setMessage('');
      setError('');
      await joinEvent(eventId); // POST /events/:eventId/guests/me [attached_file:13]
      setMessage('You have RSVPed to this event.');
      await loadEvent();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to join event');
    } finally {
      setUpdating(false);
    }
  };

  const handleLeave = async () => {
    try {
      setUpdating(true);
      setMessage('');
      setError('');
      await leaveEvent(eventId); // DELETE /events/:eventId/guests/me [attached_file:13]
      setMessage('Your RSVP has been cancelled.');
      await loadEvent();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to leave event');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="event-detail-card event-detail-card--loading">
          Loading event…
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <div className="event-detail-card event-detail-card--loading">
          {error || 'Event not found.'}
        </div>
      </div>
    );
  }

  const start = new Date(event.startTime).toLocaleString();
  const end = new Date(event.endTime).toLocaleString();
  const capacityText = event.capacity
    ? `${numGuests} / ${event.capacity}`
    : `${numGuests} (no capacity limit)`;
  const organizersText =
    event.organizers?.map((o) => o.name || o.utorid).join(', ') || 'TBA';

  return (
    <div className="event-detail-page">
      <div className="event-detail-card">
        <button
          type="button"
          className="event-detail-back"
          onClick={() => navigate('/events')}
        >
          ← Back to Events
        </button>

        <header className="event-detail-header">
          <h1 className="event-detail-title">{event.name}</h1>
          <p className="event-detail-subtitle">
            Kick-off event for CSSU Rewards.
          </p>
        </header>

        {error && (
          <div className="event-detail-alert event-detail-alert--error">
            {error}
          </div>
        )}
        {message && (
          <div className="event-detail-alert event-detail-alert--success">
            {message}
          </div>
        )}

        <section className="event-detail-section event-detail-section--info">
          <p className="event-detail-field">
            <span className="event-detail-label">Location:</span>{' '}
            <span>{event.location}</span>
          </p>
          <p className="event-detail-field">
            <span className="event-detail-label">Time:</span>{' '}
            <span>
              {start} – {end}
            </span>
          </p>
          <p className="event-detail-field">
            <span className="event-detail-label">Guests:</span>{' '}
            <span>{capacityText}</span>
          </p>
          <p className="event-detail-field">
            <span className="event-detail-label">Organizers:</span>{' '}
            <span>{organizersText}</span>
          </p>
        </section>

        {event.description && (
          <section className="event-detail-section">
            <h2 className="event-detail-section-title">About this event</h2>
            <p className="event-detail-description">{event.description}</p>
          </section>
        )}

        <section className="event-detail-section">
          <h2 className="event-detail-section-title">RSVP</h2>
          <div className="event-detail-actions">
            <button
              type="button"
              className="event-detail-button event-detail-button--primary"
              onClick={handleJoin}
              disabled={updating}
            >
              Join Event
            </button>
            <button
              type="button"
              className="event-detail-button event-detail-button--ghost"
              onClick={handleLeave}
              disabled={updating}
            >
              Cancel RSVP
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
