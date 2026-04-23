import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import SmartImage from './SmartImage';

function EventCard({ event }) {
  return (
    <article className="event-card">
      <div className="event-card-media">
        <SmartImage src={event.image} alt={event.title} />
        <span className="badge">{event.category}</span>
      </div>
      <div className="event-card-body">
        <h3>{event.title}</h3>
        <div className="event-card-meta">
          <span>{event.venue}</span>
          <span>{dayjs(event.date).format('DD MMM YYYY')}</span>
          <span>{event.time}</span>
        </div>
        <div className="event-card-footer">
          <strong>{event.price === 0 ? 'Free Entry' : `INR ${event.price}`}</strong>
          <Link className="btn btn-small" to={`/events/${event._id}`}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
