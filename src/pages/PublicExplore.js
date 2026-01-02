// src/pages/PublicExplore.js
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import styles from '../stylus/sections/PublicExplore.module.scss';
import Footer from '../layout/Footer';
import ExploreCategories from '../components/ExploreCategories';

/**
 * PublicExplore is the signed-out landing page for the Habesha Community.
 * Frontend-only: no backend calls here.
 */
const PublicExplore = () => {
  const navigate = useNavigate();
  const { user, authReady } = useAuth();

  // Navbar transparent while hero is visible; solid after you scroll past it.
  const heroRef = useRef(null);
  const [solidNav, setSolidNav] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        // Keep navbar transparent while ~60%+ of hero is in view
        setSolidNav(!(entry.isIntersecting && entry.intersectionRatio > 0.6));
      },
      { threshold: [0, 0.6, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // If logged in, send users straight to the app
  useEffect(() => {
    if (authReady && user) navigate('/app/home', { replace: true });
  }, [authReady, user, navigate]);

  // --- Hero background: keep your public image and add a soft gradient overlay
  const heroImagePath = encodeURI(`${process.env.PUBLIC_URL}/images/hero.png`);
  const heroBg = `linear-gradient(0deg, rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${heroImagePath})`;

  // --- Auto-contrast: compute text color (#fff on dark images, #0f172a on bright)
  const [heroInk, setHeroInk] = useState('#ffffff');

  useEffect(() => {
    const img = new Image();
    img.src = heroImagePath;
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r /= count; g /= count; b /= count;

        // Perceived luminance (0..1)
        const L = 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255);

        // Threshold tuned considering the .35 black overlay above
        setHeroInk(L > 0.55 ? '#0f172a' : '#ffffff');
      } catch {
        setHeroInk('#ffffff');
      }
    };

    img.onerror = () => setHeroInk('#ffffff');
  }, [heroImagePath]);

  // Helper to get semi-transparent border using the chosen ink color
  const hexToRgba = (hex, a = 0.28) => {
    const h = hex.replace('#', '');
    const isShort = h.length === 3;
    const r = parseInt(isShort ? h[0] + h[0] : h.slice(0, 2), 16);
    const g = parseInt(isShort ? h[1] + h[1] : h.slice(2, 4), 16);
    const b = parseInt(isShort ? h[2] + h[2] : h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  return (
    <div className={styles.wrapper}>
      {/* Header overlays hero image; switches style on scroll */}
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
          Habesha Community
        </div>

        <nav className={styles.navLinks} aria-label="Primary">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <div className={styles.authLinks}>
          <button
            onClick={() => navigate('/login')}
            className={styles.signInBtn}
            type="button"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className={styles.registerBtn}
            type="button"
          >
            Register
          </button>
        </div>
      </header>

      <main className={styles.container}>
        {/* Hero: background image is provided via CSS var (--hero-bg) */}
        <section
          className={styles.hero}
          ref={heroRef}
          style={{ '--hero-bg': heroBg, '--hero-ink': heroInk }}
        >
          <h1 style={{ color: 'var(--hero-ink)' }}>Welcome to Our Community</h1>
          <p style={{ color: 'var(--hero-ink)' }}>
            Connect with Ethiopians and Habesha friends across the UK. Find
            housing, services, events and travel buddies—built specifically for
            you.
          </p>
          <div className={styles.ctaGroup}>
            <button
              onClick={() => navigate('/register')}
              className={styles.primaryCta}
              type="button"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate('/login')}
              className={styles.secondaryCta}
              type="button"
              style={{
                color: 'var(--hero-ink)',
                borderColor: hexToRgba(heroInk, 0.28),
                background: hexToRgba(heroInk, 0.08),
              }}
            >
              Sign In
            </button>
          </div>
        </section>

        {/* Explore categories (image cards) */}
        <ExploreCategories />

        <section className={styles.howItWorks}>
          <h2>How it works</h2>
          <ol>
            <li>Create a free account using your email or phone number.</li>
            <li>Browse listings or post your own offers and requests.</li>
            <li>Chat privately to arrange viewings, services or travel plans.</li>
            <li>
              Meet in safe public places and report any issues to keep the
              community safe.
            </li>
          </ol>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PublicExplore;
