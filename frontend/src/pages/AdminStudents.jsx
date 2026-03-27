import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// AdminStudents: view all students across all faculty.
// Admin can:
//   - View all students with their assigned faculty
//   - Add a student and assign to a faculty
//   - Delete a student
//
// Route: /admin/students (admin only)
export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({
    name: '', gender: '', facultyId: '', dept: '',
    cutOff: '', community: '', quota: '', status: 'pending',
  });
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  function loadData() {
    Promise.all([
      api.get('/students'),
      api.get('/faculty'),
    ]).then(([sRes, fRes]) => {
      setStudents(sRes.data);
      setFaculty(fRes.data);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/students', form);
      setSuccess(`Student "${form.name}" added.`);
      setForm({ name: '', gender: '', facultyId: '', dept: '', cutOff: '', community: '', quota: '', status: 'pending' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add student');
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete student "${name}"?`)) return;
    try {
      await api.delete(`/students/${id}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  }

  function update(field, value) {
    setForm(p => ({ ...p, [field]: value }));
  }

  return (
    <div className="admin-students-page" style={styles.page}>
      <header className="admin-students-header" style={styles.header}>
        <div>
          <Link to="/admin" style={styles.back}>← Admin Dashboard</Link>
          <h1 style={styles.heading}>Manage Students</h1>
        </div>
        <button className="admin-students-add-btn" onClick={() => setShowForm(f => !f)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Student'}
        </button>
      </header>

      {error   && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <form className="admin-students-form" onSubmit={handleAdd} style={styles.form}>
          <h3 style={{ margin: '0 0 1rem' }}>Add New Student</h3>
          <div className="admin-students-grid" style={styles.grid}>
            <input className="admin-students-input" style={styles.input} placeholder="Full Name" required
              value={form.name} onChange={e => update('name', e.target.value)} />
            <select className="admin-students-input" style={styles.input} required
              value={form.gender} onChange={e => update('gender', e.target.value)}>
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select className="admin-students-input" style={styles.input} required
              value={form.facultyId} onChange={e => update('facultyId', e.target.value)}>
              <option value="">Assign to Faculty</option>
              {faculty.map(f => <option key={f.id} value={f.id}>{f.name} ({f.dept})</option>)}
            </select>
            <input className="admin-students-input" style={styles.input} placeholder="Dept (e.g. CSE)" required
              value={form.dept} onChange={e => update('dept', e.target.value)} />
            <input className="admin-students-input" style={styles.input} placeholder="Cut-off (%)" required type="number" step="0.01"
              value={form.cutOff} onChange={e => update('cutOff', e.target.value)} />
            <input className="admin-students-input" style={styles.input} placeholder="Community (e.g. OC, BC)" required
              value={form.community} onChange={e => update('community', e.target.value)} />
            <input className="admin-students-input" style={styles.input} placeholder="Quota (e.g. Government, Management)" required
              value={form.quota} onChange={e => update('quota', e.target.value)} />
            <select className="admin-students-input" style={styles.input} value={form.status} onChange={e => update('status', e.target.value)}>
              <option value="pending">Pending</option>
              <option value="admitted">Admitted</option>
              <option value="counselled">Counselled</option>
            </select>
          </div>
          <button className="admin-students-submit" type="submit" style={{ ...styles.addBtn, marginTop: '0.75rem' }}>Add Student</button>
        </form>
      )}

      {loading && <p style={styles.muted}>Loading students...</p>}

      <div className="admin-students-table-wrap" style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Name', 'Dept', 'Gender', 'Community', 'Cut-off', 'Status', 'Faculty', ''].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={styles.td}>{s.name}</td>
                <td style={styles.td}>{s.dept}</td>
                <td style={styles.td}>{s.gender}</td>
                <td style={styles.td}>{s.community}</td>
                <td style={styles.td}>{s.cutOff}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.pill,
                    background: s.status === 'counselled' ? '#d4edda' : s.status === 'admitted' ? '#d1ecf1' : '#fff3cd',
                    color:      s.status === 'counselled' ? '#155724' : s.status === 'admitted' ? '#0c5460' : '#856404',
                  }}>
                    {s.status}
                  </span>
                </td>
                <td style={styles.td}>{s.faculty?.name || '—'}</td>
                <td style={styles.td}>
                  <button onClick={() => handleDelete(s.id, s.name)} style={styles.deleteBtn}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && students.length === 0 && (
          <p style={styles.muted}>No students yet.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:         { maxWidth: 960, margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  back:         { color: '#555', textDecoration: 'none', fontSize: '0.85rem' },
  heading:      { margin: '0.25rem 0 0', fontSize: '1.4rem', color: '#1a1a2e' },
  addBtn:       { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' },
  form:         { background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  grid:         { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' },
  input:        { padding: '0.6rem 0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' },
  error:        { background: '#fee', border: '1px solid #fcc', color: '#c00', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  success:      { background: '#efe', border: '1px solid #cfc', color: '#060', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  tableWrapper: { background: '#fff', borderRadius: 10, padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflowX: 'auto' },
  table:        { width: '100%', borderCollapse: 'collapse' },
  th:           { textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #eee', fontSize: '0.8rem', color: '#666', fontWeight: 600, whiteSpace: 'nowrap' },
  td:           { padding: '0.55rem 0.75rem', borderBottom: '1px solid #f5f5f5', fontSize: '0.875rem', color: '#333' },
  pill:         { padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 },
  deleteBtn:    { background: '#fee', border: '1px solid #fcc', color: '#c00', width: 28, height: 28, borderRadius: 4, cursor: 'pointer', fontSize: '1rem', lineHeight: 1 },
  muted:        { color: '#999', textAlign: 'center', padding: '2rem 0' },
};
