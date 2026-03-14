import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

// useQR: polls the backend every `pollIntervalMs` milliseconds for the latest QR code.
//
// Why polling instead of WebSockets?
// Polling is simpler and reliable enough here. The kiosk displays the QR
// and needs to update after each faculty scan. A 2-second poll means at most
// 2 seconds of a "stale" QR. WebSockets would be faster but much more complex.
//
// Usage:
//   const { qrData, loading, error } = useQR();
//   qrData.imageBase64 → put in <img src={qrData.imageBase64} />
export function useQR(pollIntervalMs = 2000) {
  const [qrData,  setQrData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchQR = useCallback(async () => {
    try {
      const { data } = await api.get('/qr/current');
      setQrData(data);
      setError(null);
    } catch {
      setError('Could not load QR code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQR(); // fetch immediately on mount

    // Then poll on the interval
    const interval = setInterval(fetchQR, pollIntervalMs);

    // Cleanup: stop polling when the component unmounts
    return () => clearInterval(interval);
  }, [fetchQR, pollIntervalMs]);

  return { qrData, loading, error, refresh: fetchQR };
}
