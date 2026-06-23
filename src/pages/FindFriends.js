import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X, UserPlus, Check } from 'lucide-react';
import api from '../api/axiosInstance';
import { makeApiUrl } from '../api/httpUrl';
import { toast } from 'react-toastify';
import Avatar from '../components/Avatar';
import styles from '../stylus/sections/FindFriends.module.scss';

/**
 * FindFriends — search people by name/username and send friend requests.
 * Live (debounced) search with a clean, YouTube-style search bar.
 * Available at /app/friends/find.
 */
const FindFriends = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sent, setSent] = useState({}); // userId -> true once a request is sent

  // Debounced live search as the user types (min 2 chars).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    let cancelled = false;
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get(`/friends/search?query=${encodeURIComponent(q)}`);
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setSearched(true);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query]);

  const sendRequest = async (user) => {
    setSent((s) => ({ ...s, [user.id]: true }));
    try {
      await api.post('/friends/request', { receiverId: user.id });
      toast.success(t('friends.requestSent', 'Friend request sent'));
    } catch (err) {
      setSent((s) => {
        const next = { ...s };
        delete next[user.id];
        return next;
      });
      toast.error(err.response?.data || t('errors.saveFailed', 'Could not send request'));
    }
  };

  return (
    <div className={styles.wrap}>
      <h2 className={styles.heading}>{t('friends.findFriends')}</h2>

      <div className={styles.searchPill}>
        <Search size={20} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          className={styles.searchInput}
          placeholder={t('friends.searchPlaceholder', 'Search people by name or username')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          aria-label={t('friends.findFriends')}
        />
        {query && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => setQuery('')}
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading && <div className={styles.status}>{t('common.loading')}</div>}

      {!loading && searched && results.length === 0 && (
        <div className={styles.status}>{t('friends.noResults', 'No people found.')}</div>
      )}

      {!query && (
        <div className={styles.hint}>
          {t('friends.searchHint', 'Type a name or username to find people in the community.')}
        </div>
      )}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((user) => {
            const name = user.name || user.username || 'User';
            const requested = !!sent[user.id];
            return (
              <li key={user.id} className={styles.resultRow}>
                <button
                  type="button"
                  className={styles.person}
                  onClick={() => navigate(`/app/u/${user.username || user.id}`)}
                >
                  <Avatar
                    user={user}
                    src={makeApiUrl(`/users/${user.id}/profile-image`)}
                    alt={name}
                    size="md"
                  />
                  <span className={styles.personInfo}>
                    <span className={styles.personName}>{name}</span>
                    {user.username && <span className={styles.personHandle}>@{user.username}</span>}
                  </span>
                </button>

                <button
                  type="button"
                  className={`${styles.addBtn} ${requested ? styles.addBtnSent : ''}`}
                  onClick={() => !requested && sendRequest(user)}
                  disabled={requested}
                >
                  {requested ? (
                    <>
                      <Check size={16} /> {t('friends.requested', 'Requested')}
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> {t('friends.add', 'Add')}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default FindFriends;
