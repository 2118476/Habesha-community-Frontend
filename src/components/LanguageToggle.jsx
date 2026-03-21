// src/components/LanguageToggle.jsx
import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.scss';

const LanguageToggle = () => {
  const { i18n, t } = useTranslation();
  const enRef = useRef(null);
  const amRef = useRef(null);

  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
  const isEn = currentLang !== 'am';

  // Use refs to set !important inline — React style prop can't do !important
  useEffect(() => {
    if (enRef.current) {
      enRef.current.style.setProperty('color', isEn ? '#2563eb' : '', 'important');
    }
    if (amRef.current) {
      amRef.current.style.setProperty('color', !isEn ? '#2563eb' : '', 'important');
    }
  }, [isEn]);

  const switchTo = (lang) => {
    if (currentLang === lang) return;
    i18n.changeLanguage(lang);
    localStorage.setItem('ui.lang', lang);
  };

  return (
    <span className={styles.toggle} aria-label={t('nav.language')} title={t('nav.language')}>
      <button
        ref={enRef}
        type="button"
        className={`${styles.lang} ${isEn ? styles.active : ''}`}
        onClick={() => switchTo('en')}
        aria-pressed={isEn}
      >
        EN
      </button>
      <span className={styles.separator}>/</span>
      <button
        ref={amRef}
        type="button"
        className={`${styles.lang} ${!isEn ? styles.active : ''}`}
        onClick={() => switchTo('am')}
        aria-pressed={!isEn}
      >
        አማ
      </button>
    </span>
  );
};

export default LanguageToggle;
