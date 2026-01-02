// src/pages/HomeSwap/HomeSwapHub.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosInstance';
import buttonStyles from '../../stylus/components/Button.module.scss';
import { InlineSpinner } from '../../components/ui/Spinner/Spinner';

const PAGE_SIZE = 12;

function coverFrom(item) {
  return (
    item?.coverUrl ||
    item?.cover ||
    item?.thumbnailUrl ||
    item?.image ||
    item?.images?.[0] ||
    item?.photos?.[0]?.url ||
    item?.photos?.[0] ||
    null
  );
}

function parseDate(d) {
  if (!d) return null;
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? null : t;
}

function fmtDate(d) {
  if (!d) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function isRecent(createdAt) {
  const d = parseDate(createdAt);
  if (!d) return false;
  const now = new Date();
  const diff = (now - d) / (1000 * 60 * 60 * 24);
  return diff <= 7;
}

/** Fetches an image with auth (Axios) and renders it as a blob URL */
function AuthImage({ src, alt = '', style, className, onError }) {
  const [url, setUrl] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let active = true;
    let objectUrl;

    async function load() {
      setErr(null);
      setUrl(null);
      if (!src) return;
      try {
        // If src is absolute http(s) or data:, just use it directly.
        if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) {
          if (active) setUrl(src);
          return;
        }
        // Otherwise fetch via Axios so auth headers/cookies flow
        const res = await api.get(src, { responseType: 'blob' });
        objectUrl = URL.createObjectURL(res.data);
        if (active) setUrl(objectUrl);
      } catch (e) {
        console.error('AuthImage failed', e);
        if (active) setErr(e);
        if (onError) onError(e);
      }
    }

    load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (err || !src) return null;
  if (!url) {
    // simple skeleton while loading
    return (
      <div
        className={className}
        style={{
          background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
          backgroundSize: '400% 100%',
          animation: 'shimmer 1.4s infinite',
          ...style,
        }}
        aria-busy="true"
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
    />
  );
}

export default function HomeSwapHub() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [type, setType] = useState('all'); // all | entire | room
  const [hasDates, setHasDates] = useState(false);
  const [sort, setSort] = useState('new'); // new | soonest
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/homeswap');
        const list = Array.isArray(data) ? data : (data?.items || []);
        if (active) {
          setItems(list);
          setError('');
        }
      } catch (e) {
        console.error(e);
        if (active) setError('Failed to load Home Swap posts.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Reset pagination when filters change
  useEffect(() => { setPage(1); }, [q, type, hasDates, sort]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = items.filter((it) => {
      const hay =
        `${it?.title || ''} ${it?.description || ''} ${it?.location || ''}`.toLowerCase();
      if (needle && !hay.includes(needle)) return false;

      const homeType = (it?.homeType || '').toLowerCase();
      if (type !== 'all' && homeType && homeType !== type) return false;

      const from = parseDate(it?.availableFrom || it?.fromDate || it?.startDate);
      const to = parseDate(it?.availableTo || it?.toDate || it?.endDate);
      if (hasDates && !(from && to)) return false;

      return true;
    });

    if (sort === 'new') {
      out.sort((a, b) => {
        const ad = parseDate(a?.createdAt || a?.postedAt || a?.updatedAt) || 0;
        const bd = parseDate(b?.createdAt || b?.postedAt || b?.updatedAt) || 0;
        return bd - ad;
      });
    } else if (sort === 'soonest') {
      out.sort((a, b) => {
        const af = parseDate(a?.availableFrom || a?.fromDate || a?.startDate) || new Date(8640000000000000);
        const bf = parseDate(b?.availableFrom || b?.fromDate || b?.startDate) || new Date(8640000000000000);
        return af - bf;
      });
    }

    return out;
  }, [items, q, type, hasDates, sort]);

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const more = visible.length < filtered.length;

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>Home Swap</h1>
        <Link to="/app/homeswap/post" className={buttonStyles.button}>{t('buttons.postHomeSwap')}</Link>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: '1fr repeat(3, minmax(140px, auto))',
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <input
          type="search"
          placeholder={t('homeSwap.searchPlaceholder')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border, #e5e7eb)',
            outline: 'none',
          }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Home type"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border, #e5e7eb)',
            outline: 'none',
          }}
        >
          <option value="all">{t('homeSwap.allTypes')}</option>
          <option value="entire">{t('homeSwap.entirePlace')}</option>
          <option value="room">{t('homeSwap.privateRoom')}</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={hasDates}
            onChange={(e) => setHasDates(e.target.checked)}
          />
          Has dates
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort"
          style={{
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border, #e5e7eb)',
            outline: 'none',
          }}
        >
          <option value="new">{t('homeSwap.newest')}</option>
          <option value="soonest">{t('homeSwap.soonestAvailable')}</option>
        </select>
      </div>

      {/* Status line */}
      <div style={{ marginTop: 8, color: '#64748b' }}>
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <InlineSpinner size="xs" color="muted" />
            {t('common.loading')}
          </span>
        ) : (
          `${filtered.length} result${filtered.length === 1 ? '' : 's'}`
        )}
        {q && ` for “${q}”`}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: 12, color: '#b91c1c', background: '#fef2f2', padding: 12, borderRadius: 8, border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Grid */}
      <div
        aria-busy={loading ? 'true' : 'false'}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
          marginTop: 16,
        }}
      >
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 14,
                overflow: 'hidden',
                background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
                backgroundSize: '400% 100%',
                height: 220,
                animation: 'shimmer 1.4s infinite',
              }} />
            ))
          : visible.length === 0
          ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 16px', border: '1px dashed #d1d5db', borderRadius: 14 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🏠</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No Home Swaps yet</div>
              <div style={{ color: '#64748b', marginBottom: 16 }}>Be the first to post and start a friendly swap.</div>
              <Link to="/app/homeswap/post" className={buttonStyles.button}>{t('buttons.postHomeSwap')}</Link>
            </div>
          )
          : visible.map((item) => {
              const id = item?.id || item?._id;
              const explicitCover = coverFrom(item);
              // Fallback to first photo from backend if we know there is at least one
              const derivedCover = item?.photosCount > 0 ? `/homeswap/${id}/photos/0` : null;
              const coverSrc = explicitCover || derivedCover;

              const created = item?.createdAt || item?.postedAt || item?.updatedAt;
              const recent = isRecent(created);
              const from = parseDate(item?.availableFrom || item?.fromDate || item?.startDate);
              const to = parseDate(item?.availableTo || item?.toDate || item?.endDate);
              const homeType = (item?.homeType || '').toLowerCase();
              const bedrooms = item?.bedrooms ?? item?.beds ?? '';

              return (
                <Link
                  key={id}
                  to={`/app/homeswap/${id}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: 14,
                    overflow: 'hidden',
                    textDecoration: 'none',
                    background: 'var(--card, #fff)',
                    transition: 'transform .15s ease, box-shadow .15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(2,6,23,.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#f3f4f6' }}>
                    {coverSrc ? (
                      // Use AuthImage so auth headers are included for protected routes
                      <AuthImage
                        src={coverSrc}
                        alt={item?.title || 'Home Swap'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 40, color: '#94a3b8',
                        background: 'linear-gradient(135deg, #f8fafc, #eef2ff)'
                      }}>🏠</div>
                    )}

                    {recent && (
                      <span style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        padding: '4px 8px',
                        background: '#0ea5e9',
                        color: 'white',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                      }}>
                        New
                      </span>
                    )}
                  </div>

                  <div style={{ padding: 12 }}>
                    <h3 style={{ margin: '0 0 4px', color: 'var(--text, #0f172a)' }}>
                      {item?.title || 'Untitled'}
                    </h3>
                    <div style={{ color: '#64748b', fontSize: 14 }}>
                      {item?.location || '—'}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, fontSize: 12 }}>
                      {homeType && (
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: '#f1f5f9', color: '#0f172a' }}>
                          {homeType === 'entire' ? t('homeSwap.entirePlace') : homeType === 'room' ? t('homeSwap.privateRoom') : homeType}
                        </span>
                      )}
                      {Number.isFinite(Number(bedrooms)) && bedrooms !== '' && (
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: '#f1f5f9', color: '#0f172a' }}>
                          {bedrooms} {Number(bedrooms) === 1 ? 'bedroom' : 'bedrooms'}
                        </span>
                      )}
                      {from && to && (
                        <span style={{ padding: '4px 8px', borderRadius: 999, background: '#ecfeff', color: '#075985' }}>
                          {fmtDate(from)} – {fmtDate(to)}
                        </span>
                      )}
                    </div>

                    <p style={{ marginTop: 8, color: '#334155', fontSize: 14 }}>
                      {((item?.description || '').slice(0, 120))}{(item?.description || '').length > 120 ? '…' : ''}
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>

      {/* Load more */}
      {!loading && visible.length > 0 && more && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <button
            type="button"
            className={buttonStyles.ghost}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('feed.loadMore')}
          </button>
        </div>
      )}

      {/* Shimmer keyframes (scoped) */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
