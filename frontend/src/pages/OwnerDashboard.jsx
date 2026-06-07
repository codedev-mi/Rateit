import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Store, Star, Award, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

export default function OwnerDashboard() {
  const { apiCall } = useAuth();
  const [stores, setStores] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sorting state for reviews table
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/owner/dashboard');
      setStores(data.stores);
      setRatings(data.ratings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Client-side sorting of reviews
  const sortedRatings = [...ratings].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    // Handle nested fields
    if (sortBy === 'user_name') {
      valA = a.user_name;
      valB = b.user_name;
    } else if (sortBy === 'user_email') {
      valA = a.user_email;
      valB = b.user_email;
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const renderSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="dashboard-container">
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Store Owner Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Review outlet performance metrics and customer feedback.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading dashboard metrics...</div>
      ) : (
        <>
          {/* Metrics summary cards */}
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '16px' }}>Your Outlets</h2>
            {stores.length === 0 ? (
              <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No registered store locations found under your ownership account. Please contact an administrator.
              </div>
            ) : (
              <div className="metrics-grid">
                {stores.map((store) => (
                  <div key={store.id} className="metric-card glass" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="metric-icon" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                      <Store size={24} />
                    </div>
                    <div className="metric-info" style={{ flex: 1 }}>
                      <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>
                        {store.name}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '400', marginBottom: '10px' }}>
                        {store.address}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={16} className="star-filled" />
                          <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{store.avg_rating}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>avg rating</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          • {store.total_ratings} reviews
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Reviews Table */}
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '16px' }}>Customer Reviews</h2>
            <div className="table-container glass">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('user_name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Customer Name</span>
                        {renderSortIcon('user_name')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('user_email')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Customer Email</span>
                        {renderSortIcon('user_email')}
                      </div>
                    </th>
                    <th>Customer Address</th>
                    <th onClick={() => handleSort('store_name')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Store Outlet</span>
                        {renderSortIcon('store_name')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('rating')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Submitted Rating</span>
                        {renderSortIcon('rating')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('created_at')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Submission Date</span>
                        {renderSortIcon('created_at')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRatings.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>
                        No reviews submitted yet for your stores.
                      </td>
                    </tr>
                  ) : (
                    sortedRatings.map((r) => (
                      <tr key={r.rating_id}>
                        <td>{r.user_name}</td>
                        <td>{r.user_email}</td>
                        <td>{r.user_address}</td>
                        <td style={{ fontWeight: '500' }}>{r.store_name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={16} className="star-filled" />
                            <span style={{ fontWeight: '600' }}>{r.rating}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(r.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
