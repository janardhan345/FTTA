import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import api from '../api/axios';

// ScanQR: the page where a faculty member opens their camera to scan the kiosk QR.
// Workflow:
//   1. Faculty opens this page on their phone
//   2. Camera opens and points at the kiosk QR
//   3. QR is decoded → token sent to POST /qr/scan
//   4. Server returns { action: "START"|"END", session: {...} }
//   5. Show result to faculty, then offer to go back to dashboard
//
// Route: /scan (faculty only)
export default function ScanQR() {
  const navigate = useNavigate();
  const [result,   setResult]   = useState(null);  // { action, session }
  const [scanning, setScanning] = useState(true);  // controls whether camera is shown
  const [error,    setError]    = useState(null);

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
    const isStart    = result.action === 'START';
    const start      = new Date(result.session.startTime);
    const end        = result.session.endTime ? new Date(result.session.endTime) : null;
    const durationMs = end ? (end - start) : null;
    const minutes    = durationMs ? Math.round(durationMs / 60_000) : null;

    return (
      <div style={styles.page}>
        <div style={styles.resultCard}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
            {isStart ? '✅' : '🏁'}
          </div>
          <h2 style={{ ...styles.resultTitle, color: isStart ? '#155724' : '#0c4a6e' }}>
            {isStart ? 'Session Started!' : 'Session Ended!'}
          </h2>
          <p style={styles.resultDetail}>
            {isStart
              ? `Started at ${start.toLocaleTimeString()}`
              : `Duration: ${minutes} minute${minutes !== 1 ? 's' : ''}`}
          </p>
          <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button onClick={() => navigate('/dashboard')} style={styles.backLink}>
          ← Back
        </button>
        <h2 style={styles.title}>Scan Kiosk QR</h2>
        <p style={styles.hint}>Point your camera at the QR code displayed on the kiosk screen</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Only show the scanner if scanning is true.
            We unmount it on failure too so it fully resets before the next attempt */}
        {scanning && (
          <QRScanner
            onScanSuccess={onScanSuccess}
            onScanError={null}   // silently ignore decode noise
          />
        )}
      </div>
    </div>
  );
}

const styles = {
  page:         { display: 'flex', justifyContent: 'center', padding: '1rem', fontFamily: 'sans-serif', minHeight: '100vh', background: '#f0f2f5' },
  card:         { background: '#fff', borderRadius: 12, padding: '1.5rem', maxWidth: 440, width: '100%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
  title:        { margin: '0.5rem 0', fontSize: '1.4rem', color: '#1a1a2e' },
  hint:         { color: '#666', fontSize: '0.9rem', marginBottom: '1rem' },
  backLink:     { background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.9rem', padding: 0 },
  errorBox:     { background: '#fee', border: '1px solid #fcc', borderRadius: 6, padding: '0.75rem', marginBottom: '1rem', color: '#c00', fontSize: '0.9rem' },
  resultCard:   { background: '#fff', borderRadius: 12, padding: '2.5rem 2rem', maxWidth: 360, width: '100%', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', margin: '4rem auto' },
  resultTitle:  { margin: '0 0 0.5rem', fontSize: '1.5rem' },
  resultDetail: { color: '#555', marginBottom: '1.5rem' },
  backBtn:      { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.75rem 1.5rem', borderRadius: 8, cursor: 'pointer', fontSize: '1rem', fontFamily: 'sans-serif' },
};
