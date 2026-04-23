import { useEffect, useState } from 'react';
import http from '../../api/http';

function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const response = await http.get('/bookings/admin');
      setBookings(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, bookingStatus) => {
    setError('');
    setFeedback('');
    try {
      await http.patch(`/bookings/${id}/status`, { bookingStatus });
      setFeedback(`Booking marked as ${bookingStatus}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update booking status.');
    }
  };

  const updatePayment = async (id, paymentStatus) => {
    setError('');
    setFeedback('');
    try {
      await http.patch(`/bookings/${id}/payment`, {
        paymentStatus,
        note: `Payment updated to ${paymentStatus} by admin`,
      });
      setFeedback(`Payment marked as ${paymentStatus}.`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update payment status.');
    }
  };

  const updateCheckIn = async (id, checkInStatus) => {
    setError('');
    setFeedback('');
    try {
      await http.patch(`/bookings/${id}/check-in`, { checkInStatus });
      setFeedback(checkInStatus === 'checked_in' ? 'Check-in marked successfully.' : 'Check-in reset successfully.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update check-in status.');
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesBooking = bookingFilter === 'all' || booking.bookingStatus === bookingFilter;
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
    const query = search.trim().toLowerCase();
    if (!query) {
      return matchesBooking && matchesPayment;
    }

    const haystack = [
      booking.bookingReference,
      booking.eventId?.title,
      booking.userId?.name,
      booking.userId?.email,
      (booking.selectedSeats || []).join(', '),
    ]
      .join(' ')
      .toLowerCase();

    return matchesBooking && matchesPayment && haystack.includes(query);
  });

  const approvedCount = bookings.filter((booking) => booking.bookingStatus === 'approved').length;
  const cancelledCount = bookings.filter((booking) => booking.bookingStatus === 'cancelled').length;
  const paidCount = bookings.filter((booking) => booking.paymentStatus === 'paid').length;
  const failedCount = bookings.filter((booking) => booking.paymentStatus === 'failed').length;
  const checkedInCount = bookings.filter((booking) => booking.checkInStatus === 'checked_in').length;

  if (loading) {
    return <div className="card">Loading bookings...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h2>Manage Bookings</h2>
          <p>Track booking and payment states with quick operational controls.</p>
        </div>
      </div>

      <section className="admin-metric-row">
        <article className="admin-metric-card">
          <span>Total Bookings</span>
          <strong>{bookings.length}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Cancelled</span>
          <strong>{cancelledCount}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Paid / Failed</span>
          <strong>{paidCount} / {failedCount}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Checked In</span>
          <strong>{checkedInCount}</strong>
        </article>
      </section>

      {feedback ? <p className="success-text">{feedback}</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="admin-toolbar card">
        <input
          className="admin-search"
          placeholder="Search by ref, event, user, seat"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={bookingFilter} onChange={(e) => setBookingFilter(e.target.value)}>
          <option value="all">All Booking Status</option>
          <option value="approved">Approved</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
          <option value="all">All Payment Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="table-wrap admin-table-wrap">
        <table>
          <thead><tr><th>Ref</th><th>Event</th><th>User</th><th>Seats</th><th>Tickets</th><th>Booking</th><th>Payment</th><th>Check-In</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredBookings.map((booking) => (
              <tr key={booking._id}>
                <td>{booking.bookingReference || 'N/A'}</td>
                <td>{booking.eventId?.title}</td>
                <td>{booking.userId?.name}</td>
                <td>{(booking.selectedSeats || []).join(', ') || 'N/A'}</td>
                <td>{booking.tickets}</td>
                <td><span className={`status-pill ${booking.bookingStatus}`}>{booking.bookingStatus}</span></td>
                <td><span className={`status-pill ${booking.paymentStatus}`}>{booking.paymentStatus}</span></td>
                <td><span className={`status-pill ${booking.checkInStatus === 'checked_in' ? 'approved' : 'pending'}`}>{booking.checkInStatus === 'checked_in' ? 'checked_in' : 'not_checked_in'}</span></td>
                <td className="admin-table-actions stack">
                  <button className="btn ghost" onClick={() => updateStatus(booking._id, 'approved')}>Approve</button>
                  <button className="btn danger" onClick={() => updateStatus(booking._id, 'cancelled')}>Cancel</button>
                  <button className="btn ghost" onClick={() => updatePayment(booking._id, 'paid')}>Mark Paid</button>
                  <button className="btn ghost" onClick={() => updatePayment(booking._id, 'failed')}>Mark Failed</button>
                  <button className="btn ghost" onClick={() => updateCheckIn(booking._id, 'checked_in')}>Mark Check-In</button>
                  <button className="btn ghost" onClick={() => updateCheckIn(booking._id, 'not_checked_in')}>Reset Check-In</button>
                </td>
              </tr>
            ))}
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="admin-empty">No bookings found for selected filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminBookingsPage;
