import { useEffect } from 'react';
import { useQR } from '../hooks/useQR';

// KioskQR: full-screen QR display for the admin's dedicated kiosk device.
// This page runs on a browser tab that is left open permanently in the counselling area.
// Faculty scan this QR from their phone's /scan page.
//
// Behavior:
//   - Polls GET /qr/current every 2 seconds
//   - Re-renders the QR image whenever it changes (after each faculty scan)
//   - Uses the Wake Lock API to prevent the screen from sleeping
//
// Route: /kiosk (admin only)
export default function KioskQR() {
  const { qrData, loading, error } = useQR(2000);

  // Screen Wake Lock: keeps the display on without user interaction.
  // Without this, the screen goes dark after a few minutes and faculty can't scan.
  // 'wakeLock' is available in modern Chrome/Edge — ignored silently if unsupported.
  useEffect(() => {
    let wakeLock = null;

    async function acquireWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
        } catch {
          // Not supported or permission denied — non-critical, continue without it
        }
      }
    }

    acquireWakeLock();

    // Release the lock when the component unmounts
    return () => {
      wakeLock?.release().catch(() => {});
    };
  }, []);

  return (
    <div className="kiosk-page" style={styles.page}>
      <h1 style={styles.title}>Counselling Session Check-In</h1>
      <p style={styles.subtitle}>
        Faculty: scan this QR with the FTTA app on your phone
      </p>

      <div className="kiosk-qr-container" style={styles.qrContainer}>
        {loading && <p style={styles.status}>Loading QR...</p>}
        {error   && <p style={styles.error}>{error}</p>}
        {qrData  && (
          // imageBase64 is a "data:image/png;base64,..." string.
          // The browser renders it as an image directly — no file download needed.
          <img
            src={qrData.imageBase64}
            alt="Scan this QR code"
            className="kiosk-qr-image"
            style={styles.qrImage}
          />
        )}
      </div>

      {qrData && (
        <div style={styles.footer}>
          <p style={styles.expiry}>
            Expires: {new Date(qrData.expiresAt).toLocaleTimeString()}
          </p>
          <p style={styles.refreshNote}>
            ↻ Updates automatically after each scan
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh',
    background: '#1a1a2e', color: '#fff', fontFamily: 'sans-serif',
    padding: '2rem', boxSizing: 'border-box',
  },
  title: {
    fontSize: '2rem', fontWeight: 700, margin: '0 0 0.5rem', textAlign: 'center',
  },
  subtitle: {
    color: '#aaa', marginBottom: '2.5rem', fontSize: '1.1rem', textAlign: 'center',
  },
  qrContainer: {
    background: '#fff', borderRadius: 16, padding: '1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 350, minHeight: 350,
  },
  qrImage: {
    width: 320, height: 320, display: 'block',
  },
  status: { color: '#555', fontSize: '1rem' },
  error:  { color: '#e55', fontSize: '1rem' },
  footer: { marginTop: '1.5rem', textAlign: 'center' },
  expiry: { color: '#888', margin: '0.25rem 0', fontSize: '0.9rem' },
  refreshNote: { color: '#555', margin: 0, fontSize: '0.8rem' },
};
