import { useEffect, useState } from 'react';
import http from '../api/http';
import EventCard from '../components/EventCard';

const categories = ['All', 'Cultural', 'Technical', 'Sports', 'Workshop', 'Academic', 'Mega'];

function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({ category: 'All', type: 'all', search: '' });

  useEffect(() => {
    const loadEvents = async () => {
      const params = new URLSearchParams();
      if (filters.category !== 'All') params.set('category', filters.category);
      if (filters.type !== 'all') params.set('type', filters.type);
      if (filters.search.trim()) params.set('search', filters.search.trim());

      const response = await http.get(`/events?${params.toString()}`);
      setEvents(response.data.data);
    };

    loadEvents();
  }, [filters]);

  return (
    <div className="page-shell">
      <div className="section-head">
        <h2>Event Listing</h2>
      </div>
      <div className="filters">
        <input
          placeholder="Search by event, organizer or venue"
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
        />
        <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
          {categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select value={filters.type} onChange={(e) => setFilters((p) => ({ ...p, type: e.target.value }))}>
          <option value="all">Free and Paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <div className="events-grid">
        {events.map((event) => <EventCard key={event._id} event={event} />)}
      </div>
    </div>
  );
}

export default EventsPage;
