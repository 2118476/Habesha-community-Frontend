import React from 'react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div style={{padding:16}}>
      <h2>{t('pages.notFound')}</h2>
      <p>{t('pages.pageNotExist')}</p>
    </div>
  );
}