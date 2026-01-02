import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../stylus/components/BottomBar.module.scss';

/**
 * BottomBar displays a fixed navigation bar on small devices with
 * quick access to the most common destinations: home, explore,
 * create post, saved items and account settings. It only appears
 * below a certain viewport width via CSS media queries.
 */
const BottomBar = () => {
  const { t } = useTranslation();
  
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
      <NavLink
        to="/app/rentals"
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.active : ''}`
        }
      >
        <span className={styles.icon}>🔍</span>
        <span className={styles.label}>{t('bottomBar.explore')}</span>
      </NavLink>
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