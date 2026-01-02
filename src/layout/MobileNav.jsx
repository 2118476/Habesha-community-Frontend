// upgraded MobileNav
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import LanguageToggle from "../components/LanguageToggle";
import styles from "./MobileNav.module.scss";

function LinkItem({ to, label, onClose }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [styles.item, isActive ? styles.active : ""].join(" ")
      }
      onClick={onClose}
    >
      {label}
    </NavLink>
  );
}

export default function MobileNav({ open, onClose }) {
  const { t } = useTranslation();
  const { roles = [], authReady } = useAuth() || {};
  // Roles are already normalized in AuthContext. We still defensively normalize and
  // support both raw and prefixed values in case some APIs return ROLE_ADMIN etc.
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((r) => {
        const s = (r || '').toString().trim().toUpperCase();
        return s.startsWith('ROLE_') ? s.substring(5) : s;
      })
    : [];
  const isAdmin = (authReady || normalizedRoles.length > 0) && normalizedRoles.some((r) => r === 'ADMIN');
  const isMod = (authReady || normalizedRoles.length > 0) && (isAdmin || normalizedRoles.some((r) => r === 'MODERATOR'));
  const sheetRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    setTimeout(() => sheetRef.current?.querySelector("a,button")?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  return (
    <div className={styles.wrap} aria-hidden={open ? "false" : "true"}>
      <button className={styles.backdrop} aria-label={t('nav.openNavigation')} onClick={onClose} />
      <aside
        ref={sheetRef}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <div className={styles.topRow}>
          <div className={styles.brand}>{t('nav.habesha')}</div>
          <LanguageToggle />
          <button className={styles.closeBtn} aria-label={t('nav.closeMenu')} onClick={onClose}>✕</button>
        </div>

        <nav className={styles.nav}>
          <div className={styles.group}>
            <div className={styles.label}>{t('sidebar.overview')}</div>
            <LinkItem to="/app" label={t('sidebar.dashboard')} onClose={onClose} />
            <LinkItem to="/app/messages" label={t('nav.messages')} onClose={onClose} />
            <LinkItem to="/app/friends" label={t('nav.friends')} onClose={onClose} />
          </div>

          <div className={styles.group}>
            <div className={styles.label}>{t('sidebar.community')}</div>
            <LinkItem to="/app/events" label={t('sidebar.events')} onClose={onClose} />
            <LinkItem to="/app/services" label={t('sidebar.services')} onClose={onClose} />
            <LinkItem to="/app/travel" label={t('sidebar.travel')} onClose={onClose} />
            <LinkItem to="/app/homeswap" label={t('sidebar.swap')} onClose={onClose} />
            <LinkItem to="/app/rentals" label={t('sidebar.rentals')} onClose={onClose} />
            <LinkItem to="/app/ads" label={t('sidebar.ads')} onClose={onClose} />
          </div>

          <div className={styles.group}>
            <div className={styles.label}>{t('sidebar.account')}</div>
            <LinkItem to="/app/settings" label={t('nav.settings')} onClose={onClose} />
            <LinkItem to="/app/profile" label={t('nav.profile')} onClose={onClose} />
          </div>

        {isAdmin && (
          <div className={styles.group}>
            <div className={styles.label}>{t('sidebar.administration')}</div>
            <LinkItem to="/app/admin" label={t('sidebar.adminDashboard')} onClose={onClose} />
          </div>
        )}

        {isMod && (
          <div className={styles.group}>
            <div className={styles.label}>{t('sidebar.moderation')}</div>
            <LinkItem to="/app/mod" label={t('sidebar.moderatorDashboard')} onClose={onClose} />
          </div>
        )}
        </nav>
      </aside>
    </div>
  );
}
