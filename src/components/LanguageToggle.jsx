// src/components/LanguageToggle.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageToggle.module.scss';

const LanguageToggle = () => {
  const { i18n, t } = useTranslation();
  
  const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
  const isAmharic = currentLang === 'am';
  
  const handleToggle = () => {
    const nextLang = isAmharic ? 'en' : 'am';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('ui.lang', nextLang);
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleToggle}
      aria-label={t('nav.language')}
      title={t('nav.language')}
    >
      <span className={styles.current}>
        {isAmharic ? 'አማ' : 'EN'}
      </span>
      <span className={styles.separator}>/</span>
      <span className={styles.next}>
        {isAmharic ? 'EN' : 'አማ'}
      </span>
    </button>
  );
};

export default LanguageToggle;