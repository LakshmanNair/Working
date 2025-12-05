import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchManagerEvents, fetchEventById } from '../../api/eventsApi';
import { useAuth } from '../../context/AuthContext';
import './MyEventsPage.css';

export default function MyEventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load events where current user is an organizer [attached_file:88]
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError('');

      try {
        const data = await fetchManagerEvents({ page: 1, limit: 50 }); // [attached_file:88]
        const baseEvents = data.results || [];

        const details = await Promise.all(
          baseEvents.map((e) => fetchEventById(e.id)) // [attached_file:88]
        );

        const mine = details.filter((ev) =>
          (ev.organizers || []).some((o) => o.id === user.id)
        );

        if (!mounted) return;
        setEvents(mine);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(
          err.response?.data?.error || 'Failed to load organizer events.'
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="my-events-page">
        <div className="my-events-card my-events-card--loading">
          Loading events…
        </div>
      </div>
    );
  }

  return (
    <div className="my-events-page">
      <div className="my-events-card">
        <header className="my-events-header">
          <h1 className="my-events-title">My Organized Events</h1>
          <p className="my-events-subtitle">
            View events where you are listed as an organizer.
          </p>
        </header>

        {error && (
          <div className="my-events-alert my-events-alert--error">
            {error}
          </div>
        )}

        {events.length === 0 ? (
          <p className="my-events-empty">
            You are not currently an organizer for any events.
          </p>
        ) : (
          <ul className="my-events-list">
            {events.map((event) => {
              const start = new Date(event.startTime).toLocaleString();
              const end = new Date(event.endTime).toLocaleString();
              const guestsCount = Array.isArray(event.guests)
                ? event.guests.length
                : typeof event.numGuests === 'number'
                  ? event.numGuests
                  : 0;

              const guestsText = `${guestsCount} / ${
                event.capacity != null ? event.capacity : 'N/A'
              }`;
              const totalPoints =
                event.pointsRemain != null && event.pointsAwarded != null
                  ? event.pointsRemain + event.pointsAwarded
                  : null;
              const pointsText =
                totalPoints != null
                  ? `${event.pointsRemain} / ${totalPoints}`
                  : 'N/A';

              return (
                <li key={event.id} className="my-events-item">
                  <div className="my-events-item-main">
                    <h2 className="my-events-item-title">{event.name}</h2>
                    <p className="my-events-item-meta">
                      {event.location} • {start} – {end}
                    </p>
                    <p className="my-events-item-meta my-events-item-meta--secondary">
                      Guests: {guestsText} • Points: {pointsText}
                    </p>
                  </div>
                  <div className="my-events-item-actions">
                    <Link
                      to={`/me/events/${event.id}`}
                      className="my-events-link"
                    >
                      View as User
                    </Link>
                    <span className="my-events-divider">•</span>
                    <Link
                      to={`/organizer/events/${event.id}`}
                      className="my-events-link"
                    >
                      Manage Guests / Award Points
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
