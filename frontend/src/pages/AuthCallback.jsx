import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// AuthCallback: the page Google redirects to after a successful OAuth login.
// The backend appended ?token=<jwt> to the URL before redirecting here.
// This page reads that token, stores it, and redirects the user to their dashboard.
//
// Route: /auth/callback
export default function AuthCallback() {
  const { login }           = useAuth();
  const navigate            = useNavigate();
  const [searchParams]      = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      // Something went wrong in the OAuth flow (wrong email domain, Google error, etc.)
      navigate('/login?error=unauthorized', { replace: true });
      return;
    }

    // login() stores the token and fetches user info from /auth/me
    login(token)
      .then((user) => {
        // Redirect to the correct dashboard based on role
        navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      })
      .catch(() => {
        navigate('/login?error=login_failed', { replace: true });
      });
  }, []); // run once on mount

  return (
    <div style={styles.center}>
      <p style={styles.text}>Signing you in...</p>
    </div>
  );
}

const styles = {
  center: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#f5f5f5',
  },
  text: {
    fontFamily: 'sans-serif', color: '#555', fontSize: '1.1rem',
  },
};
