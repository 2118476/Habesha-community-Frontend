import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import { getAdCoverUrl } from '../../api/ads';
import { toast } from 'react-toastify';
import styles from '../../stylus/sections/Ads.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

const FALLBACK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export default function AdsList() {
  const { t } = useTranslation();
  const [ads, setAds] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/ads');
        setAds(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load ads:', error);
        toast.error(t('errors.loadFailed'));
      }
    })();
  }, [t]);

  // helper to resolve poster + avatar url (ID routing)
  const getPoster = (ad) => {
    const posterObj = ad.postedBy || ad.owner || ad.user || null;
    const posterId =
      posterObj?.id ?? ad.userId ?? ad.ownerId ?? ad.posterId ?? null;
    const posterName =
      posterObj?.name || posterObj?.username || ad.posterName || t('ads.seller', 'Seller');
    const avatarUrl = posterId
      ? `${api.defaults.baseURL}/users/${posterId}/profile-image`
      : null;
    return { posterId, posterName, avatarUrl };
  };

  return (
    <div className={styles.container}>
      <h2 style={{ color: 'var(--text-1, #1a1a1a)' }}>{t('pages.classifiedAds')}</h2>

      <Link 
        to="/app/ads/post" 
        className={`${buttonStyles.btn} ${buttonStyles.primary}`}
        style={{
          color: '#ffffff',
          backgroundColor: 'var(--btn-brand, #2563eb)',
          textDecoration: 'none',
          marginBottom: '20px',
          display: 'inline-block'
        }}
      >
        {t('ads.postAd')}
      </Link>

      {ads.length === 0 ? (
        <p style={{ color: 'var(--text-2, #6b7280)' }}>{t('ads.noAdsFound')}</p>
      ) : (
        <ul className={styles.list}>
          {ads.map((ad) => {
            const { posterId, posterName, avatarUrl } = getPoster(ad);

            return (
              <li
                key={ad.id}
                className={`${styles.adCard} ${ad.featured ? styles.adCardFeatured : ''}`}
              >
                {/* Card body navigates to details */}
                <div
                  onClick={() => navigate(`/app/ads/${ad.id}`)}
                  style={{ 
                    textDecoration: 'none', 
                    color: 'var(--text-1, #1a1a1a)', 
                    cursor: 'pointer' 
                  }}
                >
                  {/* Ad Photo */}
                  {getAdCoverUrl(ad) && (
                    <div style={{ marginBottom: '12px' }}>
                      <img
                        src={getAdCoverUrl(ad)}
                        alt={ad.title || t('ads.untitled', 'Untitled')}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border, #e5e7eb)'
                        }}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                  
                  <h3 style={{ color: 'var(--text-1, #1a1a1a)' }}>
                    {ad.title || t('ads.untitled', 'Untitled')}
                  </h3>
                  <p style={{ color: 'var(--text-2, #6b7280)' }}>
                    {(ad.description || '').slice(0, 120)}
                    {ad.description && ad.description.length > 120 ? '…' : ''}
                  </p>
                  {ad.price !== undefined && (
                    <p style={{ color: 'var(--text-1, #1a1a1a)', fontWeight: '600' }}>
                      {t('ads.price')}: £{Number(ad.price).toLocaleString('en-GB')}
                    </p>
                  )}
                  {ad.featured && (
                    <strong style={{ color: 'var(--brand, #2563eb)' }}>
                      {t('rentals.featured')}
                    </strong>
                  )}
                  <p style={{ color: 'var(--text-3, #9ca3af)' }}>
                    <small>{t('ads.category')}: {ad.category || 'N/A'}</small>
                  </p>
                  {ad.createdAt && (
                    <p style={{ color: 'var(--text-3, #9ca3af)' }}>
                      <small>
                        {t('rentals.postedBy')} {new Date(ad.createdAt).toLocaleString()}
                      </small>
                    </p>
                  )}
                </div>

                {/* Owner strip — like HomeSwap */}
                <div
                  className={styles.cardFooter}
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: '1px solid var(--border, #e5e7eb)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                  onClick={(e) => e.stopPropagation()} // don't open details when clicking footer
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      aria-label={t('profile.viewProfile')}
                      onClick={() => posterId && navigate(`/app/profile/${posterId}`)}
                      disabled={!posterId}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: posterId ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <img
                        src={avatarUrl || FALLBACK_PIXEL}
                        alt={posterName}
                        width={32}
                        height={32}
                        style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
                      />
                      <span style={{ color: 'var(--primary, #2563eb)' }}>
                        {posterName}
                      </span>
                    </button>
                  </div>

                  <Link
                    to={`/app/ads/${ad.id}`}
                    className={`${buttonStyles.btn} ${buttonStyles.subtle}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {t('common.view')}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
