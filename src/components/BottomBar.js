import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../stylus/components/BottomBar.module.scss';

const SCROLL_THRESHOLD = 8;

const TEXT_INPUT_TYPES_TO_IGNORE = [
  'checkbox', 'radio', 'button', 'submit', 'reset',
  'file', 'range', 'color', 'image',
];

/** True for elements that pop the on-screen keyboard (text fields, textareas). */
function isEditable(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'textarea') return true;
  if (el.isContentEditable) return true;
  if (tag === 'input') {
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return !TEXT_INPUT_TYPES_TO_IGNORE.includes(type);
  }
  return false;
}

const BottomBar = () => {
  const { t, i18n } = useTranslation();
  const [hidden, setHidden] = useState(false);
  const [typing, setTyping] = useState(false);
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

  // Hide the bar while a text field is focused (chat, comments, search, etc.)
  // so the on-screen keyboard never collides with it. Stays hidden — even on
  // scroll — until focus leaves the field / the keyboard is dismissed.
  useEffect(() => {
    const onFocusIn = (e) => {
      if (isEditable(e.target)) setTyping(true);
    };
    const onFocusOut = () => {
      // Defer so focus moving between two inputs doesn't flicker the bar.
      setTimeout(() => setTyping(isEditable(document.activeElement)), 0);
    };
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  const barHidden = hidden || typing;

  return (
    <nav
      className={`${styles.bar} ${barHidden ? styles.barHidden : ''}`}
      aria-hidden={barHidden}
    >
      <NavLink
        to="/app/settings"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>⚙️</span>
        <span className={styles.label}>{t('bottomBar.settings')}</span>
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
        <span className={`${styles.label} ${styles.langActive}`}>
          {isEn ? 'Eng' : 'አማ'}
        </span>
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
