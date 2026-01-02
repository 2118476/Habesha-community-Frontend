import React from "react";
import { useTranslation } from "react-i18next";
import styles from "./Footer.module.scss";

export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>&copy; {new Date().getFullYear()} {t('footer.habeshaCommunity')}</span>
        <span className={styles.sep}>•</span>
        <a href="/terms">{t('footer.terms')}</a>
        <span className={styles.meta}>{t('footer.buildVersion')}</span>
      </div>
    </footer>
  );
}
