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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', gender: '', dept: '', cutOff: '', community: '', quota: '', status: 'pending',
  });
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '', gender: '', dept: '', cutOff: '', community: '', quota: '', status: 'pending',
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  function loadStudents() {
    api.get('/students')
      .then(res => setStudents(res.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load students'));
  }

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

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/students', {
        ...form,
        facultyId: user?.id,  // Faculty creates for themselves
      });
      setSuccess(`Student "${form.name}" added.`);
      setForm({ name: '', gender: '', dept: '', cutOff: '', community: '', quota: '', status: 'pending' });
      setShowForm(false);
      loadStudents();
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student');
    }
  }

  function update(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  function startEdit(student) {
    setEditingStudentId(student.id);
    setEditForm({
      name: student.name || '',
      gender: student.gender || '',
      dept: student.dept || '',
      cutOff: student.cutOff ?? '',
      community: student.community || '',
      quota: student.quota || '',
      status: student.status || 'pending',
    });
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingStudentId(null);
  }

  function updateEdit(field, value) {
    setEditForm(p => ({ ...p, [field]: value }));
  }

  async function handleEditSave(e, studentId) {
    e.preventDefault();
    setError(null);
    try {
      await api.patch(`/students/${studentId}`, editForm);
      setSuccess(`Student "${editForm.name}" updated.`);
      setEditingStudentId(null);
      loadStudents();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update student');
    }
  }

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

      {error   && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* ── Stats Bar ── */}
      <div className="faculty-dashboard-stats" style={styles.statsRow}>
        <button
          onClick={() => navigate('/faculty/sessions')}
          style={{
            ...styles.statCard,
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
          }}
        >
          <span style={styles.statNumber}>{sessions.total}</span>
          <span style={styles.statLabel}>Sessions Done</span>
        </button>
        <div className="faculty-dashboard-stat-card" style={styles.statCard}>
          <span style={styles.statNumber}>{students.length}</span>
          <span style={styles.statLabel}>Students</span>
        </div>
      </div>

      {/* ── Add Student Form ── */}
      <button className="faculty-dashboard-add-btn" onClick={() => setShowForm(f => !f)} style={styles.addBtn}>
        {showForm ? 'Cancel' : '+ Add Student'}
      </button>

      {showForm && (
        <form className="faculty-dashboard-form" onSubmit={handleAdd} style={styles.form}>
          <h3 style={{ margin: '0 0 1rem' }}>Add New Student</h3>
          <div className="faculty-dashboard-grid" style={styles.grid}>
            <input className="faculty-dashboard-input" style={styles.input} placeholder="Full Name" required
              value={form.name} onChange={e => update('name', e.target.value)} />
            <select className="faculty-dashboard-input" style={styles.input} required
              value={form.gender} onChange={e => update('gender', e.target.value)}>
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input className="faculty-dashboard-input" style={styles.input} placeholder="Dept (e.g. CSE)" required
              value={form.dept} onChange={e => update('dept', e.target.value)} />
            <input className="faculty-dashboard-input" style={styles.input} placeholder="Cut-off (%)" required type="number" step="0.01"
              value={form.cutOff} onChange={e => update('cutOff', e.target.value)} />
            <input className="faculty-dashboard-input" style={styles.input} placeholder="Community (e.g. OC, BC)" required
              value={form.community} onChange={e => update('community', e.target.value)} />
            <input className="faculty-dashboard-input" style={styles.input} placeholder="Quota (e.g. Government, Management)" required
              value={form.quota} onChange={e => update('quota', e.target.value)} />
            <select className="faculty-dashboard-input" style={styles.input} value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="admitted">Admitted</option>
              <option value="counselled">Counselled</option>
            </select>
          </div>
          <button className="faculty-dashboard-submit" type="submit" style={{ ...styles.addBtn, marginTop: '0.75rem' }}>Add Student</button>
        </form>
      )}

      {/* ── Student List ── */}
      <section className="faculty-dashboard-section" style={styles.section}>
        <h2 style={styles.sectionTitle}>My Students</h2>

        {loading && <p style={styles.muted}>Loading students...</p>}

        {!loading && students.length === 0 && (
          <p style={styles.muted}>No students assigned yet.</p>
        )}

        {students.map(student => (
          <div key={student.id} style={styles.studentItem}>
            <div className="faculty-dashboard-student-card" style={styles.studentCard}>
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
                <button
                  type="button"
                  onClick={() => startEdit(student)}
                  style={styles.editBtn}
                >
                  {editingStudentId === student.id ? 'Editing...' : 'Edit'}
                </button>
              </div>
            </div>

            {editingStudentId === student.id && (
              <form onSubmit={(e) => handleEditSave(e, student.id)} style={styles.editForm}>
                <div className="faculty-dashboard-grid" style={styles.grid}>
                  <input className="faculty-dashboard-input" style={styles.input} placeholder="Full Name" required
                    value={editForm.name} onChange={e => updateEdit('name', e.target.value)} />
                  <select className="faculty-dashboard-input" style={styles.input} required
                    value={editForm.gender} onChange={e => updateEdit('gender', e.target.value)}>
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <input className="faculty-dashboard-input" style={styles.input} placeholder="Dept (e.g. CSE)" required
                    value={editForm.dept} onChange={e => updateEdit('dept', e.target.value)} />
                  <input className="faculty-dashboard-input" style={styles.input} placeholder="Cut-off (%)" required type="number" step="0.01"
                    value={editForm.cutOff} onChange={e => updateEdit('cutOff', e.target.value)} />
                  <input className="faculty-dashboard-input" style={styles.input} placeholder="Community (e.g. OC, BC)" required
                    value={editForm.community} onChange={e => updateEdit('community', e.target.value)} />
                  <input className="faculty-dashboard-input" style={styles.input} placeholder="Quota (e.g. Government, Management)" required
                    value={editForm.quota} onChange={e => updateEdit('quota', e.target.value)} />
                  <select className="faculty-dashboard-input" style={styles.input} value={editForm.status} onChange={e => updateEdit('status', e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="admitted">Admitted</option>
                    <option value="counselled">Counselled</option>
                  </select>
                </div>
                <div style={styles.editActions}>
                  <button type="button" onClick={cancelEdit} style={styles.cancelBtn}>Cancel</button>
                  <button type="submit" style={styles.saveBtn}>Save Changes</button>
                </div>
              </form>
            )}
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
  addBtn:       { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'sans-serif', marginBottom: '1rem' },
  statsRow:     { display: 'flex', gap: '1rem', marginBottom: '1.5rem' },
  statCard:     { flex: 1, background: '#fff', borderRadius: 10, padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  statNumber:   { display: 'block', fontSize: '2rem', fontWeight: 700, color: '#1a1a2e' },
  statLabel:    { fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 },
  form:         { background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' },
  input:        { padding: '0.6rem 0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  error:        { background: '#fee', border: '1px solid #fcc', color: '#c00', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  success:      { background: '#efe', border: '1px solid #cfc', color: '#060', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  section:      { background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  sectionTitle: { margin: '0 0 1rem', fontSize: '1.1rem', color: '#333' },
  muted:        { color: '#999', textAlign: 'center', padding: '2rem 0' },
  studentItem:  { borderBottom: '1px solid #f0f0f0', padding: '0.75rem 0' },
  studentCard:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0' },
  studentLeft:  { display: 'flex', flexDirection: 'column', gap: 4 },
  studentName:  { fontSize: '1rem', color: '#222' },
  studentMeta:  { fontSize: '0.8rem', color: '#888' },
  statusBadge:  { padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 },
  cutoff:       { margin: '4px 0 0', fontSize: '0.8rem', color: '#666', textAlign: 'right' },
  editBtn:      { marginTop: '0.5rem', background: '#fff', border: '1px solid #1a1a2e', color: '#1a1a2e', borderRadius: 6, padding: '0.3rem 0.7rem', cursor: 'pointer', fontSize: '0.8rem' },
  editForm:     { background: '#fafafa', border: '1px solid #eee', borderRadius: 8, padding: '0.9rem', marginTop: '0.5rem' },
  editActions:  { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  cancelBtn:    { background: '#f2f2f2', border: '1px solid #ddd', color: '#333', borderRadius: 6, padding: '0.45rem 0.85rem', cursor: 'pointer' },
  saveBtn:      { background: '#1a1a2e', border: 'none', color: '#fff', borderRadius: 6, padding: '0.45rem 0.95rem', cursor: 'pointer' },
  fab: {
    position: 'fixed', bottom: '2rem', right: '2rem',
    background: '#1a1a2e', color: '#fff', border: 'none',
    borderRadius: 50, padding: '1rem 1.5rem',
    fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
    fontFamily: 'sans-serif',
  },
};
