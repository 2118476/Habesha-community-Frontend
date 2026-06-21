// src/pages/Home/HomeDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFeed } from '../../api/feed';
import useAuth from '../../hooks/useAuth';
import styles from '../../stylus/sections/HomeDashboard.module.scss';

/**
 * HomeDashboard — the signed-in landing page.
 * Bento layout: Rentals featured (large), Services + Home-swap (small column),
 * Events + Travel (row), Community ads (full-width at the bottom).
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
  ad:        { label: 'Community ads', list: '/app/ads',       post: '/app/ads/post',       blurb: 'buy & sell' },
};

function initialOf(s) {
  const t = (s || '?').trim();
  return t ? t[0].toUpperCase() : '?';
}

function Card({ item, big = false }) {
  const img = item.imageUrlAbsolute || item.imageUrl;
  return (
    <Link to={item.detailPath || SECTIONS[item.type]?.list || '#'} className={[styles.card, big ? styles.cardBig : ''].join(' ')}>
      <div className={styles.thumb} style={img ? { backgroundImage: `url(${img})` } : undefined}>
        {!img && <span className={styles.thumbFallback}>{initialOf(item.title)}</span>}
      </div>
      <div className={styles.cardBody}>
        <h4 className={styles.cardTitle}>{item.title || 'Untitled'}</h4>
        <div className={styles.cardMeta}>
          {item.price != null && item.price !== '' && <span className={styles.price}>£{item.price}</span>}
          {item.location && <span className={styles.loc}>{item.location}</span>}
        </div>
      </div>
    </Link>
  );
}

function SectionHead({ type }) {
  const s = SECTIONS[type];
  return (
    <div className={styles.panelHead}>
      <span className={[styles.panelIcon, styles[`ic_${type}`]].join(' ')}>{ICONS[type]}</span>
      <div className={styles.panelTitleWrap}>
        <h3 className={styles.panelTitle}>{s.label}</h3>
        <span className={styles.panelBlurb}>{s.blurb}</span>
      </div>
      <Link to={s.list} className={styles.viewAll}>View all →</Link>
    </div>
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

function Panel({ type, items, big = false, limit = 4, variant = 'panel' }) {
  const list = items.slice(0, limit);
  return (
    <section className={[styles[variant], big ? styles.panelBig : ''].join(' ')}>
      <SectionHead type={type} />
      {list.length === 0 ? (
        <EmptyState type={type} />
      ) : (
        <div className={big ? styles.gridBig : styles.gridSmall}>
          {list.map((it) => <Card key={`${type}-${it.id}`} item={it} big={big} />)}
        </div>
      )}
    </section>
  );
}

function SkeletonPanel({ tall = false }) {
  return (
    <div className={[styles.panel, tall ? styles.panelBig : ''].join(' ')} aria-hidden="true">
      <div className={styles.skelHead} />
      <div className={tall ? styles.gridBig : styles.gridSmall}>
        {Array.from({ length: tall ? 4 : 2 }).map((_, i) => <div key={i} className={styles.skelCard} />)}
      </div>
    </div>
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

  const by = (t) => items.filter((i) => (i.type || '').toLowerCase() === t);
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
        <div className={styles.patternTop} style={{ backgroundImage: `url(${patternUrl})` }} aria-hidden="true" />
        <div className={styles.patternBottom} style={{ backgroundImage: `url(${patternUrl})` }} aria-hidden="true" />
        <div className={styles.bannerContent}>
          <h1>{firstName ? `Selam, ${firstName} 👋` : 'Selam 👋'}</h1>
          <p>Here’s what’s new in your community today.</p>
        </div>
      </header>

      {loading ? (
        <>
          <div className={styles.rowTop}>
            <SkeletonPanel tall />
            <div className={styles.colSmall}>
              <SkeletonPanel />
              <SkeletonPanel />
            </div>
          </div>
          <div className={styles.rowTwo}>
            <SkeletonPanel />
            <SkeletonPanel />
          </div>
        </>
      ) : error ? (
        <div className={styles.errorBox}>
          <p>Couldn’t load the latest posts. Please refresh.</p>
        </div>
      ) : (
        <>
          <div className={styles.rowTop}>
            <Panel type="rental" items={by('rental')} big limit={6} />
            <div className={styles.colSmall}>
              <Panel type="service" items={by('service')} limit={2} />
              <Panel type="home_swap" items={by('home_swap')} limit={2} />
            </div>
          </div>

          <div className={styles.rowTwo}>
            <Panel type="event" items={by('event')} limit={3} />
            <Panel type="travel" items={by('travel')} limit={3} />
          </div>

          <Panel type="ad" items={by('ad')} variant="panelWide" limit={8} />
        </>
      )}
    </div>
  );
}
