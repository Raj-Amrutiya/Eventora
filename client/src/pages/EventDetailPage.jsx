import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import http from '../api/http';
import SmartImage from '../components/SmartImage';

function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await http.get(`/events/${id}`);
      setEvent(response.data.data);
    };
    load();
  }, [id]);

  if (!event) {
    return <div className="page-shell">Loading event details...</div>;
  }

  return (
    <div className="page-shell detail-layout">
      <SmartImage src={event.image} alt={event.title} className="detail-image" />
      <div className="card">
        <span className="badge">{event.category}</span>
        <h2>{event.title}</h2>
        <p>{event.description}</p>
        <ul className="meta-list">
          <li>Date: {dayjs(event.date).format('DD MMM YYYY')}</li>
          <li>Time: {event.time}</li>
          <li>Venue: {event.venue}</li>
          <li>Organizer: {event.organizer}</li>
          <li>Seats Available: {event.seatsAvailable}</li>
          <li>Price: {event.price === 0 ? 'Free' : `INR ${event.price}`}</li>
        </ul>
        <Link to={`/events/${event._id}/book`} className="btn">Book Ticket</Link>
      </div>
    </div>
  );
}

export default EventDetailPage;
