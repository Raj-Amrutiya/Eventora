import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import http from '../api/http';

function HistoryPage() {
  const [history, setHistory] = useState({ bookingHistory: [], paymentHistory: [] });
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await http.get('/bookings/history');
        setHistory(response.data.data);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const groupedBookings = history.bookingHistory.reduce((acc, entry) => {
    const date = dayjs(entry.bookedAt).format('DD MMM YYYY');
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    const statusMap = {
      confirmed: 'approved',
      pending: 'pending',
      cancelled: 'cancelled',
      paid: 'approved',
      failed: 'failed',
    };
    return statusMap[status?.toLowerCase()] || 'pending';
  };

  return (
    <div className="page-shell">
      <div className="section-head">
        <h2>My History</h2>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>Track your bookings and transactions</p>
      </div>

      <div className="history-tabs">
        <button
          className={activeTab === 'bookings' ? 'btn' : 'btn ghost'}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings {history.bookingHistory.length > 0 && `(${history.bookingHistory.length})`}
        </button>
        <button
          className={activeTab === 'payments' ? 'btn' : 'btn ghost'}
          onClick={() => setActiveTab('payments')}
        >
          Payments {history.paymentHistory.length > 0 && `(${history.paymentHistory.length})`}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Loading history...
        </div>
      ) : activeTab === 'bookings' ? (
        <div className="history-section">
          {history.bookingHistory.length === 0 ? (
            <div className="history-empty">
              <p>No bookings yet</p>
              <small>Your booking history will appear here</small>
            </div>
          ) : (
            Object.entries(groupedBookings).map(([date, entries]) => (
              <div key={date} className="history-group">
                <h3 className="history-date">{date}</h3>
                <div className="history-items">
                  {entries.map((entry) => (
                    <article key={entry.id} className="history-card">
                      <div className="history-card-header">
                        <div>
                          <h4>{entry.eventTitle}</h4>
                          <small className="history-ref">Ref: {entry.bookingReference}</small>
                        </div>
                        <span className={`status-pill ${getStatusColor(entry.bookingStatus)}`}>
                          {entry.bookingStatus}
                        </span>
                      </div>
                      <div className="history-card-details">
                        <div className="detail-item">
                          <span className="detail-label">📅 Date</span>
                          <span className="detail-value">{dayjs(entry.eventDate).format('DD MMM YYYY')} • {entry.eventTime}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">📍 Venue</span>
                          <span className="detail-value">{entry.venue}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">🎟️ Tickets</span>
                          <span className="detail-value">{entry.tickets} ticket{entry.tickets !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">✅ Check-In</span>
                          <span className="detail-value">
                            {entry.checkInStatus === 'checked_in'
                              ? `Checked in${entry.checkedInAt ? ` on ${dayjs(entry.checkedInAt).format('DD MMM YYYY, hh:mm A')}` : ''}`
                              : 'Not checked in'}
                          </span>
                        </div>
                        {entry.seats && entry.seats.length > 0 && (
                          <div className="detail-item">
                            <span className="detail-label">💺 Seats</span>
                            <span className="detail-value">{entry.seats.join(', ')}</span>
                          </div>
                        )}
                      </div>
                      {entry.cancelledAt && (
                        <div className="history-cancelled">
                          Cancelled: {dayjs(entry.cancelledAt).format('DD MMM YYYY hh:mm A')}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="history-section">
          {history.paymentHistory.length === 0 ? (
            <div className="history-empty">
              <p>No payments yet</p>
              <small>Your payment history will appear here</small>
            </div>
          ) : (
            history.paymentHistory.map((entry, index) => (
              <article key={`${entry.bookingId}-${index}`} className="payment-card">
                <div className="payment-card-header">
                  <div>
                    <h4>{entry.eventTitle}</h4>
                    <small className="history-ref">Booking: {entry.bookingReference}</small>
                  </div>
                  <span className={`status-pill ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </div>
                <div className="payment-card-grid">
                  <div className="payment-item">
                    <span className="payment-label">Amount</span>
                    <span className="payment-amount">₹ {entry.amount}</span>
                  </div>
                  <div className="payment-item">
                    <span className="payment-label">Method</span>
                    <span className="payment-value">{entry.method || 'N/A'}</span>
                  </div>
                  <div className="payment-item">
                    <span className="payment-label">Txn ID</span>
                    <span className="payment-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {entry.transactionId ? entry.transactionId.substring(0, 12) + '...' : 'N/A'}
                    </span>
                  </div>
                  <div className="payment-item">
                    <span className="payment-label">Date</span>
                    <span className="payment-value">{dayjs(entry.at).format('DD MMM YYYY')}</span>
                  </div>
                </div>
                {entry.note && <div className="payment-note">Note: {entry.note}</div>}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default HistoryPage;
