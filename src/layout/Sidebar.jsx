// src/layout/Sidebar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import { NavLink } from "react-router-dom";
import styles from "./Sidebar.module.scss";

function Item({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [styles.item, isActive ? styles.active : ""].join(" ")
      }
    >
      <span className={styles.icon} aria-hidden>{icon}</span>
      <span className={styles.label}>{label}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { t } = useTranslation();
  // Pull roles and authReady from context. We only evaluate the
  // role flags once auth state has been hydrated to avoid
  // incorrect state during transitions (e.g. after a logout/login).
  const { roles = [], authReady } = useAuth() || {};
  // Roles are already normalized in AuthContext. We still defensively normalize and
  // support both raw and prefixed values in case some APIs return ROLE_ADMIN etc.
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((r) => {
        const s = (r || '').toString().trim().toUpperCase();
        return s.startsWith('ROLE_') ? s.substring(5) : s;
      })
    : [];
  // Determine RBAC flags. We allow rendering once we have any roles or auth state is ready.
  const isAdmin = (authReady || normalizedRoles.length > 0) && normalizedRoles.some((r) => r === 'ADMIN');
  const isMod = (authReady || normalizedRoles.length > 0) && (isAdmin || normalizedRoles.some((r) => r === 'MODERATOR'));
  return (
    <nav className={styles.sidebar} aria-label="Primary">
      <div className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.mark} aria-hidden>HC</span>
          <strong className={styles.brandName}>{t('nav.habesha')}</strong>
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.title}>{t('sidebar.overview')}</div>
        <Item to="/app/home" icon="📊" label={t('sidebar.dashboard')} />
        <Item to="/app/friends" icon="👥" label={t('nav.friends')} />
      </div>

      <div className={styles.group}>
        <div className={styles.title}>{t('sidebar.community')}</div>
        <Item to="/app/rentals" icon="🏠" label={t('sidebar.rentals')} />
        <Item to="/app/homeswap" icon="🔁" label={t('sidebar.swap')} />
        <Item to="/app/services" icon="🛠️" label={t('sidebar.services')} />
        <Item to="/app/ads" icon="🛍️" label={t('sidebar.ads')} />
        <Item to="/app/travel" icon="✈️" label={t('sidebar.travel')} />
        <Item to="/app/events" icon="🎉" label={t('sidebar.events')} />
      </div>

      <div className={styles.group}>
        <div className={styles.title}>{t('sidebar.communication')}</div>
        <Item to="/app/messages" icon="💬" label={t('nav.messages')} />
      </div>

      <div className={styles.group}>
        <div className={styles.title}>{t('sidebar.account')}</div>
        <Item to="/app/settings" icon="⚙️" label={t('nav.settings')} />
        <Item to="/app/profile" icon="🙂" label={t('nav.profile')} />
      </div>

      {isAdmin && (
        <div className={styles.group}>
          <div className={styles.title}>{t('sidebar.administration')}</div>
          <Item to="/app/admin" icon="🛡️" label={t('sidebar.adminDashboard')} />
        </div>
      )}

      {isMod && (
        <div className={styles.group}>
          <div className={styles.title}>{t('sidebar.moderation')}</div>
          <Item to="/app/mod" icon="👁️" label={t('sidebar.moderatorDashboard')} />
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.hint}>© {new Date().getFullYear()} {t('nav.habesha')}</div>
      </footer>
    </nav>
  );
}
