import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';

// FacultySessions: view all your sessions with details
// Shows: Start Time, End Time, Duration, Student Name
//
// Route: /faculty/sessions (faculty only)
export default function FacultySessions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    fetchSessions();
  }, [limit, offset]);

  async function fetchSessions() {
    try {
      setLoading(true);
      const { data } = await api.get('/sessions/my', {
        params: { limit, offset },
      });
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString();
  }

  function calculateDuration(startTime, endTime) {
    if (!endTime) return 'Ongoing';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const minutes = Math.round((end - start) / 60_000);
    return `${minutes} min`;
  }

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>My Sessions</h1>
          <div style={styles.headerActions}>
            <ThemeToggle />
            <button onClick={() => navigate('/dashboard')} style={styles.backBtn}>
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <p>
            <strong>{total}</strong> total sessions ({currentPage} of {totalPages || 1})
          </p>
        </div>

        {/*Errors */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Loading */}
        {loading && <p style={styles.muted}>Loading sessions...</p>}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <p style={styles.muted}>No sessions yet. Scan the QR code to start a session!</p>
        )}

        {/* Sessions Table */}
        {!loading && sessions.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={{ ...styles.cell, ...styles.headerCell }}>Start Time</th>
                  <th style={{ ...styles.cell, ...styles.headerCell }}>End Time</th>
                  <th style={{ ...styles.cell, ...styles.headerCell, textAlign: 'center' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, idx) => (
                  <tr key={session.id} style={{...styles.row, background: idx % 2 === 0 ? '#fff' : '#fafafa'}}>
                    <td style={styles.cell}>{formatDateTime(session.startTime)}</td>
                    <td style={styles.cell}>{session.endTime ? formatDateTime(session.endTime) : '-'}</td>
                    <td style={{ ...styles.cell, textAlign: 'center' }}>{calculateDuration(session.startTime, session.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && total > limit && (
          <div style={styles.pagination}>
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              style={{ ...styles.paginationBtn, opacity: offset === 0 ? 0.5 : 1, cursor: offset === 0 ? 'not-allowed' : 'pointer' }}
            >
              ← Previous
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= totalPages}
              style={{ ...styles.paginationBtn, opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', background: '#f0f2f5', padding: '1rem', fontFamily: 'sans-serif',
  },
  container: {
    maxWidth: 900, margin: '0 auto', background: '#fff', borderRadius: 10, padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem',
  },
  headerActions:{ display: 'flex', gap: '0.5rem', alignItems: 'center' },
  title: {
    margin: 0, fontSize: '1.8rem', color: '#1a1a2e',
  },
  backBtn: {
    background: '#eee', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.95rem',
  },
  stats: {
    padding: '1rem', background: '#f9f9f9', borderRadius: 8, marginBottom: '1.5rem', color: '#666',
  },
  errorBox: {
    background: '#fee', border: '1px solid #fcc', borderRadius: 6, padding: '1rem', marginBottom: '1rem', color: '#c00',
  },
  muted: {
    color: '#999', textAlign: 'center', paddingTop: '2rem', paddingBottom: '2rem', fontSize: '0.95rem',
  },
  tableWrapper: {
    overflowX: 'auto', marginBottom: '1.5rem',
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem',
  },
  headerRow: {
    borderBottom: '2px solid #ddd',
  },
  headerCell: {
    background: '#f9f9f9', fontWeight: 600, color: '#333',
  },
  cell: {
    padding: '0.75rem', borderBottom: '1px solid #eee',
  },
  row: {
    borderBottom: '1px solid #eee',
  },
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', paddingTop: '1rem',
  },
  paginationBtn: {
    background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer',
  },
  pageInfo: {
    color: '#666', fontSize: '0.9rem',
  },
};
