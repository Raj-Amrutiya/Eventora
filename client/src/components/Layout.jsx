import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';

function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();

  const publicNavItems = [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/previous-events', label: 'Previous Events' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const privateNavItems = [
    { to: '/wallet', label: 'Wallet' },
    { to: '/history', label: 'History' },
    { to: '/my-tickets', label: 'My Tickets' },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/events', label: 'Manage Events' },
    { to: '/admin/users', label: 'Manage Users' },
    { to: '/admin/bookings', label: 'Manage Bookings' },
    { to: '/admin/reports', label: 'Reports' },
  ];

  const navItems = isAdmin ? adminNavItems : user ? [...publicNavItems, ...privateNavItems] : publicNavItems;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <img src={logo} alt="Eventora" className="brand-mark" />
            <span className="brand-copy">
              Eventora
              <small>Ganpat University</small>
            </span>
          </Link>
          <nav className="nav-links">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="topbar-actions">
            {user ? (
              <>
                <Link to="/profile" className={location.pathname === '/profile' ? 'pill active' : 'pill'}>
                  {user.name}
                </Link>
                {isAdmin ? (
                  <Link to="/admin" className={location.pathname.startsWith('/admin') ? 'pill active' : 'pill'}>
                    Admin Panel
                  </Link>
                ) : null}
                <button type="button" className="btn ghost" onClick={logout}>Logout</button>
              </>
            ) : (
              <Link to="/auth" className="btn">Login</Link>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src={logo} alt="Eventora" className="footer-logo" />
            <div>
              <h4>Eventora - Smart College Event Management & Ticketing Platform</h4>
              <p>Built for Ganpat University with wallet checkout, QR tickets, and admin-ready event operations.</p>
            </div>
          </div>

          <div className="footer-details">
            <div className="footer-feature-tags">
              <span>Wallet Payments</span>
              <span>QR Entry</span>
              <span>Instant Refunds</span>
              <span>Live Seats</span>
            </div>
            <p className="footer-meta">Student Activity Cell, Ganpat University, Kherva, Mehsana, Gujarat</p>
            <p className="footer-meta">Support: events@ganpatuniversity.edu.in | +91 2762 226000</p>
          </div>

          <div className="footer-links">
            <Link to="/terms-and-conditions">Terms & Conditions</Link>
            <Link to="/about">About Platform</Link>
            <Link to="/contact">Contact Team</Link>
            <span>Privacy Policy</span>
            <span>Eventora © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
