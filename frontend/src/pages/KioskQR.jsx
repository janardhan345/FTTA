import { useEffect } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { useQR } from '../hooks/useQR';

// KioskQR: full-screen QR display for the admin's dedicated kiosk device.
// This page runs on a browser tab that is left open permanently in the counselling area.
// Displays TWO QR codes:
//   1. Attendance QR - Faculty scan to check in/out (arrive/leave office)
//   2. Session QR - Faculty scan to start/end counseling sessions
// Both faculty scans update the QR data in real-time.
//
// Behavior:
//   - Polls GET /qr/current every 2 seconds
//   - Re-renders both QR images
//   - Uses the Wake Lock API to prevent the screen from sleeping
//
// Route: /kiosk (admin only)
export default function KioskQR() {
  const { qrData, loading, error } = useQR(2000);

  // Screen Wake Lock: keeps the display on without user interaction.
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
      <div style={styles.themeToggleContainer}>
        <ThemeToggle />
      </div>
      <h1 style={styles.title}>Counselling Session Check-In</h1>
      <p style={styles.subtitle}>Faculty: scan the appropriate QR with the FTTA app on your phone</p>

      {loading && <p style={styles.status}>Loading QR codes...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {qrData && (
        <div style={styles.qrContainerWrapper}>
          {/* Attendance QR */}
          <div style={styles.qrColumn}>
            <h3 style={styles.qrLabel}>📍 Check Attendance</h3>
            <p style={styles.qrSubtitle}>(Scan to Check In / Check Out)</p>
            <div className="kiosk-qr-container" style={styles.qrContainer}>
              <img
                src={qrData.attendanceImage}
                alt="Attendance QR code"
                className="kiosk-qr-image"
                style={styles.qrImage}
              />
            </div>
          </div>

          {/* Session QR */}
          <div style={styles.qrColumn}>
            <h3 style={styles.qrLabel}>👥 Session Control</h3>
            <p style={styles.qrSubtitle}>(Scan to Start / End Session)</p>
            <div className="kiosk-qr-container" style={styles.qrContainer}>
              <img
                src={qrData.sessionImage}
                alt="Session QR code"
                className="kiosk-qr-image"
                style={styles.qrImage}
              />
            </div>
          </div>
        </div>
      )}

      {qrData && (
        <div style={styles.footer}>
          <p style={styles.refreshNote}>↻ Updates automatically after each scan</p>
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
    padding: '2rem', boxSizing: 'border-box', position: 'relative',
  },
  themeToggleContainer:{ position: 'absolute', top: '1rem', right: '1rem' },
  title: {
    fontSize: '2.5rem', fontWeight: 700, margin: '0 0 0.5rem', textAlign: 'center',
  },
  subtitle: {
    color: '#aaa', marginBottom: '2rem', fontSize: '1.1rem', textAlign: 'center',
  },
  qrContainerWrapper: {
    display: 'flex', gap: '3rem', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap',
  },
  qrColumn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
  },
  qrLabel: {
    margin: 0, fontSize: '1.3rem', color: '#fff', textAlign: 'center',
  },
  qrSubtitle: {
    margin: '0 0 1rem', fontSize: '0.9rem', color: '#bbb', textAlign: 'center',
  },
  qrContainer: {
    background: '#fff', borderRadius: 16, padding: '1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 350, minHeight: 350,
  },
  qrImage: {
    width: 320, height: 320, display: 'block',
  },
  status: { color: '#aaa', fontSize: '1rem' },
  error: { color: '#e55', fontSize: '1rem' },
  footer: { marginTop: '3rem', textAlign: 'center' },
  refreshNote: { color: '#555', margin: 0, fontSize: '0.8rem' },
};
