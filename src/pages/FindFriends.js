import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosInstance';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import formStyles from '../stylus/components/Form.module.scss';
import buttonStyles from '../stylus/components/Button.module.scss';
import styles from '../stylus/sections/Friends.module.scss';

/**
 * FindFriends allows the user to search by name or username and send
 * friend requests directly. This view is available at /app/friends/find.
 */
const FindFriends = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      return toast.warn('Enter at least 2 characters to search.');
    }
    try {
      const { data } = await api.get(`/friends/search?query=${encodeURIComponent(q)}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Failed to search for users');
    }
  };

  const sendRequest = async (receiverId) => {
    try {
      await api.post('/friends/request', { receiverId });
      toast.success('Friend request sent');
      setResults((prev) => prev.filter((u) => u.id !== receiverId));
    } catch (err) {
      toast.error(err.response?.data || 'Could not send request');
    }
  };

  return (
    <div className={styles.container}>
      <h2>{t('friends.findFriends')}</h2>
      <div className={styles.searchBar}>
        <input
          type="text"
          placeholder="Search by name or username"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={formStyles.input}
        />
        <button onClick={handleSearch} className={buttonStyles.btn}>{t('common.search')}</button>
      </div>
      {results.length > 0 && (
        <div>
          <h4>{t('friends.results')}</h4>
          <ul className={styles.list}>
            {results.map((user) => (
              <li key={user.id} className={styles.listItem}>
                <span
                  style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                  onClick={() => navigate(`/app/u/${user.username || user.id}`)}
                >
                  {user.username} ({user.name})
                </span>
                <button
                  className={buttonStyles.btn}
                  onClick={() => sendRequest(user.id)}
                >
                  Send Request
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FindFriends;