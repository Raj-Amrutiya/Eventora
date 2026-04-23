import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', agreeTerms: false });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === 'login';

  const passwordIsStrong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password);

  const validateAuthForm = () => {
    if (mode === 'signup' && form.name.trim().length < 2) {
      return 'Please enter a valid full name.';
    }
    if (mode === 'signup' && !passwordIsStrong) {
      return 'Password must be at least 8 characters and include letters and numbers.';
    }
    if (mode === 'signup' && form.password !== form.confirmPassword) {
      return 'Password and confirm password do not match.';
    }
    if (!form.agreeTerms) {
      return 'Please accept the terms and conditions to continue.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const validationError = validateAuthForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const response = await http.post(endpoint, payload);
      login(response.data.data);
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Start backend with: npm run dev in server folder.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your details.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-shell auth-layout">
      <section className="auth-sidepanel">
        <p className="kicker">Eventora Access</p>
        <h2>Welcome to the Ganpat University Event Portal</h2>
        <p>
          A secure student-first platform for event discovery, ticket booking and QR-based entry validation.
        </p>
        <div className="auth-stat-row">
          <article>
            <strong>24/7</strong>
            <span>Access</span>
          </article>
          <article>
            <strong>QR</strong>
            <span>Entry</span>
          </article>
          <article>
            <strong>Wallet</strong>
            <span>Ready</span>
          </article>
        </div>
        <ul className="auth-benefits">
          <li>Instant booking confirmations</li>
          <li>Secure JWT authentication</li>
          <li>Real-time seats and event updates</li>
        </ul>
        <div className="auth-event-panel">
          <h3>Popular Event Tracks</h3>
          <div className="auth-event-tags">
            <span>Cultural Fest</span>
            <span>Technical Expo</span>
            <span>Research Convention</span>
            <span>Sports Arena</span>
          </div>
          <p>
            Discover upcoming campus events, reserve your seats quickly, and receive booking confirmation with QR entry in minutes.
          </p>
        </div>
      </section>

      <section className="card auth-panel">
        <div className="auth-panel-top">
          <p className="auth-tag">{isLogin ? 'Student Login' : 'New Registration'}</p>
          <span className="badge">Secure</span>
        </div>
        <h2>{isLogin ? 'Sign in to continue' : 'Create your event account'}</h2>
        <p>Professional, secure and fast event access.</p>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label>
              Full Name
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </label>
          ) : null}

          <label>
            University Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="name@domain.com"
              required
            />
          </label>

          <label>
            Password
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={8}
                placeholder="Minimum 8 characters"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {mode === 'signup' ? (
            <label>
              Confirm Password
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                minLength={8}
                placeholder="Re-enter your password"
              />
            </label>
          ) : null}

          {mode === 'signup' ? (
            <p className={passwordIsStrong ? 'success-text' : 'hint-text'}>
              Password must include letters and numbers.
            </p>
          ) : null}

          <label className="terms-checkbox">
            <input
              type="checkbox"
              checked={form.agreeTerms}
              onChange={(e) => setForm((p) => ({ ...p, agreeTerms: e.target.checked }))}
              required
            />
            <span>
              I agree to the{' '}
              <Link to="/terms-and-conditions" className="inline-link">
                Terms & Conditions
              </Link>
              {' '}and Privacy Policy.
            </span>
          </label>

          <p className="auth-terms-inline">
            {isLogin
              ? 'By signing in, you agree to the Terms & Conditions and event communication policy.'
              : 'Your account will be used for booking confirmations, notifications, and login alerts.'}
          </p>

          {error ? <p className="error-text">{error}</p> : null}

          <button className="btn auth-submit" disabled={busy}>
            {busy ? 'Please wait...' : isLogin ? 'Sign In Securely' : 'Create Account'}
          </button>
        </form>

        <button
          type="button"
          className="text-btn switch-auth"
          onClick={() => {
            setMode(isLogin ? 'signup' : 'login');
            setError('');
            setForm((prev) => ({
              ...prev,
              agreeTerms: false,
              confirmPassword: '',
            }));
          }}
        >
          {isLogin ? 'New student? Create account' : 'Already have an account? Sign in'}
        </button>
      </section>
    </div>
  );
}

export default AuthPage;
