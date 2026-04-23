import SmartImage from '../components/SmartImage';

function AboutPage() {
  return (
    <div className="page-shell">
      <section className="card about-hero about-hero-grid">
        <div className="about-hero-copy">
          <p className="kicker about-kicker">About This Platform</p>
          <h2>Smart College Event Management and Ticketing Platform</h2>
          <p>
            Eventora is built for Ganpat University to digitize the full student event lifecycle from discovery and
            seat booking to QR-based verification and admin operations.
          </p>
          <div className="about-mini-stats">
            <article>
              <strong>10,000+</strong>
              <span>Large-scale venue capacity support</span>
            </article>
            <article>
              <strong>24/7</strong>
              <span>Student booking availability</span>
            </article>
            <article>
              <strong>Role-based</strong>
              <span>Admin and user access controls</span>
            </article>
          </div>
        </div>
        <SmartImage
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
          alt="Students collaborating during a university event"
          className="about-hero-image"
        />
      </section>

      <section className="about-grid">
        <article className="card">
          <h3>Project Objectives</h3>
          <ul>
            <li>Reduce manual registration queues and paper passes.</li>
            <li>Provide transparent seat availability for students.</li>
            <li>Enable secure and role-based management for admin teams.</li>
            <li>Improve participation using a clean mobile-ready interface.</li>
          </ul>
        </article>

        <article className="card">
          <h3>Key Security Features</h3>
          <ul>
            <li>JWT authentication and protected routes.</li>
            <li>Role-based authorization for admin operations.</li>
            <li>Validation and rate limiting on API requests.</li>
            <li>Secure QR ticket generation per booking.</li>
          </ul>
        </article>

        <article className="card">
          <h3>Technology Stack</h3>
          <ul>
            <li>Frontend: React + Vite + responsive CSS system.</li>
            <li>Backend: Node.js + Express REST APIs.</li>
            <li>Database: MongoDB with Mongoose schemas.</li>
            <li>Utilities: Dayjs, Axios, QRCode and secure middleware.</li>
          </ul>
        </article>
      </section>

      <section className="about-grid about-grid-2">
        <article className="card about-flow-card">
          <h3>How The Platform Works</h3>
          <ol className="about-flow-list">
            <li>Admin creates and publishes events with venue, timing, and pricing.</li>
            <li>Students discover events and reserve seats using secure authentication.</li>
            <li>Payment and booking details are saved with transaction metadata.</li>
            <li>QR + PDF ticket is generated and sent via email confirmation.</li>
            <li>Admin manages bookings, users, reports, and communication logs.</li>
          </ol>
        </article>

        <article className="card about-highlights-card">
          <h3>Real Operational Data Stored</h3>
          <ul>
            <li>User signup and login activity logs</li>
            <li>Booking references, seat maps, and status lifecycle</li>
            <li>Payment amount, method, and transaction identifiers</li>
            <li>Event announcements and email delivery records</li>
            <li>Contact submissions and audit trail actions</li>
          </ul>
        </article>
      </section>

      <section className="about-gallery-grid">
        <article className="card about-gallery-item">
          <SmartImage
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80"
            alt="Campus auditorium during a seminar"
            className="about-gallery-image"
          />
          <div>
            <h3>Built For Real Campus Events</h3>
            <p>
              Designed for cultural festivals, technical conventions, workshops, and large university gatherings.
            </p>
          </div>
        </article>

        <article className="card about-gallery-item">
          <SmartImage
            src="https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80"
            alt="Conference participants in a university event hall"
            className="about-gallery-image"
          />
          <div>
            <h3>Presentation-Ready For Final Year Viva</h3>
            <p>
              Includes previous event evidence, measurable attendance data, and complete admin reporting workflows.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}

export default AboutPage;
