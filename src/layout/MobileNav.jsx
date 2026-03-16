import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useAuth from "../hooks/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, MessageCircle, Users, CalendarDays,
  Wrench, Plane, Repeat, Home, Megaphone, Settings,
  User, ShieldCheck, Shield, X,
} from "lucide-react";
import styles from "./MobileNav.module.scss";

function LinkItem({ to, icon: Icon, label, onClose }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [styles.item, isActive ? styles.active : ""].join(" ")
      }
      onClick={onClose}
    >
      <Icon size={18} strokeWidth={1.8} className={styles.itemIcon} />
      <span>{label}</span>
    </NavLink>
  );
}

export default function MobileNav({ open, onClose }) {
  const { t } = useTranslation();
  const { user, roles = [], authReady } = useAuth() || {};
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((r) => {
        const s = (r || "").toString().trim().toUpperCase();
        return s.startsWith("ROLE_") ? s.substring(5) : s;
      })
    : [];
  const isAdmin = (authReady || normalizedRoles.length > 0) && normalizedRoles.some((r) => r === "ADMIN");
  const isMod = (authReady || normalizedRoles.length > 0) && (isAdmin || normalizedRoles.some((r) => r === "MODERATOR"));
  const sheetRef = useRef(null);
  const { pathname } = useLocation();

  const displayName = user?.name || user?.displayName || user?.username || "User";
  const initials = displayName.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

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
      <button className={styles.backdrop} aria-label="Close navigation" onClick={onClose} />
      <aside ref={sheetRef} className={styles.drawer} role="dialog" aria-modal="true" aria-label="Navigation">

        {/* Header with profile + close */}
        <div className={styles.topRow}>
          <div className={styles.profile}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>{displayName}</div>
              <div className={styles.profileRole}>{normalizedRoles[0] || "Member"}</div>
            </div>
          </div>
          <div className={styles.topActions}>
            <button className={styles.closeBtn} aria-label="Close menu" onClick={onClose}>
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Navigation links */}
        <nav className={styles.nav}>
          <div className={styles.group}>
            <div className={styles.label}>{t("sidebar.overview")}</div>
            <LinkItem to="/app" icon={LayoutDashboard} label={t("sidebar.dashboard")} onClose={onClose} />
            <LinkItem to="/app/messages" icon={MessageCircle} label={t("nav.messages")} onClose={onClose} />
            <LinkItem to="/app/friends" icon={Users} label={t("nav.friends")} onClose={onClose} />
          </div>

          <div className={styles.group}>
            <div className={styles.label}>{t("sidebar.community")}</div>
            <LinkItem to="/app/events" icon={CalendarDays} label={t("sidebar.events")} onClose={onClose} />
            <LinkItem to="/app/services" icon={Wrench} label={t("sidebar.services")} onClose={onClose} />
            <LinkItem to="/app/travel" icon={Plane} label={t("sidebar.travel")} onClose={onClose} />
            <LinkItem to="/app/homeswap" icon={Repeat} label={t("sidebar.swap")} onClose={onClose} />
            <LinkItem to="/app/rentals" icon={Home} label={t("sidebar.rentals")} onClose={onClose} />
            <LinkItem to="/app/ads" icon={Megaphone} label={t("sidebar.ads")} onClose={onClose} />
          </div>

          <div className={styles.group}>
            <div className={styles.label}>{t("sidebar.account")}</div>
            <LinkItem to="/app/settings" icon={Settings} label={t("nav.settings")} onClose={onClose} />
            <LinkItem to="/app/profile" icon={User} label={t("nav.profile")} onClose={onClose} />
          </div>

          {isAdmin && (
            <div className={styles.group}>
              <div className={styles.label}>{t("sidebar.administration")}</div>
              <LinkItem to="/app/admin" icon={ShieldCheck} label={t("sidebar.adminDashboard")} onClose={onClose} />
            </div>
          )}

          {isMod && (
            <div className={styles.group}>
              <div className={styles.label}>{t("sidebar.moderation")}</div>
              <LinkItem to="/app/mod" icon={Shield} label={t("sidebar.moderatorDashboard")} onClose={onClose} />
            </div>
          )}
        </nav>
      </aside>
    </div>
  );
}
