import React from 'react';
import ProfileChip from './ProfileChip';
import ContactButton from './ContactButton';
import styles from '../stylus/components/EntityMetaBar.module.scss';

export default function EntityMetaBar({ postedBy, createdAt, context }) {
  const time = createdAt ? new Date(createdAt).toLocaleString() : null;
  return (
    <div className={styles.bar}>
      <ProfileChip user={postedBy} subtext={time} />
      <div className={styles.spacer} />
      {postedBy?.id && <ContactButton toUserId={postedBy.id} context={context} className={styles.btn} />}
    </div>
  );
}
