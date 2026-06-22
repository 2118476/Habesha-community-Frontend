import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfileChip from './ProfileChip';
import ContactButton from './ContactButton';
import { timeAgo, fullDate } from '../utils/timeAgo';
import styles from '../stylus/components/EntityMetaBar.module.scss';

export default function EntityMetaBar({ postedBy, createdAt, context }) {
  const { t, i18n } = useTranslation();
  const locale = i18n?.language || 'en';

  // Relative "2 hours ago" with a full-date tooltip for accessibility.
  const relative = createdAt ? timeAgo(createdAt, locale) : null;
  const subtext = relative ? `${t('common.posted')} ${relative}` : null;
  const title = createdAt ? fullDate(createdAt, locale) : undefined;

  return (
    <div className={styles.bar}>
      <ProfileChip user={postedBy} subtext={subtext} subtextTitle={title} />
      <div className={styles.spacer} />
      {postedBy?.id && <ContactButton toUserId={postedBy.id} context={context} className={styles.btn} />}
    </div>
  );
}
