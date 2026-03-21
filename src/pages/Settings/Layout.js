// src/pages/Settings/Layout.js
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Shield, Lock, UserX, Users, Monitor, ChevronRight, ArrowLeft,
} from 'lucide-react';
import styles from '../../stylus/sections/Settings.module.scss';

const MOBILE_BP = 700;

const SettingsLayout = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= MOBILE_BP
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const onChange = () => setIsMobile(mql.matches);
    try { mql.addEventListener('change', onChange); }
    catch { mql.addListener(onChange); }
    return () => {
      try { mql.removeEventListener('change', onChange); }
      catch { mql.removeListener(onChange); }
    };
  }, []);

  const links = [
    { to: 'account',       label: t('settings.account.title'),          icon: User,    desc: t('settings.account.subtitle', 'Name, email, phone') },
    { to: 'privacy',       label: t('settings.privacy.title'),          icon: Shield,  desc: t('settings.privacy.subtitle', 'Visibility, contact info') },
    { to: 'security',      label: t('settings.security.title'),         icon: Lock,    desc: t('settings.security.subtitle', 'Password, sessions') },
    { to: 'blocked-users', label: t('settings.blockedUsers'),           icon: UserX,   desc: t('settings.blockedUsersDesc', 'Manage blocked users') },
    { to: 'contacts',      label: t('settings.contactRequests.title'),  icon: Users,   desc: t('settings.contactRequests.subtitle', 'Pending requests') },
    { to: 'display',       label: t('settings.display.title', 'Display'), icon: Monitor, desc: t('settings.display.subtitle', 'Theme, language') },
  ];

  // On mobile, check if we're on the settings index (no sub-route selected)
  const settingsBase = '/app/settings';
  const isIndex = location.pathname === settingsBase
    || location.pathname === settingsBase + '/';

  // Samsung-style: on mobile, show either the category list OR the sub-page
  const showMobileList = isMobile && isIndex;
  const showMobileSubPage = isMobile && !isIndex;

  if (showMobileList) {
    return (
      <div className={styles.mobileSettingsWrap}>
        <div className={styles.mobileSettingsHeader}>
          <button
            type="button"
            className={styles.mobileBackBtn}
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <h1 className={styles.mobileSettingsTitle}>{t('settings.settings')}</h1>
        </div>
        <nav className={styles.mobileSettingsList} aria-label={t('settings.settings')}>
          {links.map(({ to, label, icon: Icon, desc }) => (
            <NavLink
              key={to}
              to={to}
              className={styles.mobileSettingsItem}
            >
              <span className={styles.mobileSettingsIcon}>
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className={styles.mobileSettingsText}>
                <span className={styles.mobileSettingsLabel}>{label}</span>
                <span className={styles.mobileSettingsDesc}>{desc}</span>
              </span>
              <ChevronRight size={18} className={styles.mobileSettingsChevron} />
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  if (showMobileSubPage) {
    return (
      <div className={styles.mobileSubPage}>
        <button
          type="button"
          className={styles.mobileBackBtn}
          onClick={() => navigate('/app/settings')}
          aria-label={t('common.back')}
        >
          <ArrowLeft size={20} strokeWidth={2} />
          <span>{t('settings.settings')}</span>
        </button>
        <div className={styles.mobileSubContent}>
          <Outlet />
        </div>
      </div>
    );
  }

  // Desktop: classic sidebar + panel
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
