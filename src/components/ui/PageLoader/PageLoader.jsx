import React from "react";
import { useTranslation } from "react-i18next";
import { Spinner } from "../Spinner/Spinner";
import styles from "./PageLoader.module.scss";

export function PageLoader({ 
  message, 
  className = "",
  ...props 
}) {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');
  
  return (
    <div 
      className={`${styles.pageLoader} ${className}`}
      role="status"
      aria-live="polite"
      {...props}
    >
      <div className={styles.content}>
        <Spinner size="lg" />
        <p className={styles.message}>{displayMessage}</p>
      </div>
    </div>
  );
}

export function MinimalPageLoader({ 
  className = "",
  ...props 
}) {
  const { t } = useTranslation();
  
  return (
    <div 
      className={`${styles.minimalLoader} ${className}`}
      role="status"
      aria-label={t('common.loading')}
      {...props}
    >
      <Spinner size="md" />
    </div>
  );
}