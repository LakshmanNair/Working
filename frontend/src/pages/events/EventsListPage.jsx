import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../../api/eventsApi';
import './EventsListPage.css';

export default function EventsListPage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [started, setStarted] = useState('');
  const [ended, setEnded] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const totalPages = Math.max(1, Math.ceil(count / limit));

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchEvents({
        name: name || undefined,
        location: location || undefined,
        started: started || undefined,
        ended: ended || undefined,
        page,
        limit,
      }); // GET /events with filters & pagination [attached_file:13]

      setEvents(data.results || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  const handleClear = () => {
    setName('');
    setLocation('');
    setStarted('');
    setEnded('');
    setPage(1);
    loadEvents();
  };

  return (
    <div className="events-page">
      <div className="events-card">
        <header className="events-header">
          <h1 className="events-title">Events</h1>
          <p className="events-subtitle">
            Browse and RSVP to upcoming point-earning events.
          </p>
        </header>

        {error && (
          <div className="events-alert events-alert--error">{error}</div>
        )}

        <section className="events-section">
          <h2 className="events-section-title">Filters</h2>
          <form className="events-filters" onSubmit={handleFilterSubmit}>
            <div className="events-filter-field">
              <label htmlFor="event-name">Name</label>
              <input
                id="event-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Search by event name"
              />
            </div>

            <div className="events-filter-field">
              <label htmlFor="event-location">Location</label>
              <input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Search by location"
              />
            </div>

            <div className="events-filter-field">
              <label htmlFor="started">Started</label>
              <select
                id="started"
                value={started}
                onChange={(e) => setStarted(e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Started</option>
                <option value="false">Not started</option>
              </select>
            </div>

            <div className="events-filter-field">
              <label htmlFor="ended">Ended</label>
              <select
                id="ended"
                value={ended}
                onChange={(e) => setEnded(e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Ended</option>
                <option value="false">Ongoing / upcoming</option>
              </select>
            </div>

            <div className="events-filter-actions">
              <button
                type="submit"
                className="events-button events-button--primary"
                disabled={loading}
              >
                Apply
              </button>
              <button
                type="button"
                className="events-button events-button--ghost"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="events-section">
          <h2 className="events-section-title">Results</h2>

          {loading ? (
            <div className="events-empty">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="events-empty">No events found.</div>
          ) : (
            <ul className="events-list">
              {events.map((event) => {
                const start = new Date(event.startTime).toLocaleString();
                const end = new Date(event.endTime).toLocaleString();
                const hasCapacity = event.capacity != null;
                const guestsText = hasCapacity
                  ? `Guests: ${event.numGuests} / ${event.capacity}`
                  : `Guests: ${event.numGuests}`;

                return (
                  <li key={event.id} className="events-item">
                    <div className="events-item-main">
                      <h3 className="events-item-title">{event.name}</h3>
                      <p className="events-item-meta">
                        {event.location} • {start} – {end}
                      </p>
                      <p className="events-item-meta events-item-meta--secondary">
                        {guestsText}
                      </p>
                    </div>
                    <div className="events-item-actions">
                      <Link
                        to={`/me/events/${event.id}`}
                        className="events-link"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="events-pagination">
            <span className="events-pagination-text">
              Page {page} of {totalPages} ({count} events)
            </span>
            <div className="events-pagination-buttons">
              <button
                type="button"
                className="events-button events-button--ghost"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="events-button events-button--ghost"
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
