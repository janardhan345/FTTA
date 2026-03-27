import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// Login: the entry point for all users.
// Clicking the button redirects to the backend's Google OAuth route.
// After Google approves, the backend redirects to /auth/callback?token=...
//
// Route: /login
export default function Login() {
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const error = searchParams.get('error');

  // If already logged in, skip login and go to the right dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) return null; // wait silently

  return (
    <div className="mobile-login-page" style={styles.page}>
      <div className="mobile-login-card" style={styles.card}>
        <h1 style={styles.title}>FTTA</h1>
        <p style={styles.subtitle}>Faculty Time Tracking & Availability</p>

        {error && (
          <div style={styles.errorBox}>
            {error === 'unauthorized'
              ? 'Your email is not authorized. Use your college Google account.'
              : 'Login failed. Please try again.'}
          </div>
        )}

        {/* Redirect directly to the backend OAuth start URL.
            The backend (Passport) will take it from there. */}
        <a className="mobile-login-button" href={`${API_URL}/auth/google`} style={styles.button}>
          <span style={styles.googleIcon}>G</span>
          Sign in with Google
        </a>

        <p style={styles.hint}>Use your college-issued Google account</p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#f0f2f5',
  },
  card: {
    background: '#fff', borderRadius: 12, padding: '2.5rem 2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center',
    minWidth: 320,
  },
  title: {
    fontSize: '2.5rem', fontWeight: 700, margin: 0,
    color: '#1a1a2e', fontFamily: 'sans-serif',
  },
  subtitle: {
    color: '#666', margin: '0.5rem 0 2rem', fontFamily: 'sans-serif',
  },
  button: {
    display: 'inline-flex', alignItems: 'center', gap: '0.75rem',
    background: '#4285f4', color: '#fff', padding: '0.75rem 1.5rem',
    borderRadius: 8, textDecoration: 'none', fontFamily: 'sans-serif',
    fontWeight: 600, fontSize: '1rem',
  },
  googleIcon: {
    background: '#fff', color: '#4285f4', borderRadius: '50%',
    width: 24, height: 24, display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: '0.9rem',
  },
  hint: {
    marginTop: '1rem', color: '#999', fontSize: '0.85rem', fontFamily: 'sans-serif',
  },
  errorBox: {
    background: '#fee', border: '1px solid #fcc', borderRadius: 6,
    padding: '0.75rem', marginBottom: '1rem', color: '#c00',
    fontSize: '0.9rem', fontFamily: 'sans-serif',
  },
};
