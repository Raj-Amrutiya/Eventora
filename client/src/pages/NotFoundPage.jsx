import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="page-shell">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link className="btn" to="/">Go Home</Link>
    </div>
  );
}

export default NotFoundPage;
