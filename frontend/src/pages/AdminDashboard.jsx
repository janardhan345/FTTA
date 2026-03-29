import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAvailability } from '../hooks/useAvailability';
import api from '../api/axios';

// AdminDashboard: the main page for the admin.
// Shows:
//   1. Stats summary (total faculty, students, sessions)
//   2. Real-time faculty availability table (available, busy, not available)
//   3. Quick assign: reassign a student from one faculty to another
//
// Route: /admin (admin only)
export default function AdminDashboard() {
  const { user, logout }           = useAuth();
  const { availability, loading }  = useAvailability(5000);
  const [stats,    setStats]       = useState(null);
  const [students, setStudents]    = useState([]);
  const [deletedRecords, setDeletedRecords] = useState({ deletedStudents: [], deletedFaculty: [] });
  const [restoreMsg, setRestoreMsg] = useState(null);
  const [restoringKey, setRestoringKey] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [assigning, setAssigning]  = useState(false);
  const [assignForm, setAssignForm] = useState({ studentId: '', newFacultyId: '' });
  const [assignMsg,  setAssignMsg]  = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/students'),
      api.get('/admin/deleted'),
    ]).then(([statsRes, studentsRes, deletedRes]) => {
      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setDeletedRecords(deletedRes.data);
    });
  }, []);

  function loadStudents() {
    api.get('/students').then(({ data }) => setStudents(data));
  }

  function loadDeletedRecords() {
    api.get('/admin/deleted').then(({ data }) => setDeletedRecords(data));
  }

  function loadStats() {
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }

  async function handleAssign(e) {
    e.preventDefault();
    setAssignMsg(null);
    setAssigning(true);
    try {
      const { data } = await api.patch('/admin/assign', assignForm);
      setAssignMsg({ type: 'ok', text: `Student reassigned to ${data.faculty?.name || 'new faculty'}` });
      setAssignForm({ studentId: '', newFacultyId: '' });
      setStudentQuery('');
      loadStudents();
      loadStats();
    } catch (err) {
      setAssignMsg({ type: 'err', text: err.response?.data?.error || 'Assignment failed' });
    } finally {
      setAssigning(false);
    }
  }

  async function handleRestore(type, record) {
    setRestoreMsg(null);
    const key = `${type}:${record.id}`;
    setRestoringKey(key);

    try {
      const endpoint = type === 'student'
        ? `/admin/deleted/students/${record.id}/restore`
        : `/admin/deleted/faculty/${record.id}/restore`;

      await api.patch(endpoint);
      setRestoreMsg({
        type: 'ok',
        text: `${type === 'student' ? 'Student' : 'Faculty'} "${record.name}" restored successfully.`,
      });

      loadDeletedRecords();
      loadStudents();
      loadStats();
    } catch (err) {
      setRestoreMsg({ type: 'err', text: err.response?.data?.error || 'Restore failed' });
    } finally {
      setRestoringKey('');
    }
  }

  const available = availability.filter(f => f.status === 'available');
  const busy = availability.filter(f => f.status === 'busy');
  const notAvailable = availability.filter(f => f.status === 'not_available');

  const normalizedQuery = studentQuery.trim().toLowerCase();
  const filteredStudents = students.filter(s => {
    if (!normalizedQuery) return true;
    return (
      s.name?.toLowerCase().includes(normalizedQuery) ||
      s.dept?.toLowerCase().includes(normalizedQuery) ||
      s.faculty?.name?.toLowerCase().includes(normalizedQuery)
    );
  });

  const selectedStudent = students.find(s => s.id === assignForm.studentId) || null;
  const sortedAvailableFaculty = [...available].sort((a, b) => {
    return a.name.localeCompare(b.name);
  });
  const assignableFaculty = sortedAvailableFaculty.filter(f => f.id !== selectedStudent?.facultyId);

  function pickFirstAvailableFaculty() {
    const quickPick = available.find(f => f.id !== selectedStudent?.facultyId);
    if (quickPick) {
      setAssignForm(p => ({ ...p, newFacultyId: quickPick.id }));
    }
  }

  return (
    <div className="admin-dashboard-page" style={styles.page}>
      {/* ── Header ── */}
      <header className="admin-dashboard-header" style={styles.header}>
        <h1 style={styles.heading}>Admin Dashboard</h1>
        <div className="admin-dashboard-header-actions" style={styles.headerActions}>
          <Link to="/kiosk" target="_blank" style={styles.kioskLink}>Open Kiosk QR ↗</Link>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      {/* ── Stats Row ── */}
      {stats && (
        <div className="admin-dashboard-stats" style={styles.statsRow}>
          {[
            { n: stats.totalFaculty,              l: 'Faculty' },
            { n: stats.totalStudents,             l: 'Students' },
            { n: stats.totalSessions,             l: 'Total Sessions' },
            { n: stats.activeSessions,            l: 'Active Now', highlight: stats.activeSessions > 0 },
            { n: stats.avgSessionDurationMinutes, l: 'Avg Duration (min)' },
          ].map(({ n, l, highlight }) => (
            <div className="admin-dashboard-stat-card" key={l} style={{ ...styles.statCard, borderTop: highlight ? '3px solid #e55' : '3px solid #1a1a2e' }}>
              <span style={styles.statNumber}>{n}</span>
              <span style={styles.statLabel}>{l}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Availability Table ── */}
      <section className="admin-dashboard-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Faculty Availability
          <span style={styles.badge}>
            {available.length} available | {busy.length} busy | {notAvailable.length} not available
          </span>
        </h2>

        {loading && <p style={styles.muted}>Loading...</p>}

        <div className="admin-dashboard-table-wrap">
          <table style={styles.table}>
            <thead>
              <tr>
                {['Name', 'Dept', 'Students', 'Status', 'Session Started'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {availability.map(f => {
                const statusMeta = f.status === 'busy'
                  ? { label: '● Busy', rowBg: '#fff8e1', pillBg: '#ffecb3', pillColor: '#b26a00' }
                  : f.status === 'available'
                    ? { label: '✓ Available', rowBg: '#fff', pillBg: '#e8f5e9', pillColor: '#2e7d32' }
                    : { label: '○ Not Available', rowBg: '#f9fafb', pillBg: '#eceff1', pillColor: '#546e7a' };

                return (
                <tr key={f.id} style={{ background: statusMeta.rowBg }}>
                  <td style={styles.td}>{f.name}</td>
                  <td style={styles.td}>{f.dept}</td>
                  <td style={styles.td}>{f.studentCount}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusPill,
                      background: statusMeta.pillBg,
                      color:      statusMeta.pillColor,
                    }}>
                      {statusMeta.label}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {f.sessionStartAt
                      ? new Date(f.sessionStartAt).toLocaleTimeString()
                      : '—'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Restore Deleted Records ── */}
      <section className="admin-dashboard-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>
          Restore Deleted Records
          <span style={styles.badge}>
            {deletedRecords.deletedStudents.length} students | {deletedRecords.deletedFaculty.length} faculty
          </span>
        </h2>

        {restoreMsg && (
          <p style={{ color: restoreMsg.type === 'ok' ? 'green' : 'red', marginBottom: '0.75rem' }}>
            {restoreMsg.text}
          </p>
        )}

        <div style={styles.restoreGrid}>
          <div style={styles.restoreCard}>
            <h3 style={styles.restoreHeading}>Deleted Students</h3>
            {deletedRecords.deletedStudents.length === 0 && (
              <p style={styles.muted}>No deleted students.</p>
            )}

            {deletedRecords.deletedStudents.map(student => {
              const facultyDeleted = Boolean(student.faculty?.deletedAt);
              const isRestoring = restoringKey === `student:${student.id}`;

              return (
                <div key={student.id} style={styles.restoreRow}>
                  <div>
                    <strong>{student.name}</strong>
                    <p style={styles.restoreMeta}>Dept: {student.dept}</p>
                    <p style={styles.restoreMeta}>Faculty: {student.faculty?.name || 'Unknown'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore('student', student)}
                    style={styles.restoreBtn}
                    disabled={facultyDeleted || isRestoring}
                    title={facultyDeleted ? 'Restore faculty first' : 'Restore student'}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              );
            })}
          </div>

          <div style={styles.restoreCard}>
            <h3 style={styles.restoreHeading}>Deleted Faculty</h3>
            {deletedRecords.deletedFaculty.length === 0 && (
              <p style={styles.muted}>No deleted faculty.</p>
            )}

            {deletedRecords.deletedFaculty.map(faculty => {
              const isRestoring = restoringKey === `faculty:${faculty.id}`;
              return (
                <div key={faculty.id} style={styles.restoreRow}>
                  <div>
                    <strong>{faculty.name}</strong>
                    <p style={styles.restoreMeta}>{faculty.email}</p>
                    <p style={styles.restoreMeta}>Dept: {faculty.dept}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestore('faculty', faculty)}
                    style={styles.restoreBtn}
                    disabled={isRestoring}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Quick Assign ── */}
      <section className="admin-dashboard-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>Reassign Student</h2>
        <form className="admin-dashboard-form" onSubmit={handleAssign} style={styles.form}>

          <select
            className="admin-dashboard-input"
            style={styles.input}
            value={assignForm.studentId}
            onChange={e => setAssignForm({ studentId: e.target.value, newFacultyId: '' })}
            required
          >
            <option value="">Select Student ({filteredStudents.length})</option>
            {filteredStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} - {student.dept} (Current: {student.faculty?.name || 'Unassigned'})
              </option>
            ))}
          </select>

          {selectedStudent && (
            <p style={styles.helperText}>
              Current Faculty: <strong>{selectedStudent.faculty?.name || 'Unassigned'}</strong>
            </p>
          )}

          <div style={styles.assignActionRow}>
            <select
              className="admin-dashboard-input"
              style={styles.input}
              value={assignForm.newFacultyId}
              onChange={e => setAssignForm(p => ({ ...p, newFacultyId: e.target.value }))}
              required
              disabled={!assignForm.studentId || assignableFaculty.length === 0}
            >
              <option value="">Select Available Faculty</option>
              {assignableFaculty.map(f => (
                <option
                  key={f.id}
                  value={f.id}
                >
                  {f.name} - {f.dept}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={pickFirstAvailableFaculty}
              style={styles.quickPickBtn}
              disabled={!assignForm.studentId || assignableFaculty.length === 0}
            >
              Pick First Available
            </button>
          </div>

          <button
            className="admin-dashboard-submit"
            type="submit"
            style={styles.submitBtn}
            disabled={
              assigning ||
              !assignForm.studentId ||
              !assignForm.newFacultyId ||
              assignForm.newFacultyId === selectedStudent?.facultyId
            }
          >
            {assigning ? 'Reassigning...' : 'Reassign'}
          </button>
        </form>
        {assignMsg && (
          <p style={{ color: assignMsg.type === 'ok' ? 'green' : 'red', marginTop: '0.5rem' }}>
            {assignMsg.text}
          </p>
        )}
      </section>

      {/* ── Nav Links ── */}
      <div className="admin-dashboard-nav" style={styles.navLinks}>
        <Link to="/admin/faculty"  style={styles.navLink}>Manage Faculty →</Link>
        <Link to="/admin/students" style={styles.navLink}>Manage Students →</Link>
        <Link to="/admin/sessions" style={styles.navLink}>View Sessions →</Link>
      </div>
    </div>
  );
}

const styles = {
  page:         { maxWidth: 900, margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  heading:      { margin: 0, fontSize: '1.5rem', color: '#1a1a2e' },
  headerActions:{ display: 'flex', gap: '1rem', alignItems: 'center' },
  kioskLink:    { color: '#1a1a2e', fontWeight: 600, textDecoration: 'none', border: '2px solid #1a1a2e', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.9rem' },
  logoutBtn:    { background: '#eee', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer' },
  statsRow:     { display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  statCard:     { flex: 1, minWidth: 100, background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  statNumber:   { display: 'block', fontSize: '1.8rem', fontWeight: 700, color: '#1a1a2e' },
  statLabel:    { fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  section:      { background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#333', display: 'flex', alignItems: 'center', gap: 10 },
  badge:        { background: '#fce', color: '#900', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem' },
  muted:        { color: '#999' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #eee', fontSize: '0.85rem', color: '#666', fontWeight: 600 },
  td:           { padding: '0.6rem 0.75rem', borderBottom: '1px solid #f5f5f5', fontSize: '0.9rem', color: '#333' },
  statusPill:   { padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 },
  form:         { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  input:        { flex: 1, minWidth: 200, padding: '0.6rem 0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem' },
  helperText:   { margin: '0.25rem 0 0', width: '100%', color: '#4a5568', fontSize: '0.85rem' },
  assignActionRow: { display: 'flex', gap: '0.75rem', width: '100%', flexWrap: 'wrap' },
  quickPickBtn: { background: '#edf2f7', color: '#1a1a2e', border: '1px solid #cbd5e0', padding: '0.6rem 0.9rem', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' },
  submitBtn:    { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 600 },
  restoreGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.9rem' },
  restoreCard:  { border: '1px solid #ececec', borderRadius: 10, padding: '0.85rem' },
  restoreHeading: { margin: '0 0 0.75rem', fontSize: '1rem', color: '#1a1a2e' },
  restoreRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid #f3f3f3', padding: '0.6rem 0' },
  restoreMeta:  { margin: '2px 0', fontSize: '0.8rem', color: '#6b7280' },
  restoreBtn:   { background: '#e8f5e9', color: '#1b5e20', border: '1px solid #b7dfb9', borderRadius: 6, padding: '0.4rem 0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' },
  navLinks:     { display: 'flex', gap: '1rem', marginTop: '0.5rem' },
  navLink:      { color: '#1a1a2e', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' },
};
