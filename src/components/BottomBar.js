import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../stylus/components/BottomBar.module.scss';

const SCROLL_THRESHOLD = 8; // px of scroll before toggling

const BottomBar = () => {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (delta > SCROLL_THRESHOLD) setHidden(true);   // scrolling down
        else if (delta < -SCROLL_THRESHOLD) setHidden(false); // scrolling up
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset on route change (AppShell dispatches 'routechange')
  useEffect(() => {
    const reset = () => { setHidden(false); lastY.current = 0; };
    window.addEventListener('routechange', reset);
    return () => window.removeEventListener('routechange', reset);
  }, []);

  const openSearch = useCallback(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '/', bubbles: true })
    );
  }, []);

  return (
    <nav
      className={`${styles.bar} ${hidden ? styles.barHidden : ''}`}
      aria-hidden={hidden}
    >
      <NavLink
        to="/app/home"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>{t('bottomBar.home')}</span>
      </NavLink>

      <button
        type="button"
        className={styles.link}
        onClick={openSearch}
        aria-label={t('bottomBar.explore')}
      >
        <span className={styles.icon}>🔍</span>
        <span className={styles.label}>{t('bottomBar.explore')}</span>
      </button>

      <NavLink
        to="/app/rentals"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>➕</span>
        <span className={styles.label}>{t('bottomBar.post')}</span>
      </NavLink>
      <NavLink
        to="/app/messages"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>💬</span>
        <span className={styles.label}>{t('bottomBar.messages')}</span>
      </NavLink>
      <NavLink
        to="/app/settings/account"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>{t('bottomBar.account')}</span>
      </NavLink>
    </nav>
  );
};

export default BottomBar;
