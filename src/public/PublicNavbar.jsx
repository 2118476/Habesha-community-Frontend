import React from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import styles from '../stylus/public/PublicNavbar.module.scss';
import ThemeToggle from '../components/ThemeToggle';
import LanguageToggle from '../components/LanguageToggle';

const PublicNavbar = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Guard: do not render inside the authenticated app or when user is logged in
  if (user || location.pathname.startsWith('/app')) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        <Link to='/'>
          <img src="/icons/coffee.svg" alt={t('nav.coffeeIcon')} />
          {t('nav.habeshaCommunity')}
        </Link>
      </div>

      <nav className={styles.navLinks} aria-label="primary">
        <NavLink to="/" end className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>{t('nav.home')}</NavLink>
        <NavLink to="/about" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>{t('nav.about')}</NavLink>
        <NavLink to="/contact" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>{t('nav.contact')}</NavLink>
      </nav>

      <div className={styles.actions}>
        {!user ? (
          <Link to="/login" className={styles.btnLink}>{t('nav.login')}</Link>
        ) : (
          <>
            <span>{t('pages.welcome')}, {user.name}</span>
            <button onClick={handleLogout} className={styles.btnLink}>{t('nav.logout')}</button>
          </>
        )}
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  );
};

export default PublicNavbar;
