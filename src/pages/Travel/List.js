// src/pages/Travel/List.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';

import sectionStyles from '../../stylus/sections/Travel.module.scss';
import formStyles from '../../stylus/components/Form.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';
import { CardGridLoader } from '../../components/ui/SectionLoader/SectionLoader';

const TravelList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

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
      toast.error(t('errors.loadFailed'));
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

  // -------- per-post helpers (poster + actions) --------
  const getPoster = (post) => {
    const posterObj = post.user || post.owner || post.postedBy || null;
    const posterId =
      posterObj?.id ?? post.userId ?? post.ownerId ?? post.posterId ?? null;
    const posterUsername =
      posterObj?.username ?? post.username ?? null;
    const posterName =
      posterObj?.name || posterUsername || t('travel.traveller', 'Traveller');
    const isOwner =
      user?.id != null && posterId != null && String(user.id) === String(posterId);
    return { posterObj, posterId, posterUsername, posterName, isOwner };
  };

  const viewProfile = (post) => {
    const { posterId, posterUsername } = getPoster(post);
    if (posterUsername) return navigate(`/app/u/${posterUsername}`);
    if (posterId) return navigate(`/app/profile/${posterId}`);
    toast.error(t('profile.profileNotFound'));
  };

  const messagePoster = async (post, e) => {
    if (e) e.stopPropagation();
    const { posterId, posterUsername, posterName, isOwner } = getPoster(post);
    if (isOwner) return;

    const first = (posterName || 'there').split(' ')[0];
    const route = `${post.originCity ?? ''} → ${post.destinationCity ?? ''}`.trim();
    const when = post.travelDate ? ` on ${formatDate(post.travelDate)}` : '';
    const text = `Hi ${first}, I'm interested in your travel plan ${route}${when}.`;

    try {
      let targetId = null;

      // Resolve by username first (consistent with other modules)
      if (posterUsername) {
        const resp = await api.get('/users', { params: { username: posterUsername } });
        targetId = resp?.data?.id || resp?.data?.user?.id || null;
      }
      if (!targetId) targetId = posterId;

      if (!targetId) {
        return navigate('/app/messages', {
          state: { selectedUserName: posterName, prefillMessage: text },
        });
      }

      // Ensure (or create) a 1:1 thread with travel context
      const ensure = await api.post('/api/messages/ensure-thread', {
        userId: targetId,
        contextType: 'travel',
        contextId: String(post.id),
      });

      const threadId =
        ensure?.data?.threadId ||
        ensure?.data?.id ||
        ensure?.data?.thread?.id ||
        ensure?.data?.data?.id;

      navigate(`/app/messages/thread/${targetId}`, {
        state: {
          selectedUserId: String(targetId),
          selectedUserName: posterName,
          prefillMessage: text,
          focusComposer: true,
          threadId,
        },
      });
    } catch (err) {
      console.error(err);
      navigate('/app/messages', {
        state: { selectedUserName: posterName, prefillMessage: text },
      });
    }
  };

  return (
    <div className={sectionStyles.container}>
      <div className={sectionStyles.formWrapper}>
        {/* Header + CTA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <div>
            <h2 style={{ marginBottom: 8 }}>{t('travel.whoIsFlying')}</h2>
            <p style={{ marginTop: 0, color: '#64748b' }}>
              {t('travel.findTravellers')} <em>{t('travel.useAtOwnRisk')}</em>
            </p>
          </div>
          <Link
            to="/app/travel/post"
            className={`${buttonStyles.btn} ${buttonStyles.primary}`}
            style={{ 
              whiteSpace: 'nowrap',
              color: '#ffffff',
              backgroundColor: 'var(--btn-brand, #2563eb)',
              textDecoration: 'none'
            }}
          >
            {t('travel.postYourTravel')}
          </Link>
        </div>

        {/* Filters */}
        <div className="item" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }} onKeyDown={handleKeyDown}>
            <input
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder={t('travel.originPlaceholder')}
              aria-label={t('travel.fromCity')}
              className={formStyles.input}
            />
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={t('travel.destinationPlaceholder')}
              aria-label={t('travel.toCity')}
              className={formStyles.input}
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label={t('travel.date')}
              className={formStyles.input}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                className={`${buttonStyles.btn} ${buttonStyles.primary}`} 
                onClick={fetchPosts}
                style={{
                  color: '#ffffff',
                  backgroundColor: 'var(--btn-brand, #2563eb)'
                }}
              >
                {t('common.search')}
              </button>
              <button className={`${buttonStyles.btn} ${buttonStyles.subtle}`} onClick={handleReset}>
                {t('common.reset', 'Reset')}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <CardGridLoader count={6} />
        ) : posts.length === 0 ? (
          <div className="item"><p style={{ color: '#64748b' }}>{t('travel.noTravelFound')}</p></div>
        ) : (
          <ul className={sectionStyles.list}>
            {posts.map((post) => {
              const { posterName, isOwner } = getPoster(post);
              return (
                <li
                  key={post.id}
                  className="item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/app/travel/${post.id}`)}
                >
                  {/* Top line: name + date */}
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}
                  >
                    <span 
                      style={{ 
                        cursor: 'pointer', 
                        color: 'var(--primary)',
                        fontWeight: '600',
                        textDecoration: 'none'
                      }} 
                      title={t('profile.viewProfile')}
                      onClick={(e) => {
                        e.stopPropagation(); // don't open details when clicking the name
                        viewProfile(post);
                      }}
                    >
                      {posterName}
                    </span>
                    <span title={t('travel.travelDate')}>{formatDate(post.travelDate)}</span>
                  </div>

                  <div style={{ fontSize: '16px', marginBottom: '6px' }}>
                    {post.originCity} → {post.destinationCity}
                  </div>

                  {post.message && (
                    <p style={{ marginTop: '6px', marginBottom: '6px', color: 'var(--on-surface-2)' }}>
                      {post.message}
                    </p>
                  )}

                  <div style={{ color: 'var(--muted)' }}>
                    {t('travel.contactMethod')}: <strong>{post.contactMethod}</strong>
                  </div>

                  {/* Poster footer under each card */}
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid var(--border, #e5e7eb)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ color: 'var(--muted-1, #64748b)' }}>
                      {t('rentals.postedBy')} 
                      <strong 
                        style={{ 
                          cursor: 'pointer', 
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          marginLeft: '4px'
                        }}
                        title={t('profile.viewProfile')}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewProfile(post);
                        }}
                      >
                        {posterName}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      {!isOwner && (
                        <button
                          className={`${buttonStyles.btn} ${buttonStyles.primary}`}
                          onClick={(e) => messagePoster(post, e)}
                          style={{
                            color: '#ffffff',
                            backgroundColor: 'var(--btn-brand, #2563eb)'
                          }}
                        >
                          {t('buttons.message')}
                        </button>
                      )}
                      <button
                        className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          viewProfile(post);
                        }}
                      >
                        {t('profile.viewProfile')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

// ---------- utils ----------
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