// src/pages/PublicExplore.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from '../stylus/sections/PublicExplore.module.scss';
import Footer from '../layout/Footer';
import ExploreCategories from '../components/ExploreCategories';

/**
 * PublicExplore — signed-out landing page for the Habesha Community.
 * Warm, cultural, community-first design. Frontend-only (no backend calls).
 */

/* Small stroke-icon set (no icon dependency needed) */
const Svg = ({ children, size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

const Icons = {
  home: <Svg><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" /></Svg>,
  services: <Svg><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.1-2.1Z" /></Svg>,
  events: <Svg><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>,
  travel: <Svg><path d="M2 16.5 21 9l-5.5 11-2.5-5-5-1.5Z" /><path d="M13.5 14 21 9" /></Svg>,
  shield: <Svg><path d="M12 3 5 6v6c0 4 3 6.5 7 8 4-1.5 7-4 7-8V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>,
  chat: <Svg><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12Z" /></Svg>,
  heart: <Svg><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" /></Svg>,
  spark: <Svg><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></Svg>,
};

const TRUST = [
  { icon: Icons.heart, label: 'Free to join' },
  { icon: Icons.chat, label: 'Private messaging' },
  { icon: Icons.shield, label: 'Verified community' },
  { icon: Icons.spark, label: 'UK-wide & local' },
];

const FEATURES = [
  {
    icon: Icons.home,
    title: 'Housing you can trust',
    desc: 'Rooms, flats and friendly house shares posted by people from the community — not faceless agencies.',
  },
  {
    icon: Icons.services,
    title: 'Services & skills',
    desc: 'Find a tutor, mover, hairdresser or handyman — or offer your own skills and earn within the community.',
  },
  {
    icon: Icons.events,
    title: 'Events & belonging',
    desc: 'Cultural nights, church gatherings, coffee meetups and celebrations happening near you.',
  },
  {
    icon: Icons.travel,
    title: 'Travel together',
    desc: 'Airport pickups, rideshares and travel buddies for trips home and around the UK.',
  },
  {
    icon: Icons.chat,
    title: 'Talk privately',
    desc: 'Message any member directly to arrange viewings, services or plans — safely and privately.',
  },
  {
    icon: Icons.shield,
    title: 'Safety first',
    desc: 'Report and block tools, plus gentle guidance to meet in safe public places. Your community, protected.',
  },
];

const STEPS = [
  'Create a free account with your email or phone number.',
  'Browse listings or post your own offers and requests.',
  'Chat privately to arrange viewings, services or travel plans.',
  'Meet in safe public places and report anything that feels off.',
];

const PublicExplore = () => {
  const navigate = useNavigate();
  const { user, authReady } = useAuth();

  // Navbar transparent over the hero; solid once you scroll past it.
  const heroRef = useRef(null);
  const [solidNav, setSolidNav] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setSolidNav(!(entry.isIntersecting && entry.intersectionRatio > 0.6)),
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Logged-in users skip the marketing page.
  useEffect(() => {
    if (authReady && user) navigate('/app/home', { replace: true });
  }, [authReady, user, navigate]);

  const heroImagePath = encodeURI(`${process.env.PUBLIC_URL}/images/hero.png`);

  // Pick the right hero video for the viewport (separate desktop / mobile cuts).
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  const heroVideo = encodeURI(
    `${process.env.PUBLIC_URL}/videos/${isMobile ? 'mobile-hero.mp4' : 'hero-coffee.mp4'}`
  );

  return (
    <div className={styles.wrapper}>
      {/* Header overlays the hero, turns solid on scroll */}
      <header
        className={[
          styles.navbar,
          solidNav ? styles.navbarSolid : styles.navbarTransparent,
        ].join(' ')}
        role="banner"
      >
        <div
          className={styles.brand}
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate('/')}
        >
          <span className={styles.brandDot} aria-hidden="true" />
          Habesha
        </div>

        <nav className={styles.navLinks} aria-label="Primary">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <div className={styles.authLinks}>
          <button onClick={() => navigate('/login')} className={styles.signInBtn} type="button">
            Sign In
          </button>
          <button onClick={() => navigate('/register')} className={styles.getStartedBtn} type="button">
            Join free
          </button>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className={styles.hero} ref={heroRef}>
          <video
            className={styles.heroVideo}
            key={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster={heroImagePath}
          >
            <source src={heroVideo} type="video/mp4" />
          </video>
          <div className={styles.heroOverlay} aria-hidden="true" />
          <div className={styles.heroInner}>
            <span className={styles.eyebrow}>For Ethiopians &amp; Habesha friends in the UK</span>
            <h1 className={styles.heroTitle}>
              Your community,<br />all in one place.
            </h1>
            <p className={styles.heroSubtitle}>
              Find housing, services, events and travel buddies — and connect with people who
              feel like home. Built for us, by us.
            </p>
            <div className={styles.ctaGroup}>
              <button onClick={() => navigate('/register')} className={styles.primaryCta} type="button">
                Get started — it&apos;s free
              </button>
              <button onClick={() => navigate('/login')} className={styles.secondaryCta} type="button">
                Sign in
              </button>
            </div>

            <ul className={styles.heroTrust}>
              {TRUST.map((t) => (
                <li key={t.label} className={styles.heroTrustItem}>
                  <span className={styles.heroTrustIcon}>{t.icon}</span>
                  {t.label}
                </li>
              ))}
            </ul>
          </div>
          <span className={styles.scrollHint} aria-hidden="true" />
        </section>

        {/* EXPLORE CATEGORIES (own heading + marquee) */}
        <ExploreCategories />

        {/* WHY / FEATURES */}
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Why Habesha Community</span>
            <h2 className={styles.sectionTitle}>Everything you need, in one trusted place</h2>
            <p className={styles.sectionSub}>
              No more scattered Facebook groups and lost messages. One welcoming home for
              the things that matter to our community.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <article key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className={styles.howItWorks}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionEyebrow}>Simple to start</span>
            <h2 className={styles.sectionTitle}>How it works</h2>
          </div>
          <ol className={styles.steps}>
            {STEPS.map((text, i) => (
              <li key={i} className={styles.step}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.stepText}>{text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* FINAL CTA */}
        <section className={styles.ctaBand}>
          <div className={styles.ctaBandInner}>
            <h2 className={styles.ctaBandTitle}>Ready to feel at home?</h2>
            <p className={styles.ctaBandText}>
              Join your neighbours today. It takes less than a minute and it&apos;s completely free.
            </p>
            <div className={styles.ctaGroup}>
              <button onClick={() => navigate('/register')} className={styles.primaryCta} type="button">
                Create your free account
              </button>
              <button onClick={() => navigate('/about')} className={styles.ghostCta} type="button">
                Learn more
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PublicExplore;
