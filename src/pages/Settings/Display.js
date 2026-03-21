// FILE: src/pages/Settings/Display.js
import React, { useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import useUserSettings from "./hooks/useUserSettings";
import {
  applyTheme,
  applyFontScale,
} from "./utils/theme";
import { SectionLoader } from "../../components/ui/SectionLoader/SectionLoader";
import styles from "../../stylus/sections/Settings.module.scss";

const THEME_OPTIONS = ["LIGHT", "DARK", "SYSTEM", "HIGH_CONTRAST"];
const FONT = ["SMALL", "DEFAULT", "LARGE"];
const LANG_OPTIONS = [
  { code: "en", label: "English" },
  { code: "am", label: "አማርኛ" },
];

export default function DisplaySettings() {
  const { settings, update, saving } = useUserSettings();
  const { i18n, t } = useTranslation();

  const currentLang = i18n.resolvedLanguage || i18n.language || "en";

  const themeLabels = {
    LIGHT: t("settings.displaySection.themeLight", "Light"),
    DARK: t("settings.displaySection.themeDark", "Dark"),
    SYSTEM: t("settings.displaySection.themeSystem", "System"),
    HIGH_CONTRAST: t("settings.displaySection.themeHighContrast", "High Contrast"),
  };

  const fontLabels = {
    SMALL: t("settings.displaySection.fontSmall", "Small"),
    DEFAULT: t("settings.displaySection.fontDefault", "Default"),
    LARGE: t("settings.displaySection.fontLarge", "Large"),
  };

  const handleLangChange = useCallback((code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("ui.lang", code);
  }, [i18n]);

  useEffect(() => {
    if (!settings) return;
    applyTheme(settings.theme);
    applyFontScale(settings.fontScale);
  }, [settings]);

  const onRadioActivate = useCallback((setter) => (e) => {
    if (e.type === "keydown" && e.key !== "Enter" && e.key !== " ") return;
    if (e.preventDefault) e.preventDefault();
    setter();
  }, []);

  if (!settings) return (
    <div className={styles.panel}>
      <SectionLoader message={t("settings.displaySection.loading", "Loading display settings...")} />
    </div>
  );

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>
        {t("settings.displaySection.title", "Display & Accessibility")}
      </h1>

      {/* Theme */}
      <section className={styles.panel}>
        <h2>{t("settings.displaySection.theme", "Theme")}</h2>
        <div
          className={styles.pills}
          role="radiogroup"
          aria-label={t("settings.displaySection.theme", "Theme")}
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
                {themeLabels[opt] || opt}
              </button>
            );
          })}
        </div>
        <p className={styles.help}>
          {t("settings.displaySection.themeHelp", "System follows your OS setting. High-contrast boosts contrast for readability.")}
        </p>
      </section>

      {/* Font size */}
      <section className={styles.panel}>
        <h2>{t("settings.displaySection.fontSize", "Font size")}</h2>
        <div
          className={styles.pills}
          role="radiogroup"
          aria-label={t("settings.displaySection.fontSize", "Font size")}
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
                {fontLabels[opt] || opt.toLowerCase()}
              </button>
            );
          })}
        </div>
        <p className={styles.help}>
          {t("settings.displaySection.fontSizeHelp", "Changes the base font size across the entire application.")}
        </p>
      </section>

      {/* Language */}
      <section className={styles.panel}>
        <h2>{t("settings.displaySection.language", "Language")}</h2>
        <div
          className={styles.pills}
          role="radiogroup"
          aria-label={t("settings.displaySection.language", "Language")}
        >
          {LANG_OPTIONS.map((opt) => {
            const active = currentLang === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                role="radio"
                aria-checked={active}
                className={`${styles.pill} ${active ? styles.active : ""}`}
                onClick={() => handleLangChange(opt.code)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <p className={styles.help}>
          {t("settings.displaySection.languageHelp", "Choose your preferred language for the interface.")}
        </p>
      </section>

      <div
        className={styles.footerRow}
        aria-live="polite"
        aria-atomic="true"
      >
        {saving ? t("settings.displaySection.saving", "Saving…") : " "}
      </div>
    </div>
  );
}
