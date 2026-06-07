import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import { Lock, X } from 'lucide-react';

// Guard for protected routes
function RequireAuth({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex-center" style={{ height: '100vh', color: 'var(--text-secondary)' }}>Verifying credentials...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Unauthorized, redirect based on actual role
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'owner') return <Navigate to="/owner" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Sub-component to manage global change password state
function AppContent() {
  const { user, apiCall } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    // Password validation matches requirements
    const pwdRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
    if (!newPassword || !pwdRegex.test(newPassword)) {
      setPwdError('New password must be 8-16 characters and contain at least one uppercase letter and one special character.');
      return;
    }

    setPwdLoading(true);
    try {
      await apiCall('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPasswordModal(false), 1200);
    } catch (err) {
      setPwdError(err.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      {user && <Navbar onChangePasswordClick={() => { setPwdError(''); setPwdSuccess(''); setShowPasswordModal(true); }} />}
      
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Routes */}
        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={['admin']}>
              <AdminDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth allowedRoles={['user']}>
              <UserDashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/owner"
          element={
            <RequireAuth allowedRoles={['owner']}>
              <OwnerDashboard />
            </RequireAuth>
          }
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      {/* Global Change Password Modal Overlay */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ maxWidth: '420px' }}>
            <button onClick={() => setShowPasswordModal(false)} className="modal-close">
              <X size={20} />
            </button>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px' }}>
              <Lock size={20} style={{ color: 'var(--primary)' }} />
              <h2>Change Password</h2>
            </div>
            
            {pwdError && <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>{pwdError}</div>}
            {pwdSuccess && <div className="alert alert-success" style={{ fontSize: '0.85rem' }}>{pwdSuccess}</div>}

            <form onSubmit={handlePasswordChangeSubmit}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">New Password (8-16 chars, 1 uppercase, 1 special symbol)</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={pwdLoading}>
                  {pwdLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
