import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Login            from './pages/Login';
import AuthCallback     from './pages/AuthCallback';
import FacultyDashboard from './pages/FacultyDashboard';
import ScanQR           from './pages/ScanQR';
import FacultySessions  from './pages/FacultySessions';
import AdminDashboard   from './pages/AdminDashboard';
import AdminFaculty     from './pages/AdminFaculty';
import AdminStudents    from './pages/AdminStudents';
import AdminSessions    from './pages/AdminSessions';
import KioskQR          from './pages/KioskQR';

// App: defines all routes and wraps everything in AuthProvider.
//
// AuthProvider sits at the top so every page can access the auth context.
// ProtectedRoute wraps each private page to enforce login + role checks.
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* ── Public ─────────────────────────────────────────── */}
          <Route path="/login"         element={<Login />} />
          {/* OAuth callback: backend redirects here with ?token= */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ── Faculty ────────────────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute requiredRole="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          } />
          <Route path="/scan" element={
            <ProtectedRoute requiredRole="faculty">
              <ScanQR />
            </ProtectedRoute>
          } />
          <Route path="/faculty/sessions" element={
            <ProtectedRoute requiredRole="faculty">
              <FacultySessions />
            </ProtectedRoute>
          } />

          {/* ── Admin ──────────────────────────────────────────── */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/faculty" element={
            <ProtectedRoute requiredRole="admin">
              <AdminFaculty />
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute requiredRole="admin">
              <AdminStudents />
            </ProtectedRoute>
          } />
          <Route path="/admin/sessions" element={
            <ProtectedRoute requiredRole="admin">
              <AdminSessions />
            </ProtectedRoute>
          } />
          {/* Kiosk: full-screen QR for the dedicated display device */}
          <Route path="/kiosk" element={
            <ProtectedRoute requiredRole="admin">
              <KioskQR />
            </ProtectedRoute>
          } />

          {/* ── Fallbacks ──────────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
