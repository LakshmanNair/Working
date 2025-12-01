// frontend/src/pages/manager/ManagerEventsListPage.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchManagerEvents, deleteEvent } from '../../api/eventsApi';
import './ManagerEventsListPage.css';

export default function ManagerEventsListPage() {
  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [started, setStarted] = useState('');
  const [ended, setEnded] = useState('');
  const [published, setPublished] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await fetchManagerEvents({
        name: name || undefined,
        location: location || undefined,
        started: started || undefined,
        ended: ended || undefined,
        published: published || undefined,
        page,
        limit,
      }); // manager GET /events with extra fields [attached_file:13]
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
    setPublished('');
    setPage(1);
    loadEvents();
  };

  const handleDelete = async (eventId) => {
    if (
      !window.confirm(
        'Delete this event? (Only unpublished events can be deleted.)'
      )
    ) {
      return;
    }

    try {
      setError('');
      setInfo('');
      await deleteEvent(eventId); // DELETE /events/:eventId [attached_file:13]
      setInfo('Event deleted.');
      setPage(1);
      await loadEvents();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  const handleCreate = () => {
    navigate('/manager/events/new');
  };

  return (
    <div className="manager-events-page">
      <div className="manager-events-card">
        <header className="manager-events-header">
          <div>
            <h1 className="manager-events-title">All Events (Manager)</h1>
            <p className="manager-events-subtitle">
              Create, filter, and manage all events.
            </p>
          </div>
          <button
            type="button"
            className="manager-events-button manager-events-button--primary"
            onClick={handleCreate}
          >
            + Create Event
          </button>
        </header>

        {error && (
          <div className="manager-events-alert manager-events-alert--error">
            {error}
          </div>
        )}
        {info && (
          <div className="manager-events-alert manager-events-alert--info">
            {info}
          </div>
        )}

        <section className="manager-events-section">
          <h2 className="manager-events-section-title">Filters</h2>
          <form
            className="manager-events-filters"
            onSubmit={handleFilterSubmit}
          >
            <div className="manager-events-filter-field manager-events-filter-field--wide">
              <label htmlFor="event-name">Name</label>
              <input
                id="event-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Search by event name"
              />
            </div>

            <div className="manager-events-filter-field manager-events-filter-field--wide">
              <label htmlFor="event-location">Location</label>
              <input
                id="event-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Search by location"
              />
            </div>

            <div className="manager-events-filter-field">
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

            <div className="manager-events-filter-field">
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

            <div className="manager-events-filter-field">
              <label htmlFor="published">Published</label>
              <select
                id="published"
                value={published}
                onChange={(e) => setPublished(e.target.value)}
              >
                <option value="">Any</option>
                <option value="true">Published</option>
                <option value="false">Unpublished</option>
              </select>
            </div>

            <div className="manager-events-filter-actions">
              <button
                type="submit"
                className="manager-events-button manager-events-button--primary"
                disabled={loading}
              >
                Apply
              </button>
              <button
                type="button"
                className="manager-events-button manager-events-button--ghost"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        <section className="manager-events-section">
          <h2 className="manager-events-section-title">Results</h2>

          {loading ? (
            <div className="manager-events-empty">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="manager-events-empty">No events found.</div>
          ) : (
            <div className="manager-events-table-wrapper">
              <table className="manager-events-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Guests</th>
                    <th>Points</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => {
                    const start = new Date(e.startTime).toLocaleString();
                    const end = new Date(e.endTime).toLocaleString();
                    const guestsText = e.capacity
                      ? `${e.numGuests} / ${e.capacity}`
                      : `${e.numGuests}`;
                    const pointsText = `${e.pointsRemain ?? '-'} / ${
                      e.pointsAwarded ?? '-'
                    }`;

                    return (
                      <tr key={e.id}>
                        <td>
                          <button
                            type="button"
                            className="manager-events-link-button"
                            onClick={() => navigate(`/manager/events/${e.id}`)}
                          >
                            {e.name}
                          </button>
                        </td>
                        <td>{e.location}</td>
                        <td>{start}</td>
                        <td>{end}</td>
                        <td>{guestsText}</td>
                        <td>{pointsText}</td>
                        <td>{e.published ? 'Yes' : 'No'}</td>
                        <td className="manager-events-actions-cell">
                          <Link
                            to={`/manager/events/${e.id}`}
                            className="manager-events-link"
                          >
                            View/Edit
                          </Link>
                          <button
                            type="button"
                            className="manager-events-link manager-events-link--danger"
                            onClick={() => handleDelete(e.id)}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="manager-events-pagination">
            <span className="manager-events-pagination-text">
              Page {page} of {totalPages} ({count} events)
            </span>
            <div className="manager-events-pagination-buttons">
              <button
                type="button"
                className="manager-events-button manager-events-button--ghost"
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="manager-events-button manager-events-button--ghost"
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

