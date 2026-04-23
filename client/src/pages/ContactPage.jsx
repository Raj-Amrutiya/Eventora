import { useState } from 'react';
import http from '../api/http';

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [feedback, setFeedback] = useState('');

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      const response = await http.post('/contact', form);
      setFeedback(response.data.message);
      setForm({ name: '', email: '', message: '' });
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Message failed.');
    }
  };

  return (
    <div className="page-shell contact-page-wide">
      <section className="card contact-main-card">
        <h2>Contact Event Team</h2>
        <p>Reach the Eventora support team for registration, ticketing, and participation queries.</p>
        <form onSubmit={submitForm}>
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </label>
          <label>
            Message
            <textarea
              rows={5}
              value={form.message}
              onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
              required
            />
          </label>
          <button className="btn">Send Message</button>
        </form>
        {feedback ? <p>{feedback}</p> : null}
      </section>

      <section className="contact-side-grid">
        <article className="card">
          <h3>Campus Event Office</h3>
          <p>Student Activity Cell, Ganpat University</p>
          <p>Kherva, Mehsana, Gujarat - 384012</p>
          <p>Email: events@ganpatuniversity.edu.in</p>
          <p>Phone: +91 2762 226000</p>
        </article>

        <article className="card">
          <h3>Support Hours</h3>
          <p>Monday to Friday: 09:30 AM - 06:00 PM</p>
          <p>Saturday: 10:00 AM - 02:00 PM</p>
          <p>Ticket escalation: admin dashboard help desk</p>
        </article>

        <article className="card">
          <h3>Common Help</h3>
          <p>Login issue: ensure backend server is running on port 5000.</p>
          <p>Booking issue: verify seats availability in event details.</p>
          <p>QR issue: open My Tickets and download QR again.</p>
        </article>
      </section>
    </div>
  );
}

export default ContactPage;
