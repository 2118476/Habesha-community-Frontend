import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';

const TravelList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  const debouncedOrigin = useDebounce(origin, 200);
  const debouncedDestination = useDebounce(destination, 200);

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedOrigin.trim()) params.origin = debouncedOrigin.trim();
      if (debouncedDestination.trim()) params.destination = debouncedDestination.trim();
      if (date) params.date = date;

      const { data } = await api.get('/travel', { params });
      setPosts(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      console.error(e);
      toast.error('Failed to load travel posts');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') fetchPosts();
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    setTimeout(fetchPosts, 0);
  };

  return (
    <div style={{ maxWidth: 920 }}>
      <h2 style={{ marginBottom: 8 }}>Who’s Flying?</h2>
      <p style={{ marginTop: 0, color: '#64748b' }}>
        Find travellers by route and date. <em>Use at your own risk.</em>
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div
          className="hstack"
          style={{ gap: 12, flexWrap: 'wrap' }}
          onKeyDown={handleKeyDown}
        >
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="From (origin city)"
            aria-label="From"
            className="input"
            style={inputStyle}
          />
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="To (destination city)"
            aria-label="To"
            className="input"
            style={inputStyle}
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
            className="input"
            style={inputStyle}
          />
          <div className="hstack" style={{ gap: 8 }}>
            <button className="btn" onClick={fetchPosts}>Search</button>
            <button className="btn" style={{ background: '#0ea5e9' }} onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card"><p>Loading travel posts…</p></div>
      ) : posts.length === 0 ? (
        <div className="card"><p style={{ color: '#64748b' }}>No matching travel posts found.</p></div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {posts.map((post) => (
            <li key={post.id} className="card" style={{ marginBottom: 12 }}>
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                <span
                  style={{ cursor: 'pointer', color: '#2563eb' }}
                  onClick={() => navigate(`/profile/${post.userId}`)}
                  title="View profile"
                >
                  {post.user?.name || post.user?.username || 'Traveller'}
                </span>
                <span title="Travel date">{formatDate(post.travelDate)}</span>
              </div>
              <div style={{ fontSize: 16, marginBottom: 6 }}>
                {post.originCity} → {post.destinationCity}
              </div>
              {post.message && (
                <p style={{ marginTop: 6, marginBottom: 6, color: '#111827' }}>{post.message}</p>
              )}
              <div style={{ color: '#475569' }}>
                Contact: <strong>{post.contactMethod}</strong>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ---------- utils ----------
const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  minWidth: 180,
};

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function useDebounce(value, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return useMemo(() => v, [v]);
}

export default TravelList;
