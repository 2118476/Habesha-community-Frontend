import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HomeSwapEmpty() {
  const { t } = useTranslation();
  return (
    <div style={{ background:'#f9fafb', border:'1px solid #eee', borderRadius:14, padding:16 }}>
      <b>{t('homeSwap.noHomeSwapsYet')}</b> {t('homeSwap.offerYourPlace')}
      <div style={{ marginTop: 10 }}>
        <Link className="btn" to="/app/homeswap/post">{t('homeSwap.postHomeSwap')}</Link>
      </div>
    </div>
  );
}
