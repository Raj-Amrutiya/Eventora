import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import http from '../api/http';

function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState('');

  const loadTickets = async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const response = await http.get('/bookings/my-tickets');
      setTickets(response.data.data || []);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load tickets right now.');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const summary = useMemo(() => {
    const activeTickets = tickets.filter((booking) => booking.bookingStatus !== 'cancelled').length;
    const cancelledTickets = tickets.filter((booking) => booking.bookingStatus === 'cancelled').length;

    return [
      { label: 'Total bookings', value: tickets.length },
      { label: 'Active tickets', value: activeTickets },
      { label: 'Cancelled', value: cancelledTickets },
    ];
  }, [tickets]);

  const getStatusClass = (value) => {
    if (!value) {
      return 'pending';
    }

    const normalized = value.toLowerCase();

    if (normalized.includes('cancel')) return 'cancelled';
    if (normalized.includes('paid') || normalized.includes('confirm') || normalized.includes('approved')) return 'approved';
    if (normalized.includes('fail')) return 'failed';
    return 'pending';
  };

  const cancelBooking = async (bookingId) => {
    await http.patch(`/bookings/${bookingId}/cancel`);
    loadTickets();
  };

  const downloadTicketPdf = async (bookingId, bookingReference) => {
    const response = await http.get(`/bookings/${bookingId}/ticket-pdf`, {
      responseType: 'blob',
    });

    const fileUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = fileUrl;
    link.setAttribute('download', `${bookingReference || bookingId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(fileUrl);
  };

  const handleRefresh = () => {
    loadTickets({ silent: true });
  };

  return (
    <div className="page-shell tickets-page">
      <section className="hero-block tickets-hero">
        <div className="section-head">
          <div>
            <p className="kicker">Ticket Vault</p>
            <h1>My Tickets</h1>
            <p>Download QR passes, manage bookings, and keep every event ticket in one clean timeline.</p>
          </div>
          <div className="tickets-head-tools">
            <button
              type="button"
              className={`btn ghost ${refreshing ? 'is-refreshing' : ''}`}
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <p className="tickets-refresh-meta">
              {lastUpdated ? `Last updated: ${dayjs(lastUpdated).format('DD MMM, hh:mm A')}` : 'Not synced yet'}
            </p>
          </div>
        </div>

        <div className="ticket-summary-grid">
          {summary.map((item) => (
            <article key={item.label} className="ticket-summary-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="card tickets-panel">
        <div className="section-head tickets-panel-head">
          <div>
            <h2>All Bookings</h2>
            <p>Each ticket includes the QR pass, payment information, and ticket PDF download.</p>
          </div>
          <span className="badge">{tickets.length} items</span>
        </div>

        {loading ? <p className="loading-shell">Loading your tickets...</p> : null}

        {!loading && error ? <div className="history-empty"><p>{error}</p><small>Please try again in a moment.</small></div> : null}

        {!loading && !error && tickets.length === 0 ? (
          <div className="history-empty tickets-empty">
            <p>No tickets yet.</p>
            <small>Once you book an event, your QR code and PDF pass will appear here.</small>
          </div>
        ) : null}

        {!loading && !error && tickets.length > 0 ? (
          <div className="tickets-grid">
            {tickets.map((booking) => (
              <article className="ticket-card ticket-card-modern" key={booking._id}>
                <div className="ticket-card-header">
                  <div>
                    <p className="ticket-label">Booking Reference</p>
                    <h3>{booking.eventId?.title}</h3>
                    <p className="ticket-meta">
                      {dayjs(booking.eventId?.date).format('DD MMM YYYY')} · {booking.eventId?.time}
                    </p>
                  </div>
                  <div className="ticket-status-stack">
                    <span className={`status-pill ${getStatusClass(booking.bookingStatus)}`}>
                      {booking.bookingStatus || 'pending'}
                    </span>
                    <span className={`status-pill ${getStatusClass(booking.paymentStatus)}`}>
                      {booking.paymentStatus || 'pending'}
                    </span>
                    <span className={`status-pill ${booking.checkInStatus === 'checked_in' ? 'approved' : 'pending'}`}>
                      {booking.checkInStatus === 'checked_in' ? 'checked_in' : 'not_checked_in'}
                    </span>
                  </div>
                </div>

                <div className="ticket-card-body-grid">
                  <div className="ticket-info-card">
                    <span className="detail-label">Venue</span>
                    <strong>{booking.eventId?.venue || 'Venue unavailable'}</strong>
                  </div>
                  <div className="ticket-info-card">
                    <span className="detail-label">Tickets</span>
                    <strong>{booking.tickets}</strong>
                  </div>
                  <div className="ticket-info-card">
                    <span className="detail-label">Seats</span>
                    <strong>{(booking.selectedSeats || []).join(', ') || 'N/A'}</strong>
                  </div>
                  <div className="ticket-info-card">
                    <span className="detail-label">Payment</span>
                    <strong>{booking.paymentStatus || 'pending'}</strong>
                  </div>
                </div>

                <div className="ticket-payment-strip">
                  <div>
                    <span className="detail-label">Amount paid</span>
                    <strong className="payment-amount">INR {booking.paymentAmount || 0}</strong>
                  </div>
                  <div>
                    <span className="detail-label">Booking Ref</span>
                    <strong>{booking.bookingReference}</strong>
                  </div>
                </div>

                {booking.paymentMethod && booking.paymentMethod !== 'none' ? (
                  <div className="ticket-note">Payment Method: {booking.paymentMethod}</div>
                ) : null}

                {booking.paymentTransactionId ? (
                  <div className="ticket-note">Txn ID: {booking.paymentTransactionId}</div>
                ) : null}

                {booking.checkInStatus === 'checked_in' && booking.checkedInAt ? (
                  <div className="ticket-note">Checked in at: {dayjs(booking.checkedInAt).format('DD MMM YYYY, hh:mm A')}</div>
                ) : null}

                <div className="ticket-qr-wrap">
                  {booking.qrCode ? <img src={booking.qrCode} alt="QR Ticket" className="qr" /> : null}
                  <div className="ticket-actions">
                    {booking.qrCode ? (
                      <a className="btn ghost" href={booking.qrCode} download={`ticket-${booking._id}.png`}>
                        Download QR
                      </a>
                    ) : null}
                    <button className="btn ghost" onClick={() => downloadTicketPdf(booking._id, booking.bookingReference)}>
                      Download PDF
                    </button>
                    {booking.bookingStatus !== 'cancelled' ? (
                      <button className="btn danger" onClick={() => cancelBooking(booking._id)}>
                        Cancel Booking
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default MyTicketsPage;
