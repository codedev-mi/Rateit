import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Star, User, Lock, X } from 'lucide-react';

export default function Navbar({ onChangePasswordClick }) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav className="navbar glass">
      <div className="nav-brand">
        <Star size={24} className="star-filled" />
        <span>Rateit.</span>
      </div>
      <div className="nav-links">
        <div className="user-tag">
          <User size={16} />
          <span>{user.name.split(' ')[0]}</span>
          <span className={`role-badge ${user.role}`}>{user.role}</span>
        </div>
        <button onClick={onChangePasswordClick} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
          <Lock size={14} />
          <span>Password</span>
        </button>
        <button onClick={logout} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
