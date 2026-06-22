// src/components/CookieConsent/CookieConsent.jsx
//
// Lightweight, GDPR-style cookie consent banner.
//  - Shows only until the user makes a choice (persisted in localStorage).
//  - "Accept all" vs "Essential only" so the choice is transparent.
//  - Themed to the warm/cultural design, safe-area aware for the mobile app.
//
// Other code can read the saved choice via getCookieConsent() before loading
// any non-essential / analytics scripts.

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import styles from "./CookieConsent.module.scss";

const STORAGE_KEY = "hc.cookieConsent";

/** Returns { level: 'accepted'|'essential', at, v } or null if undecided. */
export function getCookieConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show when the user hasn't decided yet. Small delay so it slides in
    // after the first paint instead of competing with initial render.
    if (getCookieConsent()) return undefined;
    const id = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(id);
  }, []);

  const choose = (level) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ level, at: new Date().toISOString(), v: 1 })
      );
    } catch {
      /* ignore storage failures (private mode, etc.) */
    }
    // Expose for any consent-gated code (analytics, etc.)
    if (typeof window !== "undefined") window.__cookieConsent = level;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={styles.wrap}
      role="dialog"
      aria-live="polite"
      aria-label={t("cookies.title")}
    >
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <Cookie size={22} />
        </div>

        <div className={styles.body}>
          <h2 className={styles.title}>{t("cookies.title")}</h2>
          <p className={styles.message}>
            {t("cookies.message")}{" "}
            <Link to="/about" className={styles.link}>
              {t("cookies.learnMore")}
            </Link>
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.decline}
            onClick={() => choose("essential")}
          >
            {t("cookies.decline")}
          </button>
          <button
            type="button"
            className={styles.accept}
            onClick={() => choose("accepted")}
          >
            {t("cookies.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
