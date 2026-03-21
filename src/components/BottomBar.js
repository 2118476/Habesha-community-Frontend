import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../stylus/components/BottomBar.module.scss';

const SCROLL_THRESHOLD = 8;

const BottomBar = () => {
  const { t, i18n } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
  const isEn = currentLang !== 'am';

  const toggleLang = () => {
    const next = isEn ? 'am' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('ui.lang', next);
  };

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (delta > SCROLL_THRESHOLD) setHidden(true);
        else if (delta < -SCROLL_THRESHOLD) setHidden(false);
        lastY.current = y;
        ticking.current = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const reset = () => { setHidden(false); lastY.current = 0; };
    window.addEventListener('routechange', reset);
    return () => window.removeEventListener('routechange', reset);
  }, []);

  return (
    <nav
      className={`${styles.bar} ${hidden ? styles.barHidden : ''}`}
      aria-hidden={hidden}
    >
      <NavLink
        to="/app/settings/account"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>👤</span>
        <span className={styles.label}>{t('bottomBar.account')}</span>
      </NavLink>

      <button
        type="button"
        className={styles.link}
        onClick={toggleLang}
        aria-label={t('nav.language')}
      >
        <span className={styles.langIcon}>
          <span className={isEn ? styles.langActive : ''}>E</span>
          <span>/</span>
          <span className={!isEn ? styles.langActive : ''}>አ</span>
        </span>
        <span className={styles.label}>{t('bottomBar.language')}</span>
      </button>

      <NavLink
        to="/app/notifications"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>🔔</span>
        <span className={styles.label}>{t('bottomBar.notifications')}</span>
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
        to="/app/home"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>🏠</span>
        <span className={styles.label}>{t('bottomBar.home')}</span>
      </NavLink>
    </nav>
  );
};

export default BottomBar;
