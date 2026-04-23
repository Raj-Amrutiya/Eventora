import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { updateUser } = useAuth();

  useEffect(() => {
    const load = async () => {
      const response = await http.get('/users/profile');
      setProfile(response.data.data);
      setForm({
        name: response.data.data.user?.name || '',
        email: response.data.data.user?.email || '',
      });
    };
    load();
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    if (!payload.name || !payload.email) {
      setError('Name and email are required.');
      return;
    }

    setSaving(true);
    try {
      const response = await http.patch('/users/profile', payload);
      setProfile((previous) => ({
        ...previous,
        user: response.data.data,
      }));
      updateUser(response.data.data);
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return <div className="page-shell">Loading profile...</div>;
  }

  return (
    <div className="page-shell profile-grid">
      <section className="card profile-card">
        <h2>Profile</h2>
        <p>Role: {profile.user.role}</p>
        {message ? <p className="success-text">{message}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <form className="profile-form" onSubmit={saveProfile}>
          <label>
            <span>Full Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter full name"
              required
            />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Enter email"
              required
            />
          </label>
          <button className="btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </section>
      <section className="card">
        <h3>Event History</h3>
        {profile.eventHistory.map((history) => (
          <p key={history._id}>{history.eventId?.title} • {dayjs(history.createdAt).format('DD MMM YYYY')}</p>
        ))}
      </section>
    </div>
  );
}

export default ProfilePage;
