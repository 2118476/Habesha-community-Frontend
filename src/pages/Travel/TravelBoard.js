import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import TravelPostForm from './TravelPostForm';
import CountrySelect from '../../components/common/CountrySelect';

export default function TravelBoard() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  // Filters
  const [originCountry, setOriginCountry] = useState(null);         // { value, code }
  const [destinationCountry, setDestinationCountry] = useState(null);
  const [date, setDate] = useState('');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPosts(); // initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (originCountry?.value) params.origin = originCountry.value;
      if (destinationCountry?.value) params.destination = destinationCountry.value;
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

  const handleReset = () => {
    setOriginCountry(null);
    setDestinationCountry(null);
    setDate('');
    setTimeout(fetchPosts, 0);
  };

  return (
    <div style={{ maxWidth: 1180, marginInline: 'auto' }}>
      <header style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 28 }}>Who’s Flying?</h2>
        <p style={{ marginTop: 6, color: '#64748b' }}>
          Post your trip or find travellers by route and date. <em>Use at your own risk.</em>
        </p>
      </header>

      {/* Post form */}
      <TravelPostForm onCreated={fetchPosts} />

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, paddingTop: 14, paddingBottom: 14 }}>
        <div className="hstack" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: 280, flex: '1 1 320px' }}>
            <CountrySelect
              value={originCountry}
              onChange={setOriginCountry}
              placeholder="From (city)"
            />
          </div>
          <div style={{ minWidth: 280, flex: '1 1 320px' }}>
            <CountrySelect
              value={destinationCountry}
              onChange={setDestinationCountry}
              placeholder="To (city)"
            />
          </div>
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

      {/* List */}
      {loading ? (
        <div className="card"><p>Loading travel posts…</p></div>
      ) : posts.length === 0 ? (
        <div className="card">
          <p style={{ color: '#64748b', marginBottom: 10 }}>No matching travel posts found.</p>
          <p style={{ margin: 0 }}>
            Be the first to post your trip above — others will be able to message you.
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {posts.map((p) => (
            <li key={p.id} className="card" style={{ marginBottom: 14, padding: 16 }}>
              {/* Poster (single clickable button: avatar + name) */}
              <div className="hstack" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                <button
                  className="btn"
                  onClick={() => navigate(`/profile/${p.userId}`)}
                  title="View profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    src={p.userAvatar || '/default-avatar.png'}
                    alt={p.userName || 'User'}
                    width={42}
                    height={42}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <span style={{ color: '#2563eb', fontWeight: 700, fontSize: 16 }}>
                    {p.userName || 'Traveller'}
                  </span>
                </button>

                <span title="Travel date" style={{ color: '#334155' }}>
                  {formatDate(p.travelDate)}
                </span>
              </div>

              {/* Route */}
              <div style={{ fontSize: 18, marginBottom: 6, lineHeight: 1.4 }}>
                <strong>{p.originCity} → {p.destinationCity}</strong>
              </div>

              {/* Message */}
              {p.message && (
                <p style={{ marginTop: 6, marginBottom: 8, color: '#111827' }}>{p.message}</p>
              )}

              {/* Contact */}
              {p.contactMethod && (
                <div style={{ color: '#475569' }}>
                  Contact: <strong>{p.contactMethod}</strong>
                </div>
              )}

              {/* Actions */}
              <div className="hstack" style={{ gap: 10, marginTop: 12 }}>
                <button
                  className="btn"
                  onClick={() =>
                    navigate('/messages', {
                      state: { selectedUserId: p.userId, selectedUserName: p.userName },
                    })
                  }
                >
                  💬 Message
                </button>
                <button
                  className="btn"
                  style={{ background: '#0ea5e9' }}
                  onClick={() => navigate(`/profile/${p.userId}`)}
                >
                  View Profile
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* -------- utils ---------- */

const inputStyle = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  minWidth: 160,
  height: 42,
};

function formatDate(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString();
  } catch {
    return iso || '-';
  }
}
