// src/pages/Settings/Notifications.js
import React, { useEffect, useRef, useState } from "react";
import useUserSettings from "./hooks/useUserSettings";
import styles from "../../stylus/sections/Settings.module.scss";
import { SectionLoader } from "../../components/ui/SectionLoader/SectionLoader";

// Visible categories in the UI
const CATEGORIES = [
  { key: "messages",       label: "Messages" },
  { key: "friendRequests", label: "Friend Requests" },
  { key: "comments",       label: "Comments" },
  { key: "likes",          label: "Likes" },
  { key: "mentions",       label: "Mentions / Tags" },
  { key: "rentals",        label: "Rentals" },
  { key: "services",       label: "Services" },
  { key: "events",         label: "Events" },
  { key: "system",         label: "System" },
];

const DIGEST = ["DAILY", "WEEKLY", "OFF"];

// Small curated TZ list (can expand later)
const TZ_OPTIONS = [
  "Europe/London",
  "Europe/Paris",
  "Africa/Addis_Ababa",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
];

const fallbackTZ =
  (typeof Intl !== "undefined" &&
    Intl.DateTimeFormat?.().resolvedOptions?.().timeZone) ||
  "Europe/London";

function defaults() {
  return {
    categories: {
      messages:       { inApp: true,  email: true  },
      friendRequests: { inApp: true,  email: true  },
      comments:       { inApp: true,  email: false },
      likes:          { inApp: true,  email: false },
      mentions:       { inApp: true,  email: true  },
      rentals:        { inApp: true,  email: true  },
      services:       { inApp: true,  email: true  },
      events:         { inApp: true,  email: true  },
      system:         { inApp: true,  email: true  },
    },
    quietHours: { start: "22:00", end: "08:00", tz: fallbackTZ || "Europe/London" },
    digest: "OFF",
  };
}

// Merge any existing shape with defaults safely
function mergeNotifications(existing) {
  const d = defaults();
  if (!existing || typeof existing !== "object") return d;

  const out = { ...d, ...existing };
  out.categories = { ...d.categories, ...(existing.categories || {}) };
  for (const k of Object.keys(d.categories)) {
    const row = { ...d.categories[k], ...(existing.categories?.[k] || {}) };
    row.inApp = !!row.inApp;
    row.email = !!row.email;
    out.categories[k] = row;
  }
  const eq = existing.quietHours || {};
  out.quietHours = {
    start: eq.start || d.quietHours.start,
    end:   eq.end   || d.quietHours.end,
    tz:    eq.tz    || d.quietHours.tz,
  };
  out.digest = existing.digest || d.digest;
  return out;
}

function isValidTime(str) {
  return /^\d{2}:\d{2}$/.test(str);
}
function quietHoursValid(qh) {
  if (!qh) return true;
  if (!isValidTime(qh.start) || !isValidTime(qh.end)) return false;
  // Must not be equal; wrapping over midnight is allowed.
  return qh.start !== qh.end;
}

export default function NotificationSettings() {
  const { settings, update, saving } = useUserSettings();

  // Hooks must be top-level: declare everything upfront
  const [model, setModel] = useState(defaults());
  const [ready, setReady] = useState(false);
  const initialised = useRef(false);

  // Hydrate from server once settings arrive/refresh
  useEffect(() => {
    const merged = mergeNotifications(settings?.notifications);
    setModel(merged);
    setReady(true);
    initialised.current = true;
  }, [settings?.notifications]);

  // Persist whenever model changes (and is valid)
  useEffect(() => {
    if (!initialised.current) return;
    if (!quietHoursValid(model.quietHours)) return;
    update({ notifications: model });
  }, [model, update]);

  // ----- handlers -----
  const toggleCategory = (catKey, channel) => (e) => {
    const checked = !!e.target.checked;
    setModel((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [catKey]: { ...prev.categories[catKey], [channel]: checked },
      },
    }));
  };

  const toggleAll = (channel, value) => {
    setModel((prev) => {
      const next = { ...prev, categories: { ...prev.categories } };
      for (const { key } of CATEGORIES) {
        next.categories[key] = { ...next.categories[key], [channel]: value };
      }
      return next;
    });
  };

  const onStartChange = (e) =>
    setModel((p) => ({ ...p, quietHours: { ...p.quietHours, start: e.target.value } }));

  const onEndChange = (e) =>
    setModel((p) => ({ ...p, quietHours: { ...p.quietHours, end: e.target.value } }));

  const onTzChange = (e) =>
    setModel((p) => ({ ...p, quietHours: { ...p.quietHours, tz: e.target.value } }));

  const setDigest = (val) => setModel((p) => ({ ...p, digest: val }));

  const qhError = !quietHoursValid(model.quietHours)
    ? "Quiet hours ‘start’ and ‘end’ must be different (wrapping over midnight is okay)."
    : "";

  // Derived booleans (no useMemo to keep linter happy)
  const allInAppChecked = CATEGORIES.every(({ key }) => !!model.categories[key]?.inApp);
  const allEmailChecked = CATEGORIES.every(({ key }) => !!model.categories[key]?.email);

  // Early return is allowed here (after hooks)
  if (!ready) {
    return (
      <div className={styles.panel}>
        <SectionLoader message="Loading notification settings..." />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Notifications</h1>

      {/* Categories × Channels */}
      <section className={styles.panel}>
        <h2>Categories &amp; Channels</h2>

        <div className={styles.rowRight} style={{ marginBottom: 8 }}>
          <label className={styles.switch} title="Toggle all in-app">
            <input
              type="checkbox"
              checked={allInAppChecked}
              onChange={(e) => toggleAll("inApp", e.target.checked)}
            />
            <span>All In-App</span>
          </label>
          <label className={styles.switch} title="Toggle all email" style={{ marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={allEmailChecked}
              onChange={(e) => toggleAll("email", e.target.checked)}
            />
            <span>All Email</span>
          </label>
        </div>

        <div className={styles.table} role="table" aria-label="Notification categories and channels">
          <div className={styles.th} role="columnheader">Category</div>
          <div className={styles.th} role="columnheader">In-App</div>
          <div className={styles.th} role="columnheader">Email</div>
          <div className={styles.th} role="columnheader">Notes</div>

          {CATEGORIES.map(({ key, label }) => {
            const row = model.categories[key] || { inApp: false, email: false };
            return (
              <div key={key} className={styles.tr} role="row">
                <div role="cell">{label}</div>
                <div role="cell">
                  <input
                    type="checkbox"
                    checked={!!row.inApp}
                    onChange={toggleCategory(key, "inApp")}
                    aria-label={`${label} in-app`}
                  />
                </div>
                <div role="cell">
                  <input
                    type="checkbox"
                    checked={!!row.email}
                    onChange={toggleCategory(key, "email")}
                    aria-label={`${label} email`}
                  />
                </div>
                <div role="cell" className={styles.help}>
                  {key === "system" ? "Security, policy & critical updates" : " "}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quiet hours */}
      <section className={styles.panel}>
        <h2>Quiet hours (Do Not Disturb)</h2>
        <div className={styles.formGrid}>
          <label htmlFor="qh-start">Start</label>
          <input
            id="qh-start"
            type="time"
            value={model.quietHours.start}
            onChange={onStartChange}
          />

          <label htmlFor="qh-end">End</label>
          <input
            id="qh-end"
            type="time"
            value={model.quietHours.end}
            onChange={onEndChange}
          />

          <label htmlFor="qh-tz">Timezone</label>
          <select id="qh-tz" value={model.quietHours.tz} onChange={onTzChange}>
            {TZ_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {qhError ? (
          <p className={styles.help} role="alert" aria-live="polite" style={{ marginTop: 8 }}>
            {qhError}
          </p>
        ) : (
          <p className={styles.help} style={{ marginTop: 8 }}>
            Notifications will be muted daily between the selected times ({model.quietHours.tz}).
          </p>
        )}
      </section>

      {/* Email digest */}
      <section className={styles.panel}>
        <h2>Email digest</h2>
        <div role="radiogroup" aria-label="Email digest frequency" className={styles.pills}>
          {DIGEST.map((opt) => {
            const active = model.digest === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.pill} ${active ? styles.active : ""}`}
                onClick={() => setDigest(opt)}
              >
                {opt.charAt(0) + opt.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
        <p className={styles.help}>
          Choose a summary email of your account activity, or turn it off.
        </p>
      </section>

      <div className={styles.footerRow} aria-live="polite" aria-atomic="true">
        {saving ? "Saving…" : " "}
      </div>
    </div>
  );
}
