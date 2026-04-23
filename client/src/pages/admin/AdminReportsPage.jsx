import { useEffect, useState } from 'react';
import http from '../../api/http';

function AdminReportsPage() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await http.get('/bookings/admin/summary');
        setSummary(response.data.data);
        setError('');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load reports.');
      }
    };
    load();
  }, []);

  if (error) return <div className="card error-text">{error}</div>;

  if (!summary) return <div className="card">Loading reports...</div>;

  return (
    <div className="admin-page">
      <h2>Reports</h2>
      <div className="kpi-grid">
        <article className="card"><h3>Event-wise Participation</h3><p>Use booking data from dashboard and bookings table.</p></article>
        <article className="card"><h3>Revenue Report</h3><p>Current Revenue: INR {summary.totalRevenue}</p></article>
      </div>
    </div>
  );
}

export default AdminReportsPage;
