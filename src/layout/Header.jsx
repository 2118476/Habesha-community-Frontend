// FILE: src/layout/Header.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { enterpriseToast } from "../components/ToastExports";
import { useTranslation } from "react-i18next";

import useAuth from "../hooks/useAuth";
import useCounts from "../hooks/useCounts";
import useUnreadCount from "../hooks/useUnreadCount";

import NoticeBadge from "../components/Nav/NoticeBadge";
import Icon from "../components/Nav/Icon";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import api from "../api/axiosInstance";
import NotificationBell from "../components/notifications/NotificationBell";
import SearchPopover from "../components/search/SearchPopover";

import styles from "./Header.module.scss";

const getInitialTheme = () => {
  // Read the persisted theme or fall back to dark when none is present.
  const saved = localStorage.getItem("ui.theme");
  if (saved === "dark" || saved === "light") return saved;
  return "dark"; // Default to One UI 8 inspired dark mode
};

const firstString = (...vals) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) || null;

const toAbsoluteUrl = (src) => {
  if (!src) return null;
  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return src;
  const base = (api?.defaults?.baseURL || "").replace(/\/$/, "");
  const path = src.startsWith("/") ? src : `/${src}`;
  return `${base}${path}`;
};

const pickAvatarPath = (u) => {
  if (!u) return null;
  const urlLike = firstString(
    u?.avatarUrl,
    u?.avatarURL,
    u?.avatar,
    u?.photoUrl,
    u?.photoURL,
    u?.photo,
    u?.imageUrl,
    u?.imageURL,
    u?.image,
    u?.picture,
    u?.pictureUrl,
    u?.pictureURL,
    u?.profilePhotoUrl,
    u?.profilePicUrl,
    u?.profileImageUrl,
    u?.avatar?.url,
    u?.photo?.url,
    u?.image?.url,
    u?.picture?.url,
    u?.profilePhoto?.url,
    u?.profilePic?.url,
    u?.profile?.avatarUrl,
    u?.profile?.imageUrl,
    u?.profile?.photoUrl,
    u?.profile?.pictureUrl,
    u?.profile?.avatar?.url,
    u?.profile?.image?.url,
    u?.profile?.photo?.url,
    u?.profile?.picture?.url,
    u?.photos?.[0]?.url,
    u?.images?.[0]?.url,
    u?.media?.avatar?.url,
    u?.profilePhotoId && `/files/${u.profilePhotoId}`,
    u?.avatarId && `/files/${u.avatarId}`
  );
  return urlLike || null;
};

const initialsOf = (nameish) => {
  const s = (nameish || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("").toUpperCase();
};

export default function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: counts } = useCounts();
  const unreadChats = useUnreadCount(15000); // threads with unread > 0
  const { t, i18n } = useTranslation();

  const [theme, setTheme] = useState(getInitialTheme);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  const menuRef = useRef(null);
  const firstItemRef = useRef(null);
  const lastItemRef = useRef(null);

  const avatarUrl = useMemo(
    () => toAbsoluteUrl(pickAvatarPath(user)),
    [user]
  );
  const displayName =
    user?.name || user?.displayName || user?.username || "You";
  const showImg = !!avatarUrl && !imgErr;

  // Theme sync
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ui.theme", theme);
  }, [theme]);

  // Close user menu on outside click
  useEffect(() => {
    const onDocPointer = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointer, { passive: true });
    return () => document.removeEventListener("pointerdown", onDocPointer);
  }, []);

  // Close with ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = i18n.language.startsWith("am") ? "am" : "en";
  }, [i18n.language]);

  // Focus first item when opening
  useEffect(() => {
    if (menuOpen) firstItemRef.current?.focus();
  }, [menuOpen]);

  // Mobile drawer toggle
  const toggleMobileDrawer = useCallback(() => {
    window.dispatchEvent(new CustomEvent("app:toggle-drawer"));
  }, []);

  // Scroll state (glassy header after threshold)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onMenuKeyDown = (e) => {
    if (e.key === "Tab") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      firstItemRef.current?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      lastItemRef.current?.focus();
    }
  };

  // Prefer unread chats (threads) for the badge; fall back to counts' fields if present
  const unreadBadge =
    Number(
      unreadChats ?? counts?.unreadThreads ?? counts?.unreadMessages ?? 0
    ) || 0;

  const pendingRequests = Number(counts?.pendingRequests ?? 0) || 0;
  const notifCount = Number(counts?.notifications ?? 0) || 0;

  return (
    <header className={styles.header} data-scrolled={scrolled}>
      <div className={styles.row}>
        {/* Left: menu + logo */}
        <div className={styles.left}>
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={t('nav.openNavigation')}
            title={t('nav.openNavigation')}
            aria-controls="app-drawer"
            onClick={toggleMobileDrawer}
          >
            <Icon name="menu" width={22} height={22} />
            <span className={styles.srOnly}>{t('nav.openNavigation')}</span>
          </button>

          <Link
            to="/app/home"
            className={styles.logo}
            aria-label={`${t('nav.habesha')} ${t('nav.home')}`}
            title={t('nav.home')}
          >
            <span className={styles.mark} aria-hidden>
              HC
            </span>
            <strong className={styles.brand}>{t('nav.habesha')}</strong>
          </Link>
        </div>

        {/* Center: inline search trigger (SearchPopover handles all logic/UI) */}
        <div className={styles.searchIconWrap}>
          <SearchPopover />
        </div>

        {/* Right: Friends, Bell, Messages, Avatar, Theme */}
        <div className={styles.right}>
          <Link
            to="/app/friends"
            aria-label={`${t('nav.friends')}${
              pendingRequests ? `, ${pendingRequests} pending` : ""
            }`}
            title={t('nav.friends')}
          >
            <NoticeBadge
              icon="users"
              value={pendingRequests}
              tone="primary"
              plainTile
            />
          </Link>

          <span
            className={styles.tip}
            title={t('nav.notifications')}
            aria-hidden="false"
          >
            <NotificationBell plain count={notifCount} />
          </span>

          <Link
            to="/app/messages"
            aria-label={`${t('nav.messages')}${
              unreadBadge ? `, ${unreadBadge} unread chats` : ""
            }`}
            title={t('nav.messages')}
            data-unread={unreadBadge > 0 ? "true" : "false"}
          >
            <NoticeBadge
              icon="message"
              value={unreadBadge}
              tone="accent"
              plainTile
            />
          </Link>

          <div className={styles.userMenu} ref={menuRef}>
            <button
              className={styles.userBtn}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="app-header-user-menu"
              onClick={() => setMenuOpen((o) => !o)}
              onKeyDown={onMenuKeyDown}
              aria-label={t('nav.account')}
              title={t('nav.account')}
            >
              <span className={styles.avatar} aria-hidden>
                {showImg ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className={styles.avatarImg}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={() => setImgErr(true)}
                  />
                ) : (
                  <span className={styles.initials}>
                    {initialsOf(displayName)}
                  </span>
                )}
              </span>
              <span className={styles.name}>{displayName}</span>
            </button>

            {menuOpen && (
              <ul
                className={styles.menuList}
                role="menu"
                aria-label={t('nav.account')}
                id="app-header-user-menu"
              >
                <li role="none">
                  <Link
                    to="/app/profile"
                    role="menuitem"
                    ref={firstItemRef}
                    onClick={() => setMenuOpen(false)}
                    title={t('nav.profile')}
                  >
                    {t('nav.profile')}
                  </Link>
                </li>
                <li role="none">
                  <Link
                    to="/app/settings"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    title={t('nav.settings')}
                  >
                    {t('nav.settings')}
                  </Link>
                </li>
                <li role="none">
                  <button
                    type="button"
                    role="menuitem"
                    ref={lastItemRef}
                    onClick={() => {
                      logout();
                      enterpriseToast.success(t('toast.loggedOut'));
                      setMenuOpen(false);
                      navigate("/login");
                    }}
                    title={t('nav.logout')}
                  >
                    {t('nav.logout')}
                  </button>
                </li>
              </ul>
            )}
          </div>

          <span className={styles.tip} title="Language">
            <LanguageToggle />
          </span>

          <span className={styles.tip} title="Theme">
            <div className={styles.theme}>
              <ThemeToggle onToggle={(next) => setTheme(next)} />
            </div>
          </span>
        </div>
      </div>
    </header>
  );
}
