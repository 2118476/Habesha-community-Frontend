import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function TravelEmpty() {
  const { t } = useTranslation();
  
  return (
    <div style={{ background:'#f9fafb', border:'1px solid #eee', borderRadius:14, padding:16 }}>
      <b>{t('travel.noTravelYet')}</b>
      <div style={{ marginTop: 10 }}>
        <Link className="btn" to="/app/travel/post">{t('travel.postTravel')}</Link>
      </div>
    </div>
  );
}
