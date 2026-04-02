import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import api from '../api/axios';

// AdminSessions: view all sessions across all faculty
// Shows: Faculty Name, Start Time, End Time, Duration
// Filters: Faculty, Date range, Status (active/completed)
//
// Route: /admin/sessions (admin only)
export default function AdminSessions() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterFaculty, setFilterFaculty] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [faculty, setFaculty] = useState([]);

  useEffect(() => {
    fetchFaculty();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [offset, filterFaculty, filterActive]);

  async function fetchFaculty() {
    try {
      const { data } = await api.get('/faculty');
      setFaculty(data);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    }
  }

  async function fetchSessions() {
    try {
      setLoading(true);
      const params = { limit, offset };
      if (filterFaculty) params.facultyId = filterFaculty;
      if (filterActive) params.active = filterActive === 'active';

      const { data } = await api.get('/sessions', { params });
      setSessions(data || []);
      setTotal(data.length); // Assuming backend returns array directly without pagination info
      setError(null);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function formatDateTime(isoString) {
    if (!isoString) return '-';
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
          <h1 style={styles.title}>All Sessions</h1>
          <div style={styles.headerActions}>
            <ThemeToggle />
            <button onClick={() => navigate('/admin')} style={styles.backBtn}>
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Faculty:</label>
            <select
              value={filterFaculty}
              onChange={(e) => {
                setFilterFaculty(e.target.value);
                setOffset(0); // Reset to page 1
              }}
              style={styles.filterSelect}
            >
              <option value="">All Faculty</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Status:</label>
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setOffset(0);
              }}
              style={styles.filterSelect}
            >
              <option value="">All Sessions</option>
              <option value="active">Active (Ongoing)</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button onClick={fetchSessions} style={styles.refreshBtn}>
            🔄 Refresh
          </button>
        </div>

        {/* Errors */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Loading */}
        {loading && <p style={styles.muted}>Loading sessions...</p>}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <p style={styles.muted}>No sessions found matching your filters.</p>
        )}

        {/* Sessions Table */}
        {!loading && sessions.length > 0 && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={{ ...styles.cell, ...styles.headerCell }}>Faculty</th>
                  <th style={{ ...styles.cell, ...styles.headerCell }}>Start Time</th>
                  <th style={{ ...styles.cell, ...styles.headerCell }}>End Time</th>
                  <th style={{ ...styles.cell, ...styles.headerCell, textAlign: 'center' }}>Duration</th>
                  <th style={{ ...styles.cell, ...styles.headerCell, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, idx) => {
                  const facultyName = session.faculty?.name || 'Unknown';
                  const isActive = !session.endTime;
                  return (
                    <tr
                      key={session.id}
                      style={{
                        ...styles.row,
                        background: idx % 2 === 0 ? '#fff' : '#fafafa',
                        borderLeft: isActive ? '4px solid #28a745' : '4px solid #ddd',
                      }}
                    >
                      <td style={styles.cell}>{facultyName}</td>
                      <td style={styles.cell}>{formatDateTime(session.startTime)}</td>
                      <td style={styles.cell}>{formatDateTime(session.endTime)}</td>
                      <td style={{ ...styles.cell, textAlign: 'center' }}>
                        {calculateDuration(session.startTime, session.endTime)}
                      </td>
                      <td style={{ ...styles.cell, textAlign: 'center' }}>
                        <span
                          style={{
                            background: isActive ? '#d4edda' : '#f8f9fa',
                            color: isActive ? '#155724' : '#666',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 20,
                            fontSize: '0.85rem',
                            fontWeight: 500,
                          }}
                        >
                          {isActive ? 'Ongoing' : 'Completed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
              style={{
                ...styles.paginationBtn,
                opacity: offset === 0 ? 0.5 : 1,
                cursor: offset === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              ← Previous
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={currentPage >= totalPages}
              style={{
                ...styles.paginationBtn,
                opacity: currentPage >= totalPages ? 0.5 : 1,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }}
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
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '1rem',
    fontFamily: 'sans-serif',
  },
  container: {
    maxWidth: 1000,
    margin: '0 auto',
    background: '#fff',
    borderRadius: 10,
    padding: '2rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  headerActions:{ display: 'flex', gap: '0.5rem', alignItems: 'center' },
  title: {
    margin: 0,
    fontSize: '1.8rem',
    color: '#1a1a2e',
  },
  backBtn: {
    background: '#eee',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  filterRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  filterLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#555',
  },
  filterSelect: {
    padding: '0.5rem',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    minWidth: 150,
  },
  refreshBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  errorBox: {
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: 6,
    padding: '1rem',
    marginBottom: '1rem',
    color: '#c00',
  },
  muted: {
    color: '#999',
    textAlign: 'center',
    paddingTop: '2rem',
    paddingBottom: '2rem',
    fontSize: '0.95rem',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '1.5rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  },
  headerRow: {
    borderBottom: '2px solid #ddd',
  },
  headerCell: {
    background: '#f9f9f9',
    fontWeight: 600,
    color: '#333',
  },
  cell: {
    padding: '0.75rem',
    borderBottom: '1px solid #eee',
  },
  row: {
    borderBottom: '1px solid #eee',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    paddingTop: '1rem',
  },
  paginationBtn: {
    background: '#1a1a2e',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: 6,
    cursor: 'pointer',
  },
  pageInfo: {
    color: '#666',
    fontSize: '0.9rem',
  },
};
