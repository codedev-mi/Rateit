import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Store, Star, Plus, Search, ChevronUp, ChevronDown, Info } from 'lucide-react';

export default function AdminDashboard() {
  const { apiCall } = useAuth();
  
  // Dashboard Metrics
  const [metrics, setMetrics] = useState({ totalUsers: 0, totalStores: 0, totalRatings: 0 });
  
  // Tables state
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'stores'
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  
  // Filtering & Sorting
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSortBy, setUserSortBy] = useState('name');
  const [userSortOrder, setUserSortOrder] = useState('asc');
  
  const [storeSearch, setStoreSearch] = useState('');
  const [storeSortBy, setStoreSortBy] = useState('name');
  const [storeSortOrder, setStoreSortOrder] = useState('asc');
  
  // Modal Overlays
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', address: '', role: 'user' });
  const [newStore, setNewStore] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]); // List of store owners for selection
  
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const data = await apiCall('/admin/dashboard');
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const data = await apiCall(
        `/admin/users?search=${encodeURIComponent(userSearch)}&role=${userRoleFilter}&sortBy=${userSortBy}&sortOrder=${userSortOrder}`
      );
      setUsers(data);
      // Keep owners list updated
      setOwners(data.filter(u => u.role === 'owner'));
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  // Fetch stores
  const fetchStores = async () => {
    setTableLoading(true);
    try {
      const data = await apiCall(
        `/admin/stores?search=${encodeURIComponent(storeSearch)}&sortBy=${storeSortBy}&sortOrder=${storeSortOrder}`
      );
      setStores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchStores();
    }
  }, [activeTab, userSearch, userRoleFilter, userSortBy, userSortOrder, storeSearch, storeSortBy, storeSortOrder]);

  const handleUserSort = (column) => {
    if (userSortBy === column) {
      setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortBy(column);
      setUserSortOrder('asc');
    }
  };

  const handleStoreSort = (column) => {
    if (storeSortBy === column) {
      setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStoreSortBy(column);
      setStoreSortOrder('asc');
    }
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Input Validation matches requirement
    if (newUser.name.length < 20 || newUser.name.length > 60) {
      setFormError('Name must be between 20 and 60 characters.');
      return;
    }
    if (newUser.address.length > 400) {
      setFormError('Address must not exceed 400 characters.');
      return;
    }
    const pwdRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
    if (!pwdRegex.test(newUser.password)) {
      setFormError('Password must be 8-16 characters and contain at least one uppercase letter and one special character.');
      return;
    }

    try {
      await apiCall('/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      setFormSuccess('User created successfully!');
      setNewUser({ name: '', email: '', password: '', address: '', role: 'user' });
      fetchMetrics();
      fetchUsers();
      setTimeout(() => setShowAddUserModal(false), 1200);
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    }
  };

  const handleAddStoreSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (newStore.name.length < 20 || newStore.name.length > 60) {
      setFormError('Store Name must be between 20 and 60 characters.');
      return;
    }
    if (newStore.address.length > 400) {
      setFormError('Address must not exceed 400 characters.');
      return;
    }
    if (!newStore.ownerId) {
      setFormError('Please select a Store Owner.');
      return;
    }

    try {
      await apiCall('/admin/stores', {
        method: 'POST',
        body: JSON.stringify(newStore),
      });
      setFormSuccess('Store registered successfully!');
      setNewStore({ name: '', email: '', address: '', ownerId: '' });
      fetchMetrics();
      if (activeTab === 'stores') fetchStores();
      setTimeout(() => setShowAddStoreModal(false), 1200);
    } catch (err) {
      setFormError(err.message || 'Failed to register store');
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const data = await apiCall(`/admin/users/${userId}`);
      setSelectedUserDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  const renderSortIcon = (sortBy, currentVal, sortOrder) => {
    if (sortBy !== currentVal) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="dashboard-container">
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Admin Control Center</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage database, stores, platform users, and track analytics.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { setFormError(''); setFormSuccess(''); setShowAddUserModal(true); }} className="btn btn-primary">
            <Plus size={16} />
            <span>Add User</span>
          </button>
          <button onClick={() => { setFormError(''); setFormSuccess(''); setShowAddStoreModal(true); }} className="btn btn-secondary">
            <Plus size={16} />
            <span>Add Store</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card glass">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-info">
            <h3>Total Users</h3>
            <p>{metrics.totalUsers}</p>
          </div>
        </div>
        <div className="metric-card glass">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>
            <Store size={24} />
          </div>
          <div className="metric-info">
            <h3>Registered Stores</h3>
            <p>{metrics.totalStores}</p>
          </div>
        </div>
        <div className="metric-card glass">
          <div className="metric-icon" style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>
            <Star size={24} />
          </div>
          <div className="metric-info">
            <h3>Submitted Ratings</h3>
            <p>{metrics.totalRatings}</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--card-border)', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'users' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'users' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: activeTab === 'users' ? '600' : '400',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          Users Registry
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'stores' ? 'var(--primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'stores' ? '2px solid var(--primary)' : '2px solid transparent',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: activeTab === 'stores' ? '600' : '400',
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          Stores Registry
        </button>
      </div>

      {/* Tab Contents: Users */}
      {activeTab === 'users' && (
        <div>
          {/* Controls Row */}
          <div className="controls-row">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Filter by Name, Email, Address..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div>
              <select
                className="form-select"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{ width: '180px' }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="owner">Store Owner</option>
                <option value="user">Normal User</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="table-container glass">
            {tableLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading registry...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th onClick={() => handleUserSort('name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Name</span>
                        {renderSortIcon(userSortBy, 'name', userSortOrder)}
                      </div>
                    </th>
                    <th onClick={() => handleUserSort('email')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Email</span>
                        {renderSortIcon(userSortBy, 'email', userSortOrder)}
                      </div>
                    </th>
                    <th onClick={() => handleUserSort('address')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Address</span>
                        {renderSortIcon(userSortBy, 'address', userSortOrder)}
                      </div>
                    </th>
                    <th onClick={() => handleUserSort('role')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Role</span>
                        {renderSortIcon(userSortBy, 'role', userSortOrder)}
                      </div>
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                        No records match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.address}
                        </td>
                        <td>
                          <span className={`role-badge ${u.role}`}>{u.role}</span>
                        </td>
                        <td>
                          <button onClick={() => handleViewDetails(u.id)} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
                            <Info size={14} />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab Contents: Stores */}
      {activeTab === 'stores' && (
        <div>
          {/* Controls Row */}
          <div className="controls-row">
            <div className="search-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search Stores by Name, Address..."
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Stores Table */}
          <div className="table-container glass">
            {tableLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading registry...</div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th onClick={() => handleStoreSort('name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Store Name</span>
                        {renderSortIcon(storeSortBy, 'name', storeSortOrder)}
                      </div>
                    </th>
                    <th onClick={() => handleStoreSort('email')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Store Email</span>
                        {renderSortIcon(storeSortBy, 'email', storeSortOrder)}
                      </div>
                    </th>
                    <th onClick={() => handleStoreSort('address')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Address</span>
                        {renderSortIcon(storeSortBy, 'address', storeSortOrder)}
                      </div>
                    </th>
                    <th onClick={() => handleStoreSort('avg_rating')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Overall Rating</span>
                        {renderSortIcon(storeSortBy, 'avg_rating', storeSortOrder)}
                      </div>
                    </th>
                    <th>Ratings Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                        No records match the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    stores.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.address}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Star size={16} className="star-filled" />
                            <span style={{ fontWeight: '600' }}>{s.avg_rating}</span>
                          </div>
                        </td>
                        <td>{s.total_ratings} reviews</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Add User */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>Register New User Account</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Create a System Admin, Store Owner, or Normal User record.
            </p>
            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            
            <form onSubmit={handleAddUserSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name (20-60 characters)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full Name (Min 20 - Max 60 chars)"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@domain.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password (8-16 chars, 1 uppercase, 1 special symbol)</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address (Max 400 characters)</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={newUser.address}
                  onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                  placeholder="Street details..."
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Security Role</label>
                <select
                  className="form-select"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">Normal User (Client)</option>
                  <option value="owner">Store Owner (Merchant)</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddUserModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Store */}
      {showAddStoreModal && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>Register New Store Location</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
              Set up a physical store presence and assign ownership.
            </p>
            {formError && <div className="alert alert-error">{formError}</div>}
            {formSuccess && <div className="alert alert-success">{formSuccess}</div>}
            
            <form onSubmit={handleAddStoreSubmit}>
              <div className="form-group">
                <label className="form-label">Store Name (20-60 characters)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newStore.name}
                  onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                  placeholder="Store Outlet Name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Official Store Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                  placeholder="outlet@store.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Store Address (Max 400 characters)</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={newStore.address}
                  onChange={(e) => setNewStore({ ...newStore, address: e.target.value })}
                  placeholder="Physical Outlet Address..."
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Assign Store Owner</label>
                <select
                  className="form-select"
                  value={newStore.ownerId}
                  onChange={(e) => setNewStore({ ...newStore, ownerId: e.target.value })}
                  required
                >
                  <option value="">-- Select Store Owner --</option>
                  {owners.map(o => (
                    <option key={o.id} value={o.id}>{o.name} ({o.email})</option>
                  ))}
                </select>
                {owners.length === 0 && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                    No store owners registered yet. Create a user with role 'owner' first.
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddStoreModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={owners.length === 0}>Register Store</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: User Details Overlay */}
      {selectedUserDetails && (
        <div className="modal-overlay">
          <div className="modal-content glass">
            <h2>User Profile Details</h2>
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span className="form-label">Full Name</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '500' }}>{selectedUserDetails.name}</div>
              </div>
              <div>
                <span className="form-label">Email Address</span>
                <div>{selectedUserDetails.email}</div>
              </div>
              <div>
                <span className="form-label">Residence Address</span>
                <div>{selectedUserDetails.address}</div>
              </div>
              <div>
                <span className="form-label">Platform Role</span>
                <div>
                  <span className={`role-badge ${selectedUserDetails.role}`}>{selectedUserDetails.role}</span>
                </div>
              </div>

              {/* If Store Owner, display overall store ratings */}
              {selectedUserDetails.role === 'owner' && (
                <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '14px', marginTop: '10px' }}>
                  <span className="form-label">Owned Stores & Performance</span>
                  {selectedUserDetails.stores && selectedUserDetails.stores.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                      {selectedUserDetails.stores.map(store => (
                        <div key={store.id} className="glass" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{store.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{store.address}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            <Star size={14} className="star-filled" />
                            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{store.avg_rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px' }}>No stores registered under this owner.</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
              <button onClick={() => setSelectedUserDetails(null)} className="btn btn-secondary">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
