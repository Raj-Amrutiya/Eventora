import { useEffect, useState } from 'react';
import http from '../../api/http';

function AdminDashboardPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await http.get('/bookings/admin/summary');
        setSummary(response.data.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard summary.');
      }
    };
    load();
  }, []);

  if (error) {
    return <div className="card error-text">{error}</div>;
  }

  if (!summary) {
    return <div className="card">Loading dashboard...</div>;
  }

  return (
    <div className="admin-page">
      <h2>Admin Dashboard</h2>
      <div className="kpi-grid">
        <article className="card"><h3>Total Events</h3><p>{summary.totalEvents}</p></article>
        <article className="card"><h3>Total Users</h3><p>{summary.totalUsers}</p></article>
        <article className="card"><h3>Total Bookings</h3><p>{summary.totalBookings}</p></article>
        <article className="card"><h3>Checked In</h3><p>{summary.checkedInBookings || 0}</p></article>
        <article className="card"><h3>Total Revenue</h3><p>INR {summary.totalRevenue}</p></article>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
