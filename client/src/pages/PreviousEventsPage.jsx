import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import http from '../api/http';
import SmartImage from '../components/SmartImage';
import { useAuth } from '../context/AuthContext';

function PreviousEventsPage() {
  const [previousEvents, setPreviousEvents] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const { user } = useAuth();

  const totalAttendance = previousEvents.reduce((sum, event) => sum + Number(event.attendedStudents || 0), 0);
  const uniqueDepartments = new Set(previousEvents.map((event) => event.department).filter(Boolean)).size;
  const avgAttendance = previousEvents.length > 0 ? Math.round(totalAttendance / previousEvents.length) : 0;
  const snapshotImages = (previousEvents.length > 0 ? previousEvents : [
    {
      title: 'Satrang Unifest 2025',
      poster: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'YuvaRangat Navratri Festival 2025',
      poster: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Innovation and Research Convention 2024',
      poster: 'https://images.unsplash.com/photo-1581090700227-4c4f50f11f43?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'National Youth Festival Showcase 2024',
      poster: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    },
  ]).slice(0, 4);
  const emptyStateImages = snapshotImages.slice(0, 3);

  useEffect(() => {
    const loadPreviousEvents = async () => {
      try {
        const response = await http.get('/previous-events');
        setPreviousEvents(response.data.data || []);
      } catch {
        setPreviousEvents([]);
      }
    };

    const loadWallet = async () => {
      if (!user) {
        return;
      }

      try {
        const response = await http.get('/wallet/me');
        setWallet(response.data.data?.wallet || null);
        setTransactions(response.data.data?.transactions || []);
      } catch {
        setWallet(null);
        setTransactions([]);
      }
    };

    loadPreviousEvents();
    loadWallet();
  }, [user]);

  return (
    <div className="page-shell">
      <section className="section-head">
        <h2>Previous Events at Ganpat University</h2>
      </section>

      <section className="card previous-events-intro">
        <h3>Past Event Performance Snapshot</h3>
        <p>
          This archive highlights past university events with attendance scale, departments involved, and venue execution
          details to showcase real on-ground impact.
        </p>
        <div className="previous-events-media-grid">
          {snapshotImages.map((event, index) => (
            <article key={`${event._id || event.id || event.title}-${index}`} className="previous-events-media-item">
              <SmartImage src={event.poster} alt={event.title} className="previous-events-media-image" />
              <div className="previous-events-media-overlay">
                <span>{event.title}</span>
              </div>
            </article>
          ))}
        </div>
        <div className="previous-events-kpis">
          <article>
            <strong>{previousEvents.length}</strong>
            <span>Events Archived</span>
          </article>
          <article>
            <strong>{totalAttendance.toLocaleString()}</strong>
            <span>Total Attendance</span>
          </article>
          <article>
            <strong>{avgAttendance.toLocaleString()}</strong>
            <span>Average Attendance</span>
          </article>
          <article>
            <strong>{uniqueDepartments}</strong>
            <span>Departments Involved</span>
          </article>
        </div>
      </section>

      <section className="card wallet-preview-card">
        <div className="section-head">
          <div>
            <h3>Campus Wallet</h3>
            <p>Use wallet balance for faster ticket checkout and instant refunds.</p>
          </div>
          <Link to="/wallet" className="text-link">Open wallet</Link>
        </div>

        {user ? (
          <div className="wallet-preview-grid">
            <article>
              <span>Balance</span>
              <strong>INR {wallet?.balance || 0}</strong>
            </article>
            <article>
              <span>Transactions</span>
              <strong>{transactions.length}</strong>
            </article>
            <article>
              <span>Quick Use</span>
              <strong>Pay and refund instantly</strong>
            </article>
          </div>
        ) : (
          <div className="history-empty">
            <p>Login to view your wallet balance and transaction history.</p>
            <small>The wallet appears here for signed-in users as a quick shortcut.</small>
          </div>
        )}
      </section>

      <div className="previous-events-grid">
        {previousEvents.map((event) => (
          <article key={event._id || event.id} className="archive-card poster-card">
            <SmartImage src={event.poster} alt={event.title} className="poster-img" />
            <div className="poster-content">
              <h3>{event.title || 'University Event'}</h3>
              <p className="spotlight">{event.bannerLine || 'Event highlights and execution details.'}</p>
              <ul className="poster-meta">
                <li>Date: {event.date ? dayjs(event.date).format('DD MMM YYYY') : 'TBA'}</li>
                <li>Timing: {event.time || 'TBA'}</li>
                <li>Venue: {event.venue || 'Campus Venue'}</li>
                <li>Attended Students: {Number(event.attendedStudents || 0).toLocaleString()}</li>
                <li>Department: {event.department || 'General Coordination Cell'}</li>
              </ul>
            </div>
          </article>
        ))}
      </div>

      {previousEvents.length === 0 ? (
        <section className="card previous-events-empty-fill">
          <h3>Event Archive Is Updating</h3>
          <p>
            Past event records are being synced. Meanwhile, you can explore upcoming events, book tickets, and return here
            for verified historical stats.
          </p>
          <div className="previous-events-empty-grid">
            <article>
              <strong>Live Events</strong>
              <span>Browse upcoming campus events with seat selection and wallet checkout.</span>
            </article>
            <article>
              <strong>Smart Tickets</strong>
              <span>Download QR and PDF tickets instantly after a successful booking.</span>
            </article>
            <article>
              <strong>Wallet Access</strong>
              <span>Use wallet balance for faster payments and automatic refund handling.</span>
            </article>
          </div>
          <div className="previous-empty-media-grid">
            {emptyStateImages.map((item, index) => (
              <article key={`${item.title}-${index}`} className="previous-empty-media-item">
                <SmartImage src={item.poster} alt={item.title} />
                <span>{item.title}</span>
              </article>
            ))}
          </div>
          <div className="hero-actions">
            <Link to="/events" className="btn">Explore Events</Link>
            <Link to="/wallet" className="btn ghost">Open Wallet</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default PreviousEventsPage;
