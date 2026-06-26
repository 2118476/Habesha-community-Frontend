// src/pages/Services/Details.js
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import useAuth from '../../hooks/useAuth';
import api from '../../api/axiosInstance';
import { makeApiUrl } from '../../api/httpUrl';
import { PageLoader } from '../../components/ui/PageLoader/PageLoader';

import styles from '../../stylus/sections/RentalsDetail.module.scss';
import buttonStyles from '../../stylus/components/Button.module.scss';

import ImageCarousel from '../../components/ImageCarousel.jsx';
import OwnerActions from '../../components/OwnerActions.jsx';
import ServiceReviews from '../../components/reviews/ServiceReviews';
import { navigateToDM } from '../../utils/dmNavigation';

const FALLBACK_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

export default function ServiceDetails() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/services/${id}`);
        setService(data || null);
      } catch (e) {
        console.error(e);
        toast.error(t('services.failedToLoad', 'Failed to load service'));
        setService(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, t]);

  // resolve provider (backend naming is not 100% consistent)
  const posterObj =
    service?.postedBy || service?.provider || service?.author || service?.owner || service?.user || null;
  const ownerId =
    posterObj?.id ??
    service?.providerId ??
    service?.ownerId ??
    service?.userId ??
    service?.posterId ??
    null;
  const ownerName =
    posterObj?.name || posterObj?.username || service?.providerName || t('services.provider', 'Provider');

  const isOwner = useMemo(() => {
    if (!user) return false;
    const meId = user?.id ?? user?.userId ?? user?._id ?? null;
    const sameUser = meId != null && ownerId != null && String(meId) === String(ownerId);
    const roles = Array.isArray(user?.roles)
      ? user.roles.map((r) =>
          typeof r === 'string' ? r.toUpperCase() : String(r?.name || '').toUpperCase()
        )
      : [];
    return sameUser || roles.includes('ADMIN');
  }, [user, ownerId]);

  // cover image -> carousel (single photo; placeholder when none)
  const photos = useMemo(() => {
    if (!service) return [];
    if (service.imageUrl) return [{ id: 0, url: makeApiUrl(service.imageUrl) }];
    if (service.hasImage) return [{ id: 0, url: makeApiUrl(`/api/services/${id}/image`) }];
    return [];
  }, [service, id]);

  const ownerAvatarUrl = ownerId ? makeApiUrl(`/users/${ownerId}/profile-image`) : null;

  const modeLabel = (m) => {
    if (!m) return null;
    const v = String(m).toUpperCase();
    if (v.includes('PERSON')) return t('services.inPerson', 'In person');
    if (v.includes('ONLINE') || v.includes('REMOTE')) return t('services.online', 'Online');
    return m;
  };

  const dmPrefill = (type) => {
    const first = (ownerName || 'there').split(' ')[0];
    const title = service?.title || 'your service';
    if (type === 'interest') return `Hi ${first}, I'm interested in "${title}".`;
    return `Hi ${first}, can you share more details about "${title}"?`;
  };

  const openDM = (prefill) => {
    if (!ownerId) {
      return navigate('/app/messages', {
        state: { selectedUserName: ownerName, prefillMessage: prefill },
      });
    }
    navigateToDM(navigate, ownerId, {
      ownerName,
      prefillMessage: prefill,
      focusComposer: true,
      contextType: 'service',
      contextId: service?.id ?? id ?? null,
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = service?.title || 'Service';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        toast.success(t('common.linkCopied', 'Link copied'));
      } else toast.info(t('common.sharingNotSupported', 'Sharing not supported'));
    } catch {
      /* user cancelled */
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t('services.deleteConfirm', 'Delete this service?'))) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success(t('services.deleted', 'Service deleted'));
      navigate('/app/services');
    } catch (err) {
      toast.error(err?.response?.data?.message || t('services.failedToDelete', 'Failed to delete service'));
    }
  };

  if (loading)
    return (
      <div className={styles.page}>
        <PageLoader message={t('services.loading', 'Loading service…')} />
      </div>
    );
  if (!service) return <div className={styles.page}>{t('common.notFound', 'Not found')}</div>;

  const np = t('common.notProvided', 'Not provided');
  const priceVal = service?.price ?? service?.basePrice;
  const facts = [
    { label: t('services.category', 'Category'), value: service?.category || np },
    {
      label: t('services.price', 'Price'),
      value: priceVal != null ? `£${Number(priceVal).toLocaleString('en-GB')}` : np,
    },
    { label: t('services.duration', 'Duration'), value: service?.estimatedTime || np },
    { label: t('services.serviceType', 'Service type'), value: modeLabel(service?.mode) || np },
    { label: t('services.location', 'Location'), value: service?.location || np },
  ];

  const ratingNum = service?.rating != null ? Number(service.rating) : null;
  const reviewCount = service?.reviewCount != null ? Number(service.reviewCount) : 0;

  return (
    <div className={styles.page}>
      {/* back link */}
      <div className={styles.topBar}>
        <Link className={`${buttonStyles.link} ${styles.backLink}`} to="/app/services">
          ← {t('services.backToServices', 'Back to services')}
        </Link>
      </div>

      {/* heading */}
      <div className={styles.header}>
        <h1 className={styles.title}>{service.title}</h1>
        <div className={styles.subtle}>
          {service.category && <span>{service.category}</span>}
          {service.location && (
            <>
              <span>·</span>
              <span>{service.location}</span>
            </>
          )}
          {priceVal != null && (
            <>
              <span>·</span>
              <span>£{Number(priceVal).toLocaleString('en-GB')}</span>
            </>
          )}
          {ratingNum != null && (
            <>
              <span>·</span>
              <span>⭐ {ratingNum.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* cover image */}
      <div className={styles.mediaWrap}>
        <ImageCarousel photos={photos} placeholderLabel={t('services.noImage', 'No image yet')} />
      </div>

      {/* main grid */}
      <div className={styles.contentGrid}>
        {/* LEFT */}
        <div>
          <section className={styles.factsCard} aria-label={t('services.keyDetails', 'Key details')}>
            <dl className={styles.factsGrid}>
              {facts.map((f, i) => (
                <div key={`${f.label}-${i}`} className={styles.fact}>
                  <dt>{f.label}</dt>
                  <dd>{f.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section>
            <h3 className={styles.sectionTitle}>{t('services.description', 'Description')}</h3>
            <p className={styles.body}>
              {service.description || t('services.noDescription', 'No description provided.')}
            </p>
          </section>
        </div>

        {/* RIGHT / PROVIDER CARD */}
        <aside className={styles.ownerCard}>
          <div className={styles.ownerHeader}>
            <button
              type="button"
              className={styles.ownerHeaderAvatarBtn}
              onClick={() => ownerId && navigate(`/app/profile/${ownerId}`)}
              aria-label={t('services.viewProviderProfile', 'View provider profile')}
              disabled={!ownerId}
            >
              <img
                src={ownerAvatarUrl || FALLBACK_PIXEL}
                alt={ownerName}
                className={styles.ownerHeaderAvatar}
                onError={(e) => (e.currentTarget.src = FALLBACK_PIXEL)}
              />
            </button>

            <div className={styles.ownerHeaderText}>
              <div className={styles.ownerHeaderLabel}>{t('services.providedBy', 'Provided by')}</div>
              {ownerId ? (
                <Link to={`/app/profile/${ownerId}`} className={styles.ownerHeaderName}>
                  {ownerName}
                </Link>
              ) : (
                <div className={styles.ownerHeaderName}>{ownerName}</div>
              )}
            </div>

            {!isOwner && ownerId && (
              <div className={styles.ownerHeaderActions}>
                <button
                  className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.compactPrimary}`}
                  onClick={() => openDM(dmPrefill('interest'))}
                >
                  {t('services.message', 'Message')}
                </button>
              </div>
            )}
          </div>

          {!isOwner && ownerId && (
            <div className="actionsRow" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => openDM(dmPrefill('interest'))}
              >
                {t('services.imInterested', "I'm interested")}
              </button>
              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => openDM(dmPrefill('details'))}
              >
                {t('services.askForDetails', 'Ask for more details')}
              </button>
              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={handleShare}
              >
                {t('common.share', 'Share')}
              </button>
              <button
                className={`${buttonStyles.btn} ${styles.compactBtn} ${styles.hoverBrand}`}
                onClick={() => navigate(`/app/profile/${ownerId}`)}
              >
                {t('profile.viewProfile', 'View profile')}
              </button>
            </div>
          )}

          {isOwner && (
            <div className="actionsRow" style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <OwnerActions
                isOwner
                editTo={`/app/services/${id}/edit`}
                onDelete={handleDelete}
                className="ownerActionsRow"
              />
              <button className={`${buttonStyles.btn} ${styles.compactBtn}`} onClick={handleShare}>
                {t('common.share', 'Share')}
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* Reviews — single consolidated section (gated by a genuine two-way chat) */}
      {ownerId && (
        <div style={{ marginTop: 32 }}>
          <ServiceReviews providerId={ownerId} />
        </div>
      )}
    </div>
  );
}
