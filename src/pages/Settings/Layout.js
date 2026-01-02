// src/pages/Settings/Layout.js
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from '../../stylus/sections/Settings.module.scss';

/**
 * SettingsLayout wraps all settings pages and provides a side navigation
 * (vertical on desktop, horizontal on mobile) for moving between
 * different preference categories. The nested outlet renders the
 * current settings view.
 */
const SettingsLayout = () => {
  const { t } = useTranslation();
  
  const links = [
    { to: 'account', label: t('settings.account.title') },
    { to: 'privacy', label: t('settings.privacy.title') },
    { to: 'security', label: t('settings.security.title') },
    { to: 'blocked-users', label: t('settings.blockedUsers') },
    { to: 'contacts', label: t('settings.contactRequests.title') },
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.nav} aria-label={t('settings.settings')}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.panel}>
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout;
