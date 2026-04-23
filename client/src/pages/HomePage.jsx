import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import http from '../api/http';
import EventCard from '../components/EventCard';
import SmartImage from '../components/SmartImage';
import useScrollReveal from '../hooks/useScrollReveal';

function HomePage() {
  useScrollReveal();
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [previousEvents, setPreviousEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const featuredFallbackImages = [
    {
      title: 'Campus Music Night',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Innovation Expo',
      image: 'https://images.unsplash.com/photo-1581090700227-4c4f50f11f43?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Cultural Carnival',
      image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const archiveFallbackImages = [
    {
      title: 'Annual Tech Symposium',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Youth Festival Showcase',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Navratri Campus Night',
      image: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const [featuredResponse, previousResponse] = await Promise.all([
          http.get('/events?featured=true'),
          http.get('/previous-events'),
        ]);

        setFeaturedEvents((featuredResponse.data.data || []).slice(0, 6));
        setPreviousEvents((previousResponse.data.data || []).slice(0, 4));
      } catch {
        setFeaturedEvents([]);
        setPreviousEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatured();
  }, []);

  return (
    <div className="page-shell home">
      <section className="hero-block home-animate home-landing">
        <div className="hero-grid hero-split-layout">
          <div className="hero-copy hero-reveal-copy">
            <p className="kicker">Eventora Access</p>
            <h1>
              <span className="text-animate-word">Book</span>{' '}
              <span className="text-animate-word" style={{ animationDelay: '0.1s' }}>
                events
              </span>{' '}
              <span className="text-animate-word" style={{ animationDelay: '0.2s' }}>
                beautifully.
              </span>
            </h1>
            <p className="hero-subtitle">A calm, premium event portal for discovery, ticketing, wallet payments, and QR-based entry.</p>
            <div className="hero-actions reveal-delay-1">
              <Link className="btn" to="/events">Explore Events</Link>
              <Link className="btn ghost" to="/wallet">Open Wallet</Link>
            </div>
            <div className="hero-badges reveal-delay-2">
              <span>QR Tickets</span>
              <span>Wallet Checkout</span>
              <span>Live Archive</span>
            </div>
            <div className="hero-scroll reveal-delay-2">
              <span className="hero-scroll-dot" />
              <span>Scroll for featured events</span>
            </div>
          </div>

          <aside className="hero-aside card hero-reveal-aside home-hero-panel">
            <div className="home-hero-panel-head">
              <div>
                <p className="hero-aside-label">Today at Ganpat</p>
                <h3>{featuredEvents[0]?.title || 'Featured campus experiences'}</h3>
              </div>
              <span className="badge">Live</span>
            </div>

            {featuredEvents[0] ? (
              <article className="home-feature-card">
                <SmartImage src={featuredEvents[0].image} alt={featuredEvents[0].title} className="home-feature-image" />
                <div className="home-feature-overlay">
                  <span>{featuredEvents[0].category}</span>
                  <strong>{dayjs(featuredEvents[0].date).format('DD MMM YYYY')}</strong>
                  <p>{featuredEvents[0].venue}</p>
                </div>
              </article>
            ) : (
              <div className="home-feature-placeholder">
                <p>Loading featured events...</p>
              </div>
            )}

            <div className="hero-metrics home-hero-metrics">
              <article>
                <strong>{featuredEvents.length || '6'}</strong>
                <span>Featured events</span>
              </article>
              <article>
                <strong>{previousEvents.length || '4'}</strong>
                <span>Archive highlights</span>
              </article>
              <article>
                <strong>24/7</strong>
                <span>Booking access</span>
              </article>
              <article>
                <strong>QR</strong>
                <span>Fast entry</span>
              </article>
            </div>
          </aside>
        </div>
      </section>

      <section id="featured-events" className="home-section-enter home-section-card reveal-on-scroll">
        <div className="section-head reveal-on-scroll">
          <h2>Featured Campus Events</h2>
          <Link to="/events" className="text-link">View all events</Link>
        </div>
        {isLoading ? <p>Loading featured events...</p> : null}
        {!isLoading ? (
          <div className="events-grid home-events-grid">
            {featuredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : null}
        {!isLoading && featuredEvents.length === 0 ? (
          <div className="history-empty">
            <p>Featured events will appear here shortly.</p>
            <small>Browse all events to explore current listings.</small>
            <div className="home-empty-visuals">
              {featuredFallbackImages.map((item) => (
                <article key={item.title} className="home-empty-card">
                  <SmartImage src={item.image} alt={item.title} />
                  <span>{item.title}</span>
                </article>
              ))}
            </div>
            <Link to="/events" className="btn ghost">Go to Events</Link>
          </div>
        ) : null}
      </section>

      <section className="archive-section card home-section-enter delay-1 reveal-on-scroll home-section-card">
        <div className="section-head reveal-on-scroll">
          <h2>Previous Events Archive</h2>
          <p>Proof of real campus-scale event execution with documented turnout.</p>
        </div>
        <div className="previous-events-grid reveal-on-scroll home-archive-grid">
          {previousEvents.map((item) => (
            <article key={item._id || item.id} className="archive-card poster-card">
              <SmartImage src={item.poster} alt={item.title} className="poster-img" />
              <div className="poster-content">
                <span className="archive-year">{dayjs(item.date).format('YYYY')}</span>
                <h3>{item.title}</h3>
                <p className="spotlight">{item.bannerLine}</p>
                <ul className="poster-meta">
                  <li>Timing: {item.time}</li>
                  <li>Venue: {item.venue}</li>
                  <li>Attended: {Number(item.attendedStudents || 0).toLocaleString()} students</li>
                  <li>Department: {item.department}</li>
                </ul>
              </div>
            </article>
          ))}
        </div>
        {previousEvents.length === 0 ? (
          <div className="history-empty">
            <p>Previous event highlights are being updated.</p>
            <small>Open the archive page to view synced event records.</small>
            <div className="home-empty-visuals">
              {archiveFallbackImages.map((item) => (
                <article key={item.title} className="home-empty-card">
                  <SmartImage src={item.image} alt={item.title} />
                  <span>{item.title}</span>
                </article>
              ))}
            </div>
            <Link to="/previous-events" className="btn ghost">Open Archive</Link>
          </div>
        ) : null}
        <Link to="/previous-events" className="text-link">See complete archive</Link>
      </section>

      <section className="category-strip home-section-enter delay-2 reveal-on-scroll home-tags-card">
        <span>Cultural</span>
        <span>Technical</span>
        <span>Sports</span>
        <span>Workshops</span>
      </section>
    </div>
  );
}

export default HomePage;
