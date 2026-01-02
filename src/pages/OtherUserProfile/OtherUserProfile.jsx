import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRelationship } from '../../hooks/useRelationship';
import { useThreadByUser } from '../../hooks/useThreadByUser';
import styles from './OtherUserProfile.module.scss';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

/**
 * Public profile for other users.
 * Route: /app/u/:username  (switch to /app/profile/:userId if you prefer ids)
 *
 * Assumptions:
 * - api: your axios instance at src/api/axiosInstance (adjust import if different)
 * - GET /api/users/by-username/:username -> { id, username, name, avatarUrl, joined, bio, email?, phone?, listings?[] }
 *   (If you only have id-based endpoints, change the fetch to GET /api/users/:id)
 */
import api from '../../api/axiosInstance';

export default function OtherUserProfile() {
  const { t } = useTranslation();
  const { username, userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const targetId = useMemo(() => user?.id || userId, [user, userId]);
  const { isFriend, isMutualFriend, canSeeContactInfo, requestContactInfo } = useRelationship(targetId, api);
  const startDm = useThreadByUser(navigate, api);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        let res;
        if (username) {
          res = await api.get(`/api/users/by-username/${encodeURIComponent(username)}`);
        } else if (userId) {
          res = await api.get(`/api/users/${encodeURIComponent(userId)}`);
        }
        if (mounted) setUser(res?.data || null);
      } catch (e) {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [username, userId]);

  if (loading) return (
    <div className={styles.wrap}>
      <PageLoader message="Loading profile..." />
    </div>
  );
  if (!user) return <div className={styles.wrap}>User not found.</div>;

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <img alt={user.username} src={user.avatarUrl || '/avatar.png'} className={styles.avatar}/>
        <div className={styles.meta}>
          <h1>{user.name || user.username}</h1>
          <div className={styles.sub}>
            @{user.username} • Joined {user.joined ? new Date(user.joined).toLocaleDateString() : '—'}
          </div>
        </div>
        <div className={styles.actions}>
          <button onClick={() => startDm(user.id)} className={styles.primary}>{t('buttons.message')}</button>
          {/* If you have friend actions already, wire them here. Placeholders: */}
          {/* <button className={styles.ghost}>{t('buttons.addFriend')}</button> */}
          {!canSeeContactInfo && (
            <button onClick={requestContactInfo} className={styles.ghost}>{t('buttons.requestContactInfo')}</button>
          )}
        </div>
      </header>

      {user.bio && <p className={styles.bio}>{user.bio}</p>}

      <section className={styles.contacts}>
        <h2>Contact</h2>
        {canSeeContactInfo ? (
          <ul>
            <li>Email: <a href={`mailto:${user.email || ''}`}>{user.email || '—'}</a></li>
            <li>Phone: {user.phone || '—'}</li>
          </ul>
        ) : (
          <div className={styles.locked}>
            Email and phone are visible to <b>mutual friends</b> only.
          </div>
        )}
      </section>

      <section className={styles.listings}>
        <h2>Listings</h2>
        {Array.isArray(user.listings) && user.listings.length ? (
          <ul className={styles.cards}>
            {user.listings.map((it) => (
              <li key={it.id} className={styles.card}>
                <img src={it.coverUrl || '/placeholder.png'} alt={it.title} />
                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{it.title}</div>
                  <div className={styles.cardSub}>{it.category} • {it.city || it.location || '—'}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.emptySmall}>No public listings yet.</div>
        )}
      </section>
    </div>
  );
}
