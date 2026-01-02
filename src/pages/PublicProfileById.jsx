import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axiosInstance';
import { PageLoader } from '../components/ui/PageLoader/PageLoader';

export default function PublicProfileById() {
  const { t } = useTranslation();
  const { username } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'notfound' | 'error'

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        console.log(`Loading profile for username: ${username}`);
        const { data } = await api.get(`/api/users/by-username/${username}`);
        console.log('Profile data received:', data);
        if (!alive) return;
        if (data?.id) {
          navigate(`/app/profile/${data.id}`, { replace: true });
        } else {
          console.error('No user ID in response:', data);
          setStatus('notfound');
        }
      } catch (e) {
        console.error('Error loading profile:', e);
        if (!alive) return;
        if (e?.response?.status === 404) setStatus('notfound');
        else setStatus('error');
      }
    })();
    return () => { alive = false; };
  }, [username, navigate]);

  if (status === 'loading') return <PageLoader message={t('profile.loadingProfile')} />;
  if (status === 'notfound') return (
    <div>
      <p>{t('profile.profileNotFound')}</p>
      <Link to="/app/home">{t('nav.goHome')}</Link>
    </div>
  );
  return (
    <div>
      <p>Couldn’t load that profile.</p>
      <Link to="/app/home">Go home</Link>
    </div>
  );
}
