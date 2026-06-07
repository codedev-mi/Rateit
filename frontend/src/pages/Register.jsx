import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Star, UserPlus } from 'lucide-react';

export default function Register() {
  const { apiCall } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Validate on submission
  const validateForm = () => {
    if (name.length < 20 || name.length > 60) {
      setError('Name must be between 20 and 60 characters.');
      return false;
    }
    if (address.length > 400) {
      setError('Address must not exceed 400 characters.');
      return false;
    }
    const pwdRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
    if (!pwdRegex.test(password)) {
      setError('Password must be 8-16 characters and contain at least one uppercase letter and one special character.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, address }),
      });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="flex-center" style={{ gap: '8px', marginBottom: '12px' }}>
            <Star size={36} className="star-filled" />
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>Rateit.</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Create your normal user account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name (Min 20 characters)</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name (Min 20 - Max 60 chars)"
              required
            />
            <span style={{ fontSize: '0.75rem', color: name.length < 20 || name.length > 60 ? 'var(--danger)' : 'var(--text-muted)' }}>
              Length: {name.length} chars
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address (Max 400 characters)</label>
            <textarea
              className="form-input"
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your residence address..."
              required
            />
            <span style={{ fontSize: '0.75rem', color: address.length > 400 ? 'var(--danger)' : 'var(--text-muted)' }}>
              Length: {address.length}/400 chars
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label">Password (8-16 chars, 1 uppercase, 1 special symbol)</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            <UserPlus size={18} />
            <span>{loading ? 'Registering...' : 'Sign Up'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: '500' }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
