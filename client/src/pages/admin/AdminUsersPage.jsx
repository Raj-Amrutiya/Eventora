import { useEffect, useState } from 'react';
import http from '../../api/http';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await http.get('/users/admin');
      setUsers(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const toggleBlock = async (id, isBlocked) => {
    await http.patch(`/users/admin/${id}/block`, { isBlocked: !isBlocked });
    loadUsers();
  };

  const filteredUsers = users.filter((user) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query);
  });

  const totalUsers = users.length;
  const activeUsers = users.filter((user) => !user.isBlocked).length;
  const blockedUsers = users.filter((user) => user.isBlocked).length;
  const adminUsers = users.filter((user) => user.role === 'admin').length;

  if (loading) {
    return <div className="card">Loading users...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h2>Manage Users</h2>
          <p>Monitor user roles and quickly block or unblock platform access.</p>
        </div>
      </div>

      <section className="admin-metric-row">
        <article className="admin-metric-card">
          <span>Total Users</span>
          <strong>{totalUsers}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Active</span>
          <strong>{activeUsers}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Blocked</span>
          <strong>{blockedUsers}</strong>
        </article>
        <article className="admin-metric-card">
          <span>Admins</span>
          <strong>{adminUsers}</strong>
        </article>
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="admin-toolbar card">
        <input
          className="admin-search"
          placeholder="Search by name, email or role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrap admin-table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td><span className={`status-pill ${user.isBlocked ? 'cancelled' : 'approved'}`}>{user.isBlocked ? 'Blocked' : 'Active'}</span></td>
                <td className="admin-table-actions">
                  {user.role !== 'admin' ? (
                    <button className="btn ghost" onClick={() => toggleBlock(user._id, user.isBlocked)}>
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty">No users found for your search.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsersPage;
