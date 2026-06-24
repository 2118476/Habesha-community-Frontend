// src/pages/Home/HomeDashboard.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchFeed } from '../../api/feed';
import useAuth from '../../hooks/useAuth';
import { makeApiUrl } from '../../api/httpUrl';
import PostedDate from '../../components/PostedDate/PostedDate';
import styles from '../../stylus/sections/HomeDashboard.module.scss';

/**
 * HomeDashboard — the signed-in landing page.
 * Each category is a panel with a swipeable gallery of preview cards
 * (price, location, posted date, rating) + a "View all →" to the full list.
 */

const Svg = ({ children }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const ICONS = {
  rental: <Svg><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></Svg>,
  service: <Svg><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-2.1Z" /></Svg>,
  home_swap: <Svg><path d="M7 7h10v4M17 7l-3-3M17 17H7v-4M7 17l3 3" /></Svg>,
  event: <Svg><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>,
  travel: <Svg><path d="M2 16.5 21 9l-5.5 11-2.5-5-5-1.5Z" /><path d="M13.5 14 21 9" /></Svg>,
  ad: <Svg><path d="M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z" /><path d="M14 2v6h6" /></Svg>,
};

const SECTIONS = {
  rental:    { label: 'Rentals',       list: '/app/rentals',   post: '/app/rentals/post',   blurb: 'rooms & flats' },
  service:   { label: 'Services',      list: '/app/services',  post: '/app/services/post',  blurb: 'skills & help' },
  home_swap: { label: 'Home swap',     list: '/app/home-swap', post: '/app/home-swap/post', blurb: 'swap homes' },
  event:     { label: 'Events',        list: '/app/events',    post: '/app/events/post',    blurb: 'meetups' },
  travel:    { label: 'Travel',        list: '/app/travel',    post: '/app/travel/post',    blurb: 'trips & rides' },
  ad:        { label: 'Marketplace',   list: '/app/ads',       post: '/app/ads/post',       blurb: 'buy & sell' },
};

// Bento sections shown at the top (Marketplace is its own infinite feed below)
const SECTION_ORDER = ['rental', 'home_swap', 'service', 'travel', 'event'];

const isAbs = (s) => typeof s === 'string' && /^(https?:)?\/\//i.test(s);

function initialOf(s) {
  const t = (s || '?').trim();
  return t ? t[0].toUpperCase() : '?';
}

/** Best-effort cover image for any feed item. */
function resolveImg(item) {
  if (isAbs(item?.imageUrlAbsolute)) return item.imageUrlAbsolute;
  if (item?.imageUrl) return isAbs(item.imageUrl) ? item.imageUrl : makeApiUrl(item.imageUrl);
  if (Array.isArray(item?.photos) && item.photos[0]) {
    const p = item.photos[0];
    const u = typeof p === 'string' ? p : (p.url || p.src || p.path);
    if (u) return isAbs(u) ? u : makeApiUrl(u);
  }
  const t = (item?.type || '').toLowerCase();
  if (item?.id && t.includes('rental')) return makeApiUrl(`/rentals/${item.id}/photos/first`);
  if (item?.id && (t.includes('ad') || t.includes('classified'))) return makeApiUrl(`/ads/${item.id}/photos/first`);
  return null;
}

function detailPathFor(type, item) {
  if (item?.detailPath) return item.detailPath;
  const base = SECTIONS[type]?.list;
  return item?.id != null ? `${base}/${item.id}` : (base || '#');
}

/** Rich preview card: image, price tag, title, location, rating, posted date. */
function PreviewCard({ item, type }) {
  const img = resolveImg(item);
  const price = item?.price ?? item?.basePrice ?? item?.base_price;
  const rating = item?.rating ?? item?.averageRating;
  const isService = type === 'service';
  const showPrice = price != null && price !== '' && Number(price) !== 0;

  return (
    <Link to={detailPathFor(type, item)} className={styles.peekCard} role="listitem">
      <div className={styles.peekThumb} style={img ? { backgroundImage: `url(${img})` } : undefined}>
        {!img && <span className={styles.thumbFallback}>{initialOf(item?.title)}</span>}
        {showPrice && (
          <span className={styles.peekPrice}>£{price}{isService ? '/hr' : ''}</span>
        )}
      </div>
      <div className={styles.peekBody}>
        <h4 className={styles.peekTitle}>{item?.title || 'Untitled'}</h4>
        <div className={styles.peekMeta}>
          {item?.location && <span className={styles.loc}>{item.location}</span>}
          {isService && rating && <span className={styles.rating}>★ {rating}</span>}
        </div>
        <div className={styles.peekFooter}>
          {item?.createdAt && <PostedDate date={item.createdAt} prefix={false} className={styles.peekDate} />}
          <span className={styles.viewDetail}>View →</span>
        </div>
      </div>
    </Link>
  );
}

/** A compact bento panel: one featured card + a "View all" link. */
function PeekPanel({ type, items }) {
  const s = SECTIONS[type];
  const featured = items[0];
  return (
    <section className={styles.peekPanel} aria-labelledby={`sec-${type}`}>
      <div className={styles.panelHead}>
        <span className={[styles.panelIcon, styles[`ic_${type}`]].join(' ')}>{ICONS[type]}</span>
        <div className={styles.panelTitleWrap}>
          <h3 id={`sec-${type}`} className={styles.panelTitle}>{s.label}</h3>
          <span className={styles.panelBlurb}>{s.blurb}</span>
        </div>
      </div>

      {!featured ? (
        <EmptyState type={type} />
      ) : (
        <PreviewCard item={featured} type={type} />
      )}

      <Link to={s.list} className={styles.viewAllRow}>View all →</Link>
    </section>
  );
}

function EmptyState({ type }) {
  const s = SECTIONS[type];
  return (
    <div className={styles.empty}>
      <p>No {s.label.toLowerCase()} yet.</p>
      <Link to={s.post} className={styles.emptyCta}>Post the first one</Link>
    </div>
  );
}

function SkeletonPanel() {
  return (
    <div className={styles.peekPanel} aria-hidden="true">
      <div className={styles.skelHead} />
      <div className={styles.skelPeek} />
    </div>
  );
}

/**
 * Marketplace — infinite-scroll feed of community ads, loaded a page at a time
 * as the user scrolls (Facebook-style). Lives at the bottom of the dashboard.
 */
function MarketplaceFeed() {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const started = useRef(false);

  const loadPage = useCallback(async (cur) => {
    const { items: page = [], nextCursor } = await fetchFeed({
      types: ['ads'],
      limit: 12,
      sort: 'newest',
      cursor: cur,
    });
    setItems((prev) => (cur ? [...prev, ...page] : page));
    setCursor(nextCursor || null);
    if (!nextCursor) setDone(true);
  }, []);

  // initial load (once)
  useEffect(() => {
    if (started.current) return undefined;
    started.current = true;
    (async () => {
      try { await loadPage(null); } catch { setDone(true); } finally { setLoading(false); }
    })();
    return undefined;
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (busy.current || !cursor || done) return;
    busy.current = true;
    setLoadingMore(true);
    try { await loadPage(cursor); } catch { /* keep what we have */ }
    finally { setLoadingMore(false); busy.current = false; }
  }, [cursor, done, loadPage]);

  // load more as the page nears the bottom
  useEffect(() => {
    const onScroll = () => {
      if (busy.current || !cursor || done) return;
      const el = document.documentElement;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight * 0.85) loadMore();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadMore, cursor, done]);

  return (
    <section className={styles.marketSection} aria-labelledby="market-title">
      <div className={styles.panelHead}>
        <span className={[styles.panelIcon, styles.ic_ad].join(' ')}>{ICONS.ad}</span>
        <div className={styles.panelTitleWrap}>
          <h3 id="market-title" className={styles.panelTitle}>{SECTIONS.ad.label}</h3>
          <span className={styles.panelBlurb}>{SECTIONS.ad.blurb}</span>
        </div>
        <Link to={SECTIONS.ad.list} className={styles.viewAll}>View all →</Link>
      </div>

      {loading ? (
        <div className={styles.marketGrid}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className={styles.skelPeek} />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState type="ad" />
      ) : (
        <>
          <div className={styles.marketGrid}>
            {items.map((it, i) => (
              <PreviewCard key={`mk-${it.id ?? i}`} item={it} type="ad" />
            ))}
          </div>
          {loadingMore && <div className={styles.marketStatus}>Loading more…</div>}
          {done && <div className={styles.marketStatus}>You’re all caught up.</div>}
        </>
      )}
    </section>
  );
}

export default function HomeDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchFeed({ types: ['rental', 'service', 'home_swap', 'ads', 'travel', 'event'] });
        if (alive) setItems(Array.isArray(res?.items) ? res.items : []);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // ads come through the feed as type "ad"
  const by = (t) => items.filter((i) => {
    const it = (i.type || '').toLowerCase();
    return t === 'ad' ? (it === 'ad' || it === 'ads' || it === 'classified') : it === t;
  });

  const firstName = (user?.name || user?.displayName || user?.username || '').split(' ')[0];
  const heroVideo = encodeURI(
    `${process.env.PUBLIC_URL}/videos/${isMobile ? 'mobile-hero.mp4' : 'hero-coffee.mp4'}`
  );
  const heroPoster = encodeURI(`${process.env.PUBLIC_URL}/images/hero.png`);
  const patternUrl = encodeURI(`${process.env.PUBLIC_URL}/images/habesha-pattern.png`);

  return (
    <div className={styles.wrapper}>
      <header className={styles.banner}>
        <video
          className={styles.bannerVideo}
          key={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={heroPoster}
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className={styles.bannerOverlay} aria-hidden="true" />
        <div className={styles.patternBottom} style={{ backgroundImage: `url(${patternUrl})` }} aria-hidden="true" />
        <div className={styles.bannerContent}>
          <h1>{firstName ? `Selam, ${firstName} 👋` : 'Selam 👋'}</h1>
          <p>Here’s what’s new in your community today.</p>
        </div>
      </header>

      <div className={styles.panelsGrid}>
        {loading ? (
          <>
            <SkeletonPanel />
            <SkeletonPanel />
            <SkeletonPanel />
          </>
        ) : error ? (
          <div className={styles.errorBox}>
            <p>Couldn’t load the latest posts. Please refresh.</p>
          </div>
        ) : (
          SECTION_ORDER.map((type) => (
            <PeekPanel key={type} type={type} items={by(type)} />
          ))
        )}
      </div>

      {/* Marketplace — infinite-scroll community ads at the bottom */}
      <MarketplaceFeed />
    </div>
  );
}
