import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import QRScanner from '../components/QRScanner';
import api from '../api/axios';

// ScanQR: the page where a faculty member opens their camera to scan the kiosk QR.
// Workflow:
//   1. Faculty opens this page on their phone
//   2. Sees mode selection: "Check Attendance" or "Start Session"
//   3. After selecting mode, camera opens
//   4. QR is decoded → token sent to POST /qr/scan
//   5. Server returns { action, attendance/session: {...} }
//   6. Show result to faculty, then offer to go back to dashboard
//
// Route: /scan (faculty only)
export default function ScanQR() {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState(null); // 'ATTENDANCE' | 'SESSION' | null
  const [result, setResult] = useState(null); // { action, attendance/session }
  const [scanning, setScanning] = useState(false); // controls whether camera is shown
  const [error, setError] = useState(null);

  const attendanceToken = 'FTTA_ATTENDANCE';
  const sessionToken = 'FTTA_SESSION';

  async function onScanSuccess(decodedToken) {
    // Stop the scanner immediately so the same QR isn't scanned twice
    setScanning(false);

    try {
      const { data } = await api.post('/qr/scan', { token: decodedToken });
      setResult(data);
      setError(null);
    } catch (err) {
      const message = err.response?.data?.error || 'Scan failed. Please try again.';
      setError(message);
      // Re-enable scanner so they can retry
      setScanning(true);
    }
  }

  // If scan succeeded, show the result screen
  if (result) {
   const isAttendance = result.action === 'CHECKIN' || result.action === 'CHECKOUT';
    const isStart = result.action === 'START' || result.action === 'CHECKIN';

    let title, emoji, detail;
    if (isAttendance) {
      title = result.action === 'CHECKIN' ? 'Checked In!' : 'Checked Out!';
      emoji = result.action === 'CHECKIN' ? '✅' : '👋';
      const time = new Date(result.attendance.checkinTime);
      detail = `${result.action === 'CHECKIN' ? 'Arrival' : 'Departure'} recorded at ${time.toLocaleTimeString()}`;
    } else {
      const start = new Date(result.session.startTime);
      const end = result.session.endTime ? new Date(result.session.endTime) : null;
      const durationMs = end ? (end - start) : null;
      const minutes = durationMs ? Math.round(durationMs / 60_000) : null;

      title = isStart ? 'Session Started!' : 'Session Ended!';
      emoji = isStart ? '✅' : '🏁';
      detail = isStart
        ? `Started at ${start.toLocaleTimeString()}`
        : `Duration: ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    return (
      <div className="scan-page" style={styles.page}>
        <div className="scan-result-card" style={styles.resultCard}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {emoji}
          </div>
          <h2 style={{ ...styles.resultTitle, color: isAttendance ? '#0c5ba3' : (isStart ? '#155724' : '#0c4a6e') }}>
            {title}
          </h2>
          <p style={styles.resultDetail}>{detail}</p>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If scanning, show the camera
  if (scanning && scanMode) {
    return (
      <div className="scan-page" style={styles.page}>
        <div className="scan-card" style={styles.card}>
          <button onClick={() => { setScanMode(null); setScanning(false); }} style={styles.backLink}>
            ← Back to Mode Selection
          </button>
          <h2 style={styles.title}>
            {scanMode === 'ATTENDANCE' ? '📍 Scan Attendance QR' : '👥 Scan Session QR'}
          </h2>
          <p style={styles.hint}>
            {scanMode === 'ATTENDANCE'
              ? 'Point your camera at the attendance QR code'
              : 'Point your camera at the session QR code'}
          </p>

          {error && <div style={styles.errorBox}>{error}</div>}

          <QRScanner
            onScanSuccess={onScanSuccess}
            onScanError={null}
          />
        </div>
      </div>
    );
  }

  // Default: Show mode selection
  return (
    <div className="scan-page" style={styles.page}>
      <div className="scan-card" style={styles.card}>
        <div style={styles.cardHeader}>
          <button onClick={() => navigate('/dashboard')} style={styles.backLink}>
            ← Back
          </button>
          <ThemeToggle />
        </div>
        <h2 style={styles.title}>What are you doing?</h2>
        <p style={styles.hint}>Select an option to begin scanning</p>

        <div style={styles.modeContainer}>
          <button
            onClick={() => {
              setScanMode('ATTENDANCE');
              setScanning(true);
            }}
            style={{ ...styles.modeButton, ...styles.modeButtonAttendance }}
          >
            <div style={styles.modeEmoji}>📍</div>
            <div style={styles.modeTitle}>Check Attendance</div>
            <div style={styles.modeSubtitle}>Scan to check in or out</div>
          </button>

          <button
            onClick={() => {
              setScanMode('SESSION');
              setScanning(true);
            }}
            style={{ ...styles.modeButton, ...styles.modeButtonSession }}
          >
            <div style={styles.modeEmoji}>👥</div>
            <div style={styles.modeTitle}>Start / End Session</div>
            <div style={styles.modeSubtitle}>Counseling session with student</div>
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif', minHeight: '100vh', background: '#f0f2f5' },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 440, width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  cardHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  title: { margin: '0.5rem 0', fontSize: '1.4rem', color: '#1a1a2e' },
  hint: { color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' },
  backLink: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.9rem', padding: 0, marginBottom: '1rem' },
  errorBox: { background: '#fee', border: '1px solid #fcc', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#c00', fontSize: '0.9rem' },
  resultCard: { background: '#fff', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', margin: '4rem auto' },
  resultTitle: { margin: '0 0 0.5rem', fontSize: '1.5rem' },
  resultDetail: { color: '#555', marginBottom: '1.5rem' },
  backBtn: { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, cursor: 'pointer', fontSize: '1rem', fontFamily: 'sans-serif' },

  // Mode selector styles
  modeContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  modeButton: {
    background: '#fff', border: '2px solid #ddd', borderRadius: 12, padding: '1.5rem',
    cursor: 'pointer', fontSize: '1rem', fontFamily: 'sans-serif',
    transition: 'all 0.2s ease', textAlign: 'center',
  },
  modeButtonAttendance: {
    borderColor: '#0c5ba3', ':hover': { borderColor: '#0a3d72', background: '#f0f7ff' },
  },
  modeButtonSession: {
    borderColor: '#155724', ':hover': { borderColor: '#0d3618', background: '#f0fdf4' },
  },
  modeEmoji: { fontSize: '2.5rem', marginBottom: '0.5rem' },
  modeTitle: { fontWeight: 600, color: '#1a1a2e', fontSize: '1.1rem', marginBottom: '0.25rem' },
  modeSubtitle: { color: '#888', fontSize: '0.85rem' },
};
