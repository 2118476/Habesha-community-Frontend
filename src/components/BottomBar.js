import React, { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../stylus/components/BottomBar.module.scss';

/**
 * BottomBar displays a fixed navigation bar on small devices with
 * quick access to the most common destinations: home, explore,
 * create post, saved items and account settings. It only appears
 * below a certain viewport width via CSS media queries.
 *
 * The "Explore" button dispatches a synthetic "/" keydown event so
 * the existing SearchPopover (mounted in the Header) opens — no
 * duplicate search component needed.
 */
const BottomBar = () => {
  const { t } = useTranslation();

  const openSearch = useCallback(() => {
    // SearchPopover listens for "/" keydown on document when no input is focused
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: '/', bubbles: true })
    );
  }, []);

  return (
    <nav className={styles.bar}>
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
