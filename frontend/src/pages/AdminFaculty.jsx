import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

// AdminFaculty: manage all faculty members.
// Features:
//   - List all faculty with their student/session counts and in-session status
//   - Add a new faculty (pre-registration before they log in)
//   - Update dept for a faculty
//   - Delete a faculty (cascades to their students + sessions)
//
// Route: /admin/faculty (admin only)
export default function AdminFaculty() {
  const [faculty,  setFaculty]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name: '', email: '', dept: '' });
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(null);

  function loadFaculty() {
    api.get('/faculty').then(({ data }) => setFaculty(data)).finally(() => setLoading(false));
  }

  useEffect(() => { loadFaculty(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/faculty', form);
      setSuccess(`Faculty "${form.name}" added.`);
      setForm({ name: '', email: '', dept: '' });
      setShowForm(false);
      loadFaculty();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add faculty');
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete faculty "${name}"? This will also delete all their students and sessions.`)) return;
    try {
      await api.delete(`/faculty/${id}`);
      loadFaculty();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <Link to="/admin" style={styles.back}>← Admin Dashboard</Link>
          <h1 style={styles.heading}>Manage Faculty</h1>
        </div>
        <button onClick={() => setShowForm(f => !f)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Add Faculty'}
        </button>
      </header>

      {error   && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {showForm && (
        <form onSubmit={handleAdd} style={styles.form}>
          <h3 style={{ margin: '0 0 1rem' }}>Add New Faculty</h3>
          <div style={styles.formRow}>
            <input style={styles.input} placeholder="Full Name" required
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input style={styles.input} placeholder="College Email" required type="email"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input style={styles.input} placeholder="Dept (e.g. CSE)" required
              value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))} />
            <button type="submit" style={styles.submitBtn}>Add</button>
          </div>
        </form>
      )}

      {loading && <p style={styles.muted}>Loading faculty...</p>}

      <div style={styles.list}>
        {faculty.map(f => (
          <div key={f.id} style={styles.card}>
            <div style={styles.cardLeft}>
              <strong style={styles.name}>{f.name}</strong>
              <span style={styles.email}>{f.email}</span>
              <span style={styles.meta}>{f.dept} · {f.studentCount} students · {f.sessionCount} sessions</span>
            </div>
            <div style={styles.cardRight}>
              {f.isInSession && <span style={styles.busyBadge}>In Session</span>}
              <button
                onClick={() => handleDelete(f.id, f.name)}
                style={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && faculty.length === 0 && (
          <p style={styles.muted}>No faculty registered yet.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:       { maxWidth: 800, margin: '0 auto', padding: '1rem', fontFamily: 'sans-serif' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  back:       { color: '#555', textDecoration: 'none', fontSize: '0.85rem' },
  heading:    { margin: '0.25rem 0 0', fontSize: '1.4rem', color: '#1a1a2e' },
  addBtn:     { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'sans-serif', whiteSpace: 'nowrap' },
  form:       { background: '#fff', borderRadius: 10, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '1rem' },
  formRow:    { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
  input:      { flex: 1, minWidth: 180, padding: '0.6rem 0.75rem', border: '1px solid #ddd', borderRadius: 6, fontSize: '0.9rem' },
  submitBtn:  { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: 6, cursor: 'pointer', fontFamily: 'sans-serif' },
  list:       { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card:       { background: '#fff', borderRadius: 10, padding: '1rem 1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft:   { display: 'flex', flexDirection: 'column', gap: 2 },
  cardRight:  { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  name:       { fontSize: '1rem', color: '#222' },
  email:      { fontSize: '0.8rem', color: '#888' },
  meta:       { fontSize: '0.8rem', color: '#aaa' },
  busyBadge:  { background: '#fce8b2', color: '#b26a00', padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 },
  deleteBtn:  { background: '#fee', border: '1px solid #fcc', color: '#c00', padding: '0.4rem 0.8rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem' },
  error:      { background: '#fee', border: '1px solid #fcc', color: '#c00', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  success:    { background: '#efe', border: '1px solid #cfc', color: '#060', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  muted:      { color: '#999', textAlign: 'center', padding: '2rem 0' },
};
