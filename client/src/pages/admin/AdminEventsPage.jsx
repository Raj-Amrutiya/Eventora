import { useEffect, useState } from 'react';
import http from '../../api/http';

const categoryOptions = ['Cultural', 'Technical', 'Sports', 'Workshop', 'Academic', 'Mega'];

const initialForm = {
  title: '',
  description: '',
  category: 'Cultural',
  date: '',
  time: '',
  venue: '',
  organizer: '',
  seats: 100,
  price: 0,
  image: '',
  featured: false,
};

const mapEventToForm = (event) => ({
  title: event.title || '',
  description: event.description || '',
  category: event.category || 'Cultural',
  date: event.date || '',
  time: event.time || '',
  venue: event.venue || '',
  organizer: event.organizer || '',
  seats: Number(event.seats || 100),
  price: Number(event.price || 0),
  image: event.image || '',
  featured: Boolean(event.featured),
});

function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = async () => {
    const response = await http.get('/events');
    setEvents(response.data.data);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await loadEvents();
      } catch {
        setError('Failed to load events. Please refresh.');
      }
    };

    bootstrap();
  }, []);

  const submitEvent = async (e) => {
    e.preventDefault();

    setError('');
    setFeedback('');
    setSubmitting(true);

    try {
      if (editingId) {
        await http.put(`/events/${editingId}`, form);
        setFeedback('Event updated successfully.');
      } else {
        await http.post('/events', form);
        setFeedback('Event added successfully.');
      }

      setForm(initialForm);
      setEditingId(null);
      await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save event.');
    } finally {
      setSubmitting(false);
    }
  };

  const removeEvent = async (id) => {
    setError('');
    setFeedback('');

    const confirmed = window.confirm('Delete this event permanently?');
    if (!confirmed) {
      return;
    }

    try {
      await http.delete(`/events/${id}`);
      setFeedback('Event deleted successfully.');
      if (editingId === id) {
        setEditingId(null);
        setForm(initialForm);
      }
      await loadEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete event.');
    }
  };

  const startEdit = (event) => {
    setError('');
    setFeedback(`Editing: ${event.title}`);
    setEditingId(event._id);
    setForm(mapEventToForm(event));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
    setFeedback('Edit cancelled.');
  };

  const totalEvents = events.length;
  const featuredEvents = events.filter((event) => event.featured).length;
  const freeEvents = events.filter((event) => Number(event.price) === 0).length;
  const paidEvents = events.filter((event) => Number(event.price) > 0).length;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h2>Manage Events</h2>
          <p>Create, update, and maintain event catalog entries from one place.</p>
        </div>
      </div>

      <section className="admin-metric-row">
        <article className="admin-metric-card">
          <span>Total Events</span>
          <strong>{totalEvents}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Featured</span>
          <strong>{featuredEvents}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Free</span>
          <strong>{freeEvents}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Paid</span>
          <strong>{paidEvents}</strong>
        </article>
      </section>

      {feedback ? <p className="success-text">{feedback}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <section className="card admin-section">
        <h3>{editingId ? 'Edit Event' : 'Add New Event'}</h3>
        <form className="admin-form" onSubmit={submitEvent}>
          <div className="admin-form-grid">
            <label>
              <span>Title</span>
              <input placeholder="Event title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
            </label>
            <label>
              <span>Category</span>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} required>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} required />
            </label>
            <label>
              <span>Time</span>
              <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} required />
            </label>
            <label>
              <span>Venue</span>
              <input placeholder="Venue name" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} required />
            </label>
            <label>
              <span>Organizer</span>
              <input placeholder="Organizer" value={form.organizer} onChange={(e) => setForm((p) => ({ ...p, organizer: e.target.value }))} required />
            </label>
            <label>
              <span>Total Seats</span>
              <input type="number" min={1} placeholder="Seats" value={form.seats} onChange={(e) => setForm((p) => ({ ...p, seats: Number(e.target.value) }))} required />
            </label>
            <label>
              <span>Price (INR)</span>
              <input type="number" min={0} step="0.01" placeholder="0 for free" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
            </label>
            <label className="admin-wide-field">
              <span>Image URL</span>
              <input placeholder="https://..." value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} required />
            </label>
            <label className="admin-wide-field">
              <span>Description</span>
              <textarea placeholder="Event description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} required />
            </label>
            <label className="admin-checkbox-row">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((p) => ({ ...p, featured: e.target.checked }))} />
              <span>Feature this event on home page</span>
            </label>
          </div>
          <div className="admin-actions-row">
            <button className="btn" disabled={submitting}>{submitting ? 'Saving...' : editingId ? 'Update Event' : 'Add Event'}</button>
            {editingId ? (
              <button className="btn ghost" type="button" onClick={cancelEdit}>Cancel Edit</button>
            ) : null}
          </div>
        </form>
      </section>

      <div className="table-wrap admin-table-wrap">
        <table>
          <thead><tr><th>Title</th><th>Date</th><th>Category</th><th>Venue</th><th>Seats</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event._id}>
                <td>{event.title}</td>
                <td>{event.date}</td>
                <td>{event.category}</td>
                <td>{event.venue}</td>
                <td>{event.seats}</td>
                <td>{event.price === 0 ? 'Free' : `INR ${event.price}`}</td>
                <td className="admin-table-actions">
                  <button className="btn ghost" onClick={() => startEdit(event)}>Edit</button>
                  <button className="btn danger" onClick={() => removeEvent(event._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminEventsPage;
