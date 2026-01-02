// src/components/ProfileChip.jsx
import React from 'react';
import Avatar from './Avatar';
import ProfileLink from './ProfileLink';
import styles from '../stylus/components/ProfileChip.module.scss';

const getAvatarUrl = (u) =>
  u?.avatarUrl ||
  u?.avatar?.secureUrl ||
  u?.avatar?.url ||
  u?.photoUrl ||
  u?.profileImageUrl ||
  u?.imageUrl ||
  u?.profile?.avatarUrl ||
  null;

// ID used for links (profile pages)
const getLinkUserId = (u) =>
  u?.profileId ?? u?.accountId ?? u?.id ?? u?.userId ?? u?._id ?? null;

// ID the Avatar component should use to fetch the image
const getAvatarUserId = (u) =>
  u?.accountId ?? u?.profileId ?? u?.userId ?? u?.id ?? u?._id ?? null;

const getDisplayName = (u) =>
  u?.displayName || u?.name || u?.fullName || u?.username || 'User';

export default function ProfileChip({ user, subtext, link = true, size = 'md', className }) {
  if (!user) return null;

  const linkUserId = getLinkUserId(user);
  const avatarUserId = getAvatarUserId(user);
  const displayName = getDisplayName(user);
  const src = getAvatarUrl(user);

  return (
    <div className={`${styles.chip} ${className || ''}`} data-size={size} title={displayName}>
      <Avatar
        userId={avatarUserId}
        src={src}
        size={size}
        link={link}
        alt={displayName}
      />
      <div className={styles.meta}>
        {link && linkUserId ? (
          <ProfileLink userId={linkUserId} className={styles.name}>
            {displayName}
          </ProfileLink>
        ) : (
          <span className={styles.name}>{displayName}</span>
        )}
        {subtext ? <div className={styles.subtext}>{subtext}</div> : null}
      </div>
    </div>
  );
}
