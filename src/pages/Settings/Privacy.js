// src/pages/Settings/Privacy.js
import React from "react";
import { useTranslation } from "react-i18next";
import useUserSettings from "./hooks/useUserSettings";
import styles from "../../stylus/sections/Settings.module.scss";
import { SectionLoader } from "../../components/ui/SectionLoader/SectionLoader";

const VIS_OPTIONS = ["PUBLIC", "FRIENDS", "REQUEST", "ONLY_ME"];

export default function PrivacySettings() {
  const { t } = useTranslation();
  const { settings, update, saving } = useUserSettings();

  const val = (k, fallback) => (settings ? settings[k] ?? fallback : fallback);

  if (!settings) {
    return (
      <div className={styles.panel}>
        <SectionLoader message={t('settings.privacy.loadingPrivacySettings')} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('settings.privacy.title')}</h1>

      {/* Contact info visibility + Status/Discoverability */}
      <section className={styles.panelGrid} aria-label={t('settings.privacy.title')}>
        {/* Contact info visibility */}
        <div className={styles.card}>
          <h2>{t('settings.privacy.contactInfoVisibility')}</h2>

          <label htmlFor="emailVisibility">{t('settings.privacy.emailVisibility')}</label>
          <select
            id="emailVisibility"
            aria-describedby="emailVisibilityHelp"
            value={val("emailVisibility", "FRIENDS")}
            onChange={(e) => update({ emailVisibility: e.target.value })}
          >
            {VIS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v.replace("_", " ")}
              </option>
            ))}
          </select>

          <label className={styles.mt8} htmlFor="phoneVisibility">
            {t('settings.privacy.phoneVisibility')}
          </label>
          <select
            id="phoneVisibility"
            aria-describedby="phoneVisibilityHelp"
            value={val("phoneVisibility", "REQUEST")}
            onChange={(e) => update({ phoneVisibility: e.target.value })}
          >
            {VIS_OPTIONS.map((v) => (
              <option key={v} value={v}>
                {v.replace("_", " ")}
              </option>
            ))}
          </select>

          <p id="emailVisibilityHelp" className={styles.help}>
            {t('settings.privacy.requestHelp')}
          </p>
        </div>

        {/* Status & discoverability */}
        <div className={styles.card}>
          <h2>{t('settings.privacy.statusDiscoverability')}</h2>

          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={!!val("showOnlineStatus", true)}
              onChange={(e) => update({ showOnlineStatus: e.target.checked })}
            />
            <span>{t('settings.privacy.showOnlineStatus')}</span>
          </label>

          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={!!val("showLastSeen", true)}
              onChange={(e) => update({ showLastSeen: e.target.checked })}
            />
            <span>{t('settings.privacy.showLastSeen')}</span>
          </label>

          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={!!val("searchable", true)}
              onChange={(e) => update({ searchable: e.target.checked })}
            />
            <span>{t('settings.privacy.allowSearch')}</span>
          </label>

          <p className={styles.help}>
            {t('settings.privacy.discoverabilityHelp')}
          </p>
        </div>
      </section>

      <div className={styles.footerRow} aria-live="polite" aria-atomic="true">
        {saving ? t('forms.saving') : " "}
      </div>
    </div>
  );
}