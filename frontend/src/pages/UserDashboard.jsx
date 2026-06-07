import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Star, MessageSquareCode, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function UserDashboard() {
  const { apiCall } = useAuth();
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [hoveredStars, setHoveredStars] = useState({}); // { storeId: ratingVal }

  const fetchStores = async () => {
    setLoading(true);
    try {
      const data = await apiCall(`/stores?search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
      setStores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [search, sortBy, sortOrder]);

  const handleRate = async (storeId, rating) => {
    try {
      await apiCall('/stores/rate', {
        method: 'POST',
        body: JSON.stringify({ storeId, rating }),
      });
      // Refresh listings to update overall and user ratings
      fetchStores();
    } catch (err) {
      alert(err.message || 'Failed to submit rating');
    }
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [field, order] = value.split('-');
    setSortBy(field);
    setSortOrder(order);
  };

  const renderStars = (storeId, userRating, currentOverall) => {
    const stars = [];
    const activeRating = hoveredStars[storeId] !== undefined ? hoveredStars[storeId] : (userRating || 0);

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={22}
          className={`star-icon ${i <= activeRating ? 'star-filled' : 'star-interactive'}`}
          onMouseEnter={() => setHoveredStars({ ...hoveredStars, [storeId]: i })}
          onMouseLeave={() => {
            const updated = { ...hoveredStars };
            delete updated[storeId];
            setHoveredStars(updated);
          }}
          onClick={() => handleRate(storeId, i)}
        />
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>{stars}</div>
        <span style={{ fontSize: '0.75rem', color: userRating ? 'var(--success)' : 'var(--text-muted)' }}>
          {userRating ? `Your rating: ${userRating} ★ (Click to modify)` : 'Not rated yet'}
        </span>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dash-header">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700' }}>Store Directory</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Discover registered businesses, check reviews, and leave your rating.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="controls-row">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search stores by Name or Address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ArrowUpDown size={18} style={{ color: 'var(--text-secondary)' }} />
          <select className="form-select" onChange={handleSortChange} style={{ width: '220px' }}>
            <option value="name-asc">Store Name (A-Z)</option>
            <option value="name-desc">Store Name (Z-A)</option>
            <option value="address-asc">Address (A-Z)</option>
            <option value="address-desc">Address (Z-A)</option>
            <option value="avg_rating-desc">Overall Rating (High-Low)</option>
            <option value="avg_rating-asc">Overall Rating (Low-High)</option>
            <option value="user_rating-desc">My Ratings (High-Low)</option>
            <option value="user_rating-asc">My Ratings (Low-High)</option>
          </select>
        </div>
      </div>

      {/* Stores Display Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>Searching directory...</div>
      ) : stores.length === 0 ? (
        <div className="glass" style={{ padding: '80px 40px', textAlign: 'center', marginTop: '24px' }}>
          <MessageSquareCode size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h3>No Stores Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>Try adjusting your search keywords.</p>
        </div>
      ) : (
        <div className="stores-grid">
          {stores.map((store) => (
            <div key={store.id} className="store-card glass">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600' }}>{store.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(251,191,36,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                    <Star size={14} className="star-filled" />
                    <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fbbf24' }}>{store.avg_rating}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  {store.address}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Email: {store.email}
                </div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                {renderStars(store.id, store.user_rating, store.avg_rating)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
