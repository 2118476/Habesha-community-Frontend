// FILE: src/pages/Settings/Display.js
// src/pages/Settings/Display.js
import React, { useEffect, useCallback } from "react";
import useUserSettings from "./hooks/useUserSettings";
import {
  applyTheme,
  applyFontScale,
} from "./utils/theme";
import { SectionLoader } from "../../components/ui/SectionLoader/SectionLoader";
import styles from "../../stylus/sections/Settings.module.scss";

const THEME_OPTIONS = ["LIGHT", "DARK", "SYSTEM", "HIGH_CONTRAST"];
const FONT = ["SMALL", "DEFAULT", "LARGE"];

export default function DisplaySettings() {
  const { settings, update, saving } = useUserSettings();

  // Apply current settings to <html data-*> immediately when settings change
  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);
    applyFontScale(settings.fontScale);
  }, [settings]);

  const onRadioActivate = useCallback((setter) => (e) => {
    // Allow Enter/Space when focused on a pill “radio”
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    if (e.preventDefault) e.preventDefault();
    setter();
  }, []);

  if (!settings) return (
    <div className={styles.panel}>
      <SectionLoader message="Loading display settings..." />
    </div>
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Display & Accessibility</h1>

      {/* Theme */}
      <section className={styles.panel}>
        <h2>Theme</h2>
        <div
          className={styles.pills}
          role="radiogroup"
          aria-label="Theme selection"
        >
          {THEME_OPTIONS.map((opt) => {
            const active = settings.theme === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.pill} ${active ? styles.active : ""}`}
                onClick={() => update({ theme: opt })}
                onKeyDown={onRadioActivate(() => update({ theme: opt }))}
              >
                {opt.replace("_", " ")}
              </button>
            );
          })}
        </div>
        <p className={styles.help}>
          <strong>System</strong> follows your OS setting.{" "}
          <strong>High-contrast</strong> boosts contrast for readability.
        </p>
      </section>

      {/* Font size */}
      <section className={styles.panel}>
        <h2>Font size</h2>
        <div
          className={styles.pills}
          role="radiogroup"
          aria-label="Font size"
        >
          {FONT.map((opt) => {
            const active = settings.fontScale === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.pill} ${active ? styles.active : ""}`}
                onClick={() => update({ fontScale: opt })}
                onKeyDown={onRadioActivate(() => update({ fontScale: opt }))}
              >
                {opt.toLowerCase()}
              </button>
            );
          })}
        </div>
        <p className={styles.help}>
          Changes the base font size across the entire application.
        </p>
      </section>

      <div
        className={styles.footerRow}
        aria-live="polite"
        aria-atomic="true"
      >
        {saving ? "Saving…" : " "}
      </div>
    </div>
  );
}
