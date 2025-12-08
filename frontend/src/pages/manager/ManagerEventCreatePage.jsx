import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../../api/eventsApi';
import './ManagerEventCreatePage.css';

export default function ManagerEventCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    capacity: '',
    points: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic client-side validation
      const pointsNum = Number(form.points);
      if (isNaN(pointsNum) || pointsNum <= 0) {
        throw new Error("Points must be a positive integer.");
      }

      // Format payload for API
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        startTime: form.startTime ? new Date(form.startTime).toISOString() : null,
        endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        points: pointsNum,
      };

      await createEvent(payload);
      
      // Redirect to events list on success
      navigate('/manager/events');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-event-create-page">
      <div className="manager-event-create-card">
        <button
          type="button"
          className="manager-event-create-back"
          onClick={() => navigate('/manager/events')}
        >
          ← Back to Events
        </button>

        <header className="manager-event-create-header">
          <h1 className="manager-event-create-title">Create New Event</h1>
          <p className="manager-event-create-subtitle">
            Fill in the details below to initialize a new event.
          </p>
        </header>

        {error && (
          <div className="manager-event-create-alert manager-event-create-alert--error">
            {error}
          </div>
        )}

        <section className="manager-event-create-section">
          <form className="manager-event-create-form" onSubmit={handleSubmit}>
            
            <div className="manager-event-create-field">
              <label htmlFor="name">Event Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Annual Charity Gala"
                required
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="manager-event-create-field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="What is this event about?"
                required
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="manager-event-create-field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                placeholder="e.g. Main Hall or Zoom Link"
                required
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="manager-event-create-form-row">
              <div className="manager-event-create-field">
                <label htmlFor="startTime">Start Time</label>
                <input
                  id="startTime"
                  name="startTime"
                  type="datetime-local"
                  required
                  value={form.startTime}
                  onChange={handleChange}
                />
              </div>

              <div className="manager-event-create-field">
                <label htmlFor="endTime">End Time</label>
                <input
                  id="endTime"
                  name="endTime"
                  type="datetime-local"
                  required
                  value={form.endTime}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="manager-event-create-form-row">
              <div className="manager-event-create-field">
                <label htmlFor="capacity">Capacity (Optional)</label>
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  placeholder="Leave blank for unlimited"
                  value={form.capacity}
                  onChange={handleChange}
                />
              </div>

              <div className="manager-event-create-field">
                <label htmlFor="points">Total Points Pool</label>
                <input
                  id="points"
                  name="points"
                  type="number"
                  min="1"
                  placeholder="Total points available for this event"
                  required
                  value={form.points}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="manager-event-create-actions">
              <button
                type="submit"
                className="manager-event-create-button manager-event-create-button--primary"
                disabled={loading}
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}