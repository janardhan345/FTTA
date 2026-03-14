import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// useAvailability: polls the admin availability endpoint for real-time faculty status.
// Used by the admin dashboard to show which faculty are currently in/out of session.
//
// Usage:
//   const { availability, loading, error } = useAvailability();
export function useAvailability(pollIntervalMs = 5000) {
  const [availability, setAvailability] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchAvailability = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/availability');
      setAvailability(data);
      setError(null);
    } catch {
      setError('Could not load faculty availability');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
    const interval = setInterval(fetchAvailability, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchAvailability, pollIntervalMs]);

  return { availability, loading, error, refresh: fetchAvailability };
}
