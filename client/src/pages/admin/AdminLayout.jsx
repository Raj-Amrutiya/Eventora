import { NavLink, Outlet } from 'react-router-dom';

function AdminLayout() {
  const items = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/events', label: 'Manage Events' },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/bookings', label: 'Manage Bookings' },
    { to: '/admin/reports', label: 'Reports' },
  ];

  return (
    <div className="admin-shell">
      <aside>
        <h2>Admin Panel</h2>
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
            {item.label}
          </NavLink>
        ))}
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}

export default AdminLayout;
