import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// AuthContext holds the global auth state for the entire app.
// Any component can call useAuth() to get the current user or call login/logout.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  // loading = true while we check whether a stored token is still valid.
  // This prevents the app from flashing the login page before confirming auth.
  const [loading, setLoading] = useState(true);

  // On every page load/refresh: check if there's a token in localStorage,
  // and if so, validate it by calling GET /auth/me.
  // If the token is expired or tampered, the Axios 401 interceptor will
  // clear it and redirect to login automatically.
  useEffect(() => {
    const token = localStorage.getItem('ftta_token');
    if (!token) {
      setLoading(false); // no token → definitely not logged in, stop loading
      return;
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => {
        // Token was invalid — clear it so we don't get stuck in a loop
        localStorage.removeItem('ftta_token');
      })
      .finally(() => setLoading(false));
  }, []);

  // login: stores the JWT and fetches user info from /auth/me.
  // Called by AuthCallback.jsx after the OAuth redirect brings back a token.
  // Returns the user object so the caller can redirect based on role.
  async function login(token) {
    localStorage.setItem('ftta_token', token);
    const { data } = await api.get('/auth/me');
    setUser(data);
    return data;
  }

  // logout: calls the backend (for future token blacklisting), then clears local state.
  function logout() {
    api.post('/auth/logout').catch(() => {}); // fire-and-forget — don't block on this
    localStorage.removeItem('ftta_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth: the hook components use to access auth state.
// Usage: const { user, loading, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
