import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Subscriptions displays placeholder cards for subscription plans. The
 * backend has not implemented the purchase logic yet, so the UI
 * simply indicates that this feature is coming soon.
 */
const Subscriptions = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('settings.subscriptions')}</h2>
      <p>{t('settings.subscriptionsComingSoon')}</p>
    </div>
  );
};

export default Subscriptions;