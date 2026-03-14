import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ProtectedRoute: wraps a page component and enforces auth + optional role check.
//
// Usage:
//   <ProtectedRoute>                       — any logged-in user
//   <ProtectedRoute requiredRole="admin">  — admin only
//   <ProtectedRoute requiredRole="faculty"> — faculty only
//
// While auth is loading (checking localStorage token), shows a spinner.
// If not logged in → redirect to /login.
// If wrong role → redirect to login (not access denied — keeps the UI simple).
export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  // Still checking if the stored token is valid — don't flash login page yet
  if (loading) {
    return (
      <div style={styles.center}>
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but wrong role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to the correct dashboard instead of a cryptic error
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

const styles = {
  center: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', fontFamily: 'sans-serif', color: '#666',
  },
};
