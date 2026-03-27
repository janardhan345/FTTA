import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

// FacultyDashboard: the main page for faculty members.
// Two sections:
//   1. Student list — all students assigned to this faculty
//   2. Stats bar    — total sessions completed, total students
//
// A floating button links to the QR scan page.
//
// Route: /dashboard (faculty only)
export default function FacultyDashboard() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState({ total: 0 });
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    // Fetch students and sessions in parallel
    Promise.all([
      api.get('/students'),
      api.get('/sessions/my?limit=1'),  // we only need the total count
    ])
      .then(([studentsRes, sessionsRes]) => {
        setStudents(studentsRes.data);
        setSessions({ total: sessionsRes.data.total });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="faculty-dashboard-page" style={styles.page}>
      {/* ── Header ── */}
      <header className="faculty-dashboard-header" style={styles.header}>
        <div>
          <h1 style={styles.heading}>Welcome, {user?.name?.split(' ')[0]}</h1>
          <p style={styles.subheading}>{user?.dept} Department</p>
        </div>
        <button className="faculty-dashboard-logout" onClick={logout} style={styles.logoutBtn}>Logout</button>
      </header>

      {/* ── Stats Bar ── */}
      <div className="faculty-dashboard-stats" style={styles.statsRow}>
        <div className="faculty-dashboard-stat-card" style={styles.statCard}>
          <span style={styles.statNumber}>{students.length}</span>
          <span style={styles.statLabel}>Students</span>
        </div>
        <div className="faculty-dashboard-stat-card" style={styles.statCard}>
          <span style={styles.statNumber}>{sessions.total}</span>
          <span style={styles.statLabel}>Sessions Done</span>
        </div>
      </div>

      {/* ── Student List ── */}
      <section className="faculty-dashboard-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>My Students</h2>

        {loading && <p style={styles.muted}>Loading students...</p>}

        {!loading && students.length === 0 && (
          <p style={styles.muted}>No students assigned yet.</p>
        )}

        {students.map(student => (
          <div className="faculty-dashboard-student-card" key={student.id} style={styles.studentCard}>
            <div className="faculty-dashboard-student-left" style={styles.studentLeft}>
              <strong style={styles.studentName}>{student.name}</strong>
              <span style={styles.studentMeta}>
                {student.dept} · {student.community} · {student.quota}
              </span>
            </div>
            <div className="faculty-dashboard-student-right">
              <span style={{
                ...styles.statusBadge,
                background: student.status === 'counselled' ? '#d4edda' : '#fff3cd',
                color:      student.status === 'counselled' ? '#155724' : '#856404',
              }}>
                {student.status}
              </span>
              <p style={styles.cutoff}>Cut-off: {student.cutOff}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── Floating QR Scan Button ── */}
      <button
        onClick={() => navigate('/scan')}
        className="faculty-dashboard-fab"
        style={styles.fab}
        title="Scan QR to start/end session"
      >
        📷 Scan QR
      </button>
    </div>
  );
}

const styles = {
  page:         { maxWidth: 600, margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading:      { margin: 0, fontSize: '1.5rem', color: '#1a1a2e' },
  subheading:   { margin: 0, color: '#666', fontSize: '0.9rem' },
  logoutBtn:    { background: '#eee', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer' },
  statsRow:     { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  statCard:     { flex: 1, background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  statNumber:   { display: 'block', fontSize: '2rem', fontWeight: 700, color: '#1a1a2e' },
  statLabel:    { fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  section:      { background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#333' },
  muted:        { color: '#999', textAlign: 'center', padding: '2rem 0' },
  studentCard:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' },
  studentLeft:  { display: 'flex', flexDirection: 'column', gap: 4 },
  studentName:  { fontSize: '1rem', color: '#222' },
  studentMeta:  { fontSize: '0.8rem', color: '#888' },
  statusBadge:  { padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 },
  cutoff:       { margin: '4px 0 0', fontSize: '0.8rem', color: '#666', textAlign: 'right' },
  fab: {
    position: 'fixed', bottom: '2rem', right: '2rem',
    background: '#1a1a2e', color: '#fff', border: 'none',
    borderRadius: 50, padding: '1rem 1.5rem',
    fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif',
  },
};
